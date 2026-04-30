from fastapi import APIRouter, HTTPException
from models.user import UserPreference
import app_state

router = APIRouter(prefix="/recommend", tags=["recommendation"])


@router.post("/")
async def recommend_foods(pref: UserPreference):
    """
    Structured recommendation endpoint.
    Accepts diet type, calorie limit, taste preferences, cuisines, and allergies.
    Returns up to 8 ranked food recommendations with scores and reasons.
    """
    rec = app_state.recommender
    if rec is None or not rec.is_fitted:
        raise HTTPException(status_code=503, detail="Recommender model not ready yet")

    results = rec.recommend(pref.model_dump(), n=8)
    return {
        "recommendations": results,
        "count": len(results),
        "preferences_used": pref.model_dump(),
    }
