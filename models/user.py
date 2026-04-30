from pydantic import BaseModel
from typing import List, Optional


class UserPreference(BaseModel):
    diet_type: str = "any"                   # vegetarian, vegan, non-vegetarian, any
    max_calories: int = 800
    taste_preferences: List[str] = []        # spicy, sweet, savory, tangy, light
    cuisines: List[str] = []                 # Indian, Western, Asian, Mediterranean
    allergies: List[str] = []               # gluten, dairy, nuts, eggs
    high_protein: bool = False


class NLQuery(BaseModel):
    text: str


class RecommendationResult(BaseModel):
    food: dict
    score: float
    reason: str
