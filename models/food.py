from pydantic import BaseModel
from typing import Optional, List


class FoodItem(BaseModel):
    id: Optional[str] = None
    name: str
    category: str          # breakfast, lunch, dinner, snack, dessert, side
    cuisine: str           # Indian, Western, Asian, Mediterranean
    calories: int
    protein: float
    fat: float
    carbs: float
    tags: List[str] = []
    description: str = ""
    emoji: str = "🍽️"
    why_healthy: str = ""

    class Config:
        populate_by_name = True
