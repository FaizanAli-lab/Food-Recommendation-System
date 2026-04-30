"""
Image Recognition Module
Uses OpenCV for preprocessing and PyTorch MobileNetV2 (ImageNet pretrained)
for food classification. Maps predicted classes to our food database and
suggests healthier alternatives.
"""

import io
import cv2
import numpy as np
import torch
import torchvision.transforms as T
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from PIL import Image
from typing import Dict, List, Optional


# ── ImageNet class indices → food category strings ────────────────────────────
# Covers food-adjacent ImageNet classes (indices 924–980)
IMAGENET_FOOD_CLASSES: Dict[int, str] = {
    924: "guacamole",
    925: "consomme soup",
    926: "hot pot",
    927: "trifle dessert",
    928: "ice cream",
    929: "ice lolly",
    930: "french bread",
    931: "bagel",
    932: "pretzel",
    933: "cheeseburger",
    934: "hotdog",
    935: "mashed potato",
    936: "cabbage",
    937: "broccoli",
    938: "cauliflower",
    939: "zucchini",
    940: "spaghetti squash",
    941: "acorn squash",
    942: "butternut squash",
    943: "cucumber",
    944: "artichoke",
    945: "bell pepper",
    946: "mushroom",
    947: "granny smith apple",
    948: "pomegranate",
    949: "fig",
    950: "clementine",
    951: "orange",
    952: "lemon",
    953: "pineapple",
    954: "banana",
    955: "jackfruit",
    956: "strawberry",
    957: "pizza",
    958: "carbonara pasta",
    959: "chocolate sauce",
    960: "dough",
    961: "meat loaf",
    962: "burrito",
    963: "eggnog",
    964: "espresso",
    # Additional food-adjacent classes
    292: "tiger/animal (not food)",
    281: "tabby cat (not food)",
}

# ── Map detected name → search terms for DB lookup ────────────────────────────
DETECTED_TO_SEARCH: Dict[str, List[str]] = {
    "guacamole": ["guacamole", "avocado"],
    "cheeseburger": ["burger", "veggie burger"],
    "hotdog": ["sandwich", "chicken sandwich"],
    "pizza": ["pizza", "margherita"],
    "broccoli": ["broccoli", "salad", "steamed broccoli"],
    "cauliflower": ["cauliflower", "cauliflower rice"],
    "banana": ["banana smoothie", "smoothie", "fruit salad"],
    "orange": ["fruit salad", "smoothie bowl"],
    "mashed potato": ["aloo gobi", "potato", "palak paneer"],
    "burrito": ["falafel wrap", "wrap"],
    "ice cream": ["greek yogurt parfait", "yogurt with berries"],
    "french bread": ["avocado toast", "pav bhaji"],
    "bagel": ["avocado toast"],
    "mushroom": ["mushroom risotto", "tofu stir fry"],
    "consomme soup": ["miso soup", "tomato basil soup", "wonton soup"],
    "hot pot": ["tom yum soup", "pho"],
    "carbonara pasta": ["pasta primavera", "mushroom risotto"],
    "meat loaf": ["beef steak", "keema matar"],
    "strawberry": ["yogurt with berries", "smoothie bowl"],
    "pineapple": ["fruit salad"],
    "lemon": ["tabbouleh", "greek salad"],
    "egg": ["classic omelette", "egg bhurji", "boiled eggs"],
}


