from fastapi import APIRouter, HTTPException
from models.user import NLQuery
from ml.nlp_processor import parse_query
import app_state

router = APIRouter(prefix="/query", tags=["nlp"])


@router.post("/")
async def query_foods(body: NLQuery):
    """
    Natural-language query endpoint.
    Parses free-text (e.g. 'I want something light and healthy with protein')
    into structured preferences, then runs the recommender.
    Returns parsed preferences + ranked recommendations.
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Query text must not be empty")

    parsed = parse_query(body.text)

    rec = app_state.recommender
    results = []
    if rec and rec.is_fitted:
        results = rec.recommend(parsed, n=8)

    return {
        "query": body.text,
        "parsed_preferences": parsed,
        "recommendations": results,
        "count": len(results),
    }
