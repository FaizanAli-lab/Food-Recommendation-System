"""
Global application state shared across routers.
Populated during FastAPI lifespan startup.
"""
from typing import Optional, List, Dict

recommender = None       # FoodRecommender instance
recognizer = None        # FoodImageRecognizer instance
foods_cache: List[Dict] = []   # In-memory food list for fast access
