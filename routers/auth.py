"""
Authentication Router — Name + Password (stored in MongoDB)
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt

from config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
from db.database import get_users_collection
from models.auth import RegisterRequest, LoginRequest, TokenResponse, UserProfile


router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Bearer token scheme ─────────────────────────────────────
security = HTTPBearer()


# ── Password Helpers ────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT Helpers ──────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """FastAPI dependency — extracts and validates JWT, returns user dict."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        name: str = payload.get("sub")
        if name is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    collection = get_users_collection()
    if collection is None:
        # DB unavailable — return info from token
        return {"name": name}

    user = await collection.find_one({"name": name})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return {"name": user["name"]}


# ── Endpoints ────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    """
    Register a new user with name + password.
    Name must be unique. Password is hashed with bcrypt before storage.
    """
    name = body.name.strip()
    collection = get_users_collection()

    if collection is not None:
        existing = await collection.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        if existing:
            raise HTTPException(status_code=409, detail="That name is already taken. Please choose another.")

        user_doc = {
            "name": name,
            "password_hash": hash_password(body.password),
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
        }
        await collection.insert_one(user_doc)
    # If DB is down, we still issue a token (in-memory mode)

    token = create_access_token({"sub": name})
    return TokenResponse(access_token=token, user={"name": name})


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """
    Log in with name + password.
    Returns a JWT on success.
    """
    name = body.name.strip()
    collection = get_users_collection()

    if collection is None:
        # DB unavailable — cannot verify password, reject login
        raise HTTPException(status_code=503, detail="Database unavailable. Cannot verify credentials.")

    user = await collection.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid name or password.")

    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    token = create_access_token({"sub": user["name"]})
    return TokenResponse(access_token=token, user={"name": user["name"]})


@router.get("/me", response_model=UserProfile)
async def me(user: dict = Depends(get_current_user)):
    return UserProfile(**user)
