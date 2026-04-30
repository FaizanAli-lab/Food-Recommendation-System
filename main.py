"""
FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ✅ ADD THIS

import app_state
from config import ALLOWED_ORIGINS
from db.database import connect_db, close_db, get_foods_collection
from db.seed_data import SEED_FOODS
from ml.recommender import FoodRecommender
from cv.image_recognizer import FoodImageRecognizer
from routers import foods, recommend, nlp, image, auth


# ── Lifespan ────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    mongo_ok = await connect_db()

    if mongo_ok:
        collection = get_foods_collection()
        count = await collection.count_documents({})
        if count == 0:
            await collection.insert_many([dict(f) for f in SEED_FOODS])
        all_foods = await collection.find({}).to_list(length=None)
    else:
        all_foods = [dict(f) for f in SEED_FOODS]

    app_state.foods_cache = all_foods

    rec = FoodRecommender()
    rec.fit(all_foods)
    app_state.recommender = rec

    recognizer = FoodImageRecognizer()
    recognizer.load_model()
    app_state.recognizer = recognizer

    yield

    await close_db()


# ── App ──────────────────────────────────────────────────────

app = FastAPI(
    title="Smart Eats",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── STATIC FILE FIX ( THIS IS WHAT YOU WERE MISSING)

app.mount(
    "/images",
    StaticFiles(directory="images"),  # 👈 your folder name
    name="images"
)

# ── Routers ────────────────────────────────────────────────

app.include_router(foods.router)
app.include_router(recommend.router)
app.include_router(nlp.router)
app.include_router(image.router)
app.include_router(auth.router)


# ── Root ─────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "running"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "foods_loaded": len(app_state.foods_cache),
    }