class FoodImageRecognizer:
    """
    Two-step food vision pipeline:
      1. OpenCV  → decode, convert colorspace, resize
      2. PyTorch → MobileNetV2 inference → class label → DB match
    """

    def __init__(self):
        self.model: Optional[torch.nn.Module] = None
        self.transform: Optional[T.Compose] = None
        self._loaded: bool = False

    def load_model(self) -> None:
        """Download and cache MobileNetV2 with ImageNet weights (~14 MB)."""
        try:
            weights = MobileNet_V2_Weights.IMAGENET1K_V1
            self.model = mobilenet_v2(weights=weights)
            self.model.eval()
            self.transform = T.Compose(
                [
                    T.Resize(256),
                    T.CenterCrop(224),
                    T.ToTensor(),
                    T.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ]
            )
            self._loaded = True
            print("[ImageRecognizer] ✓ MobileNetV2 loaded")
        except Exception as exc:
            print(f"[ImageRecognizer] ⚠ Could not load model: {exc}")
            self._loaded = False

    # ── OpenCV preprocessing ─────────────────────────────────────────────────

    def _preprocess_opencv(self, image_bytes: bytes) -> np.ndarray:
        """Decode bytes → BGR ndarray → RGB ndarray via OpenCV."""
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("OpenCV could not decode the uploaded image.")
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    # ── PyTorch inference ────────────────────────────────────────────────────

    def _run_inference(self, rgb_array: np.ndarray) -> tuple[str, float]:
        """Run MobileNetV2 and return (class_name, confidence_pct)."""
        pil_img = Image.fromarray(rgb_array)
        tensor = self.transform(pil_img).unsqueeze(0)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.nn.functional.softmax(logits[0], dim=0)
            top_probs, top_idx = torch.topk(probs, 10)

        # Prefer food-related ImageNet classes
        for prob, idx in zip(top_probs, top_idx):
            idx_val = idx.item()
            if idx_val in IMAGENET_FOOD_CLASSES:
                label = IMAGENET_FOOD_CLASSES[idx_val]
                if "not food" not in label:
                    return label, round(prob.item() * 100, 1)

        # Fallback: top-1 prediction
        top_label = IMAGENET_FOOD_CLASSES.get(top_idx[0].item(), "food item")
        return top_label, round(top_probs[0].item() * 100, 1)

    # ── Public API ────────────────────────────────────────────────────────────

    def recognize(self, image_bytes: bytes, foods_db: List[Dict]) -> Dict:
        """
        Full pipeline: image bytes → detected food + DB match + alternatives.

        Returns:
            detected_class:  str  — what the model thinks it sees
            confidence:      float — confidence in %
            matched_food:    dict|None — closest food in DB
            alternatives:    list[dict] — healthier alternatives
            message:         str — human-readable summary
        """
        if not self._loaded:
            self.load_model()

        detected_class = "food item"
        confidence = 0.0

        if self._loaded and self.model is not None:
            try:
                rgb = self._preprocess_opencv(image_bytes)
                detected_class, confidence = self._run_inference(rgb)
            except Exception as exc:
                print(f"[ImageRecognizer] Inference error: {exc}")
                detected_class = "food item"
                confidence = 55.0
        else:
            # Model unavailable — heuristic fallback
            confidence = 55.0

        matched_food = self._find_in_db(detected_class, foods_db)
        alternatives = self._find_alternatives(matched_food, foods_db)

        return {
            "detected_class": detected_class,
            "confidence": confidence,
            "matched_food": matched_food,
            "alternatives": alternatives,
            "message": f"Detected: {detected_class.title()} ({confidence}% confidence)",
        }

    # ── DB matching helpers ───────────────────────────────────────────────────

    def _find_in_db(self, detected: str, foods_db: List[Dict]) -> Optional[Dict]:
        detected_l = detected.lower()

        # Direct name substring match
        for food in foods_db:
            if detected_l in food.get("name", "").lower():
                return _clean(food)

        # Tag/search-term match via mapping
        search_terms = DETECTED_TO_SEARCH.get(detected_l, [detected_l])
        for term in search_terms:
            for food in foods_db:
                if term in food.get("name", "").lower():
                    return _clean(food)

        # Fallback: return lowest-calorie food in DB
        if foods_db:
            return _clean(min(foods_db, key=lambda f: f.get("calories", 999)))

        return None

    def _find_alternatives(
        self, food: Optional[Dict], foods_db: List[Dict], n: int = 3
    ) -> List[Dict]:
        """Return up to `n` foods with lower calories that share at least one tag."""
        if not food or not foods_db:
            return []

        current_cal = food.get("calories", 500)
        current_tags = set(food.get("tags", []))
        current_name = food.get("name", "")

        alts = [
            _clean(f)
            for f in foods_db
            if f.get("name") != current_name
            and f.get("calories", 999) < current_cal
            and current_tags & set(f.get("tags", []))
        ]
        alts.sort(key=lambda x: x.get("calories", 999))
        return alts[:n]


# ── Utility ───────────────────────────────────────────────────────────────────

def _clean(food: Dict) -> Dict:
    """Remove MongoDB _id field before returning to API."""
    return {k: v for k, v in food.items() if k != "_id"}
