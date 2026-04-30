"""
NLP Processor — NLTK-based natural language query parser.
Converts free-text food queries into structured UserPreference dicts
that can be consumed directly by the ML recommender.
"""

import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer


def _download_nltk():
    for resource in ["punkt", "punkt_tab", "stopwords", "wordnet", "omw-1.4"]:
        try:
            nltk.download(resource, quiet=True)
        except Exception:
            pass


_download_nltk()

# ── Keyword intent maps ───────────────────────────────────────────────────────

DIET_KEYWORDS = {
    "vegan": [
        "vegan", "plant-based", "plant based", "no dairy", "no animal",
        "no meat no dairy",
    ],
    "vegetarian": [
        "vegetarian", "veg", "veggie", "meatless", "no meat",
        "without meat", "no chicken", "no fish",
    ],
    "non-vegetarian": [
        "non-vegetarian", "nonvegetarian", "meat", "chicken", "mutton",
        "fish", "seafood", "beef", "pork", "prawn", "lamb", "non veg",
    ],
}

TASTE_KEYWORDS = {
    "spicy": [
        "spicy", "hot", "fiery", "pungent", "chilli", "chili",
        "pepper", "spice", "burn", "zesty",
    ],
    "sweet": [
        "sweet", "dessert", "sugary", "honey", "chocolate",
        "candy", "indulgent", "treat",
    ],
    "savory": [
        "savory", "savoury", "salty", "umami", "hearty", "rich",
        "comfort food", "comforting",
    ],
    "tangy": [
        "tangy", "sour", "citrus", "tart", "acidic", "lemony",
        "vinegary",
    ],
    "light": [
        "light", "healthy", "fresh", "clean", "low calorie",
        "low-calorie", "diet", "slim", "weight loss", "lean",
        "salad", "refreshing",
    ],
}

CALORIE_RULES = {
    "very_low": (
        ["light", "very light", "low calorie", "low-calorie", "salad",
         "diet", "slim", "weight loss", "lean", "minimal"],
        350,
    ),
    "low": (
        ["healthy", "moderate", "balanced", "not too heavy", "fresh"],
        500,
    ),
    "high": (
        ["filling", "heavy", "substantial", "hearty", "high protein",
         "high-protein", "protein", "muscle", "gym", "workout",
         "bulking", "energy"],
        900,
    ),
}

CUISINE_KEYWORDS = {
    "Indian": [
        "indian", "curry", "masala", "tandoori", "biryani", "dal",
        "paneer", "tikka", "dosa", "sambar", "naan", "roti",
    ],
    "Western": [
        "western", "american", "italian", "pizza", "pasta", "burger",
        "sandwich", "salad", "steak", "continental",
    ],
    "Asian": [
        "asian", "chinese", "japanese", "thai", "korean", "sushi",
        "ramen", "noodle", "pad thai", "dim sum", "wok",
    ],
    "Mediterranean": [
        "mediterranean", "greek", "middle eastern", "hummus",
        "falafel", "shakshuka", "halloumi",
    ],
}

ALLERGY_KEYWORDS = {
    "gluten": ["gluten", "wheat", "bread"],
    "dairy": ["dairy", "milk", "lactose", "cheese"],
    "nuts": ["nut", "peanut", "almond", "cashew", "walnut"],
    "eggs": ["egg"],
}

PROTEIN_KEYWORDS = [
    "protein", "muscle", "gym", "workout", "fitness",
    "strength", "bodybuilding", "bulking", "high protein",
]


# ── Core parser ───────────────────────────────────────────────────────────────

def parse_query(text: str) -> dict:
    """
    Parse a natural-language food query into structured preferences.

    Returns a dict compatible with UserPreference:
        diet_type, max_calories, taste_preferences,
        cuisines, allergies, high_protein
    """
    text_lower = text.lower().strip()

    # Tokenize + lemmatize
    try:
        tokens = word_tokenize(text_lower)
        stop_words = set(stopwords.words("english"))
        lemmatizer = WordNetLemmatizer()
        tokens = [
            lemmatizer.lemmatize(t)
            for t in tokens
            if t.isalpha() and t not in stop_words
        ]
    except Exception:
        tokens = re.sub(r"[^a-z\s]", "", text_lower).split()

    prefs: dict = {
        "diet_type": "any",
        "max_calories": 600,
        "taste_preferences": [],
        "cuisines": [],
        "allergies": [],
        "high_protein": False,
    }

    # ── Diet detection (order matters: vegan before vegetarian) ──────────────
    for diet, keywords in DIET_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            prefs["diet_type"] = diet
            break

    # ── Taste detection ───────────────────────────────────────────────────────
    for taste, keywords in TASTE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            if taste not in prefs["taste_preferences"]:
                prefs["taste_preferences"].append(taste)

    # ── Calorie level ─────────────────────────────────────────────────────────
    for level, (keywords, cal_limit) in CALORIE_RULES.items():
        if any(kw in text_lower for kw in keywords):
            prefs["max_calories"] = cal_limit
            break

    # ── Protein preference ────────────────────────────────────────────────────
    if any(kw in text_lower for kw in PROTEIN_KEYWORDS):
        prefs["high_protein"] = True
        prefs["max_calories"] = max(prefs["max_calories"], 700)

    # ── Cuisine preference ────────────────────────────────────────────────────
    for cuisine, keywords in CUISINE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            if cuisine not in prefs["cuisines"]:
                prefs["cuisines"].append(cuisine)

    # ── Allergy detection ─────────────────────────────────────────────────────
    for allergy, keywords in ALLERGY_KEYWORDS.items():
        triggers = [
            f"no {kw}" in text_lower
            or f"without {kw}" in text_lower
            or f"allergic to {kw}" in text_lower
            or f"intolerant to {kw}" in text_lower
            for kw in keywords
        ]
        if any(triggers):
            prefs["allergies"].append(allergy)

    return prefs
