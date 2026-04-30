from fastapi import APIRouter, Query, HTTPException
from db.database import get_foods_collection
from typing import Optional
import app_state

router = APIRouter(prefix="/foods", tags=["foods"])


def _filter_in_memory(category, cuisine, diet, max_calories, skip, limit):
    """Filter foods_cache when MongoDB is not available."""
    foods = app_state.foods_cache
    result = []
    for f in foods:
        if category and f.get("category") != category:
            continue
        if cuisine and f.get("cuisine") != cuisine:
            continue
        if diet:
            tags = f.get("tags", [])
            if diet == "vegetarian" and not any(t in tags for t in ("vegetarian", "vegan")):
                continue
            if diet == "vegan" and "vegan" not in tags:
                continue
            if diet == "non-vegetarian" and "non-vegetarian" not in tags:
                continue
        if max_calories and f.get("calories", 0) > max_calories:
            continue
        result.append({k: v for k, v in f.items() if k != "_id"})
    return result[skip: skip + limit]


@router.get("/")
async def list_foods(
    category: Optional[str] = None,
    cuisine: Optional[str] = None,
    diet: Optional[str] = None,
    max_calories: Optional[int] = None,
    limit: int = Query(default=30, le=100),
    skip: int = 0,
):
    collection = get_foods_collection()
    if collection is None:
        foods = _filter_in_memory(category, cuisine, diet, max_calories, skip, limit)
        return {"foods": foods, "count": len(foods), "source": "memory"}

    query: dict = {}
    if category:
        query["category"] = category
    if cuisine:
        query["cuisine"] = cuisine
    if diet:
        if diet == "vegetarian":
            query["tags"] = {"$in": ["vegetarian", "vegan"]}
        elif diet == "vegan":
            query["tags"] = "vegan"
        elif diet == "non-vegetarian":
            query["tags"] = "non-vegetarian"
    if max_calories:
        query["calories"] = {"$lte": max_calories}

    cursor = collection.find(query, {"_id": 0}).skip(skip).limit(limit)
    foods = await cursor.to_list(length=limit)
    return {"foods": foods, "count": len(foods), "source": "mongodb"}


@router.get("/categories")
async def get_categories():
    foods = app_state.foods_cache
    categories = sorted(set(f.get("category", "") for f in foods))
    cuisines = sorted(set(f.get("cuisine", "") for f in foods))
    return {"categories": categories, "cuisines": cuisines}


@router.get("/{name}")
async def get_food_by_name(name: str):
    # Try in-memory first
    for food in app_state.foods_cache:
        if food.get("name", "").lower() == name.lower():
            return {k: v for k, v in food.items() if k != "_id"}

    collection = get_foods_collection()
    if collection is None:
        raise HTTPException(status_code=404, detail=f"Food '{name}' not found")

    food = await collection.find_one(
        {"name": {"$regex": f"^{name}$", "$options": "i"}}, {"_id": 0}
    )
    if not food:
        raise HTTPException(status_code=404, detail=f"Food '{name}' not found")
    return food
