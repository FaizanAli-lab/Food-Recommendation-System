"""
Food Recommendation Engine
Combines three ML layers:
  1. Scikit-learn KNN — finds nearest neighbor foods in feature space
  2. Scikit-learn Decision Tree — pre-filters unsuitable candidates
  3. PyTorch MLP — re-ranks candidates by learned suitability score

Feature vector (12 dims per food):
  [calories, protein, fat, carbs,
   is_vegetarian, is_vegan, is_non_veg,
   is_spicy, is_sweet, is_savory,
   is_light, is_high_protein]
"""

from __future__ import annotations

import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Any

from ml.deep_model import FoodMLP, train_mlp, score_foods_mlp


# ── Feature dimensionality ────────────────────────────────────────────────────
FEATURE_DIM = 12


class FoodRecommender:
    """
    Multi-model food recommendation system.
    Call `fit(foods)` once at startup, then `recommend(user_pref)` per request.
    """

    def __init__(self):
        self.knn = NearestNeighbors(n_neighbors=20, metric="euclidean")
        self.dt = DecisionTreeClassifier(max_depth=6, random_state=42)
        self.mlp: FoodMLP | None = None
        self.scaler = StandardScaler()
        self.foods: List[Dict] = []
        self.food_features: np.ndarray | None = None
        self.is_fitted: bool = False

    # ── Feature engineering ───────────────────────────────────────────────────

    def _food_to_features(self, food: Dict) -> List[float]:
        tags = food.get("tags", [])
        cal = food.get("calories", 300)
        prot = food.get("protein", 10)
        return [
            cal,
            prot,
            food.get("fat", 10),
            food.get("carbs", 40),
            1.0 if "vegetarian" in tags or "vegan" in tags else 0.0,
            1.0 if "vegan" in tags else 0.0,
            1.0 if "non-vegetarian" in tags else 0.0,
            1.0 if "spicy" in tags else 0.0,
            1.0 if "sweet" in tags else 0.0,
            1.0 if "savory" in tags else 0.0,
            1.0 if "light" in tags or cal < 300 else 0.0,
            1.0 if "high-protein" in tags or prot >= 20 else 0.0,
        ]

    def _pref_to_query(self, pref: Dict) -> List[float]:
        """Translate user preference dict into the same 12-dim food space."""
        diet = pref.get("diet_type", "any")
        max_cal = pref.get("max_calories", 600)
        tastes = pref.get("taste_preferences", [])
        high_prot = pref.get("high_protein", False)

        return [
            max_cal * 0.75,           # target ~75% of max calories
            30.0 if high_prot else 14.0,
            15.0,
            50.0,
            1.0 if diet in ("vegetarian", "vegan") else 0.0,
            1.0 if diet == "vegan" else 0.0,
            1.0 if diet == "non-vegetarian" else 0.0,
            1.0 if "spicy" in tastes else 0.0,
            1.0 if "sweet" in tastes else 0.0,
            1.0 if "savory" in tastes else 0.0,
            1.0 if "light" in tastes or max_cal <= 400 else 0.0,
            1.0 if high_prot else 0.0,
        ]

    # ── Synthetic label generation for DT + MLP training ────────────────────

    def _generate_labels(self) -> np.ndarray:
        """
        Heuristic labels: foods with balanced macros, reasonable calories,
        and decent protein get label=1; others get label=0.
        """
        labels = []
        for food in self.foods:
            cal = food.get("calories", 300)
            prot = food.get("protein", 10)
            score = 0.0
            if cal < 450:
                score += 0.35
            if prot >= 15:
                score += 0.35
            if "vegetarian" in food.get("tags", []) or "vegan" in food.get("tags", []):
                score += 0.15
            if cal < 300:
                score += 0.15
            labels.append(1 if score >= 0.5 else 0)
        return np.array(labels)

    # ── Training  ─────────────────────────────────────────────────────────────

    def fit(self, foods: List[Dict]) -> None:
        """Train all three ML models on the food dataset."""
        self.foods = foods
        feats = [self._food_to_features(f) for f in foods]
        self.food_features = np.array(feats, dtype=float)

        # 1. KNN — fit on scaled features
        scaled = self.scaler.fit_transform(self.food_features)
        self.knn.fit(scaled)

        # 2. Decision Tree — synthetic labels
        labels = self._generate_labels()
        self.dt.fit(self.food_features, labels)

        # 3. PyTorch MLP
        self.mlp = train_mlp(self.food_features, labels.astype(float), epochs=300)

        self.is_fitted = True
        print(f"[Recommender] ✓ KNN + Decision Tree + PyTorch MLP trained on {len(foods)} foods")

    # ── Inference ─────────────────────────────────────────────────────────────

    def recommend(self, user_pref: Dict, n: int = 8) -> List[Dict]:
        """
        Return top-n food recommendations for a given user preference dict.

        Pipeline:
          KNN → hard-filter (diet/allergy/calories) → DT pre-filter → MLP re-rank
        """
        if not self.is_fitted or not self.foods:
            return []

        query = self._pref_to_query(user_pref)
        query_scaled = self.scaler.transform([query])

        # ── Step 1: KNN candidates ────────────────────────────────────────────
        distances, indices = self.knn.kneighbors(query_scaled)

        max_cal = user_pref.get("max_calories", 9999)
        diet = user_pref.get("diet_type", "any")
        allergies = user_pref.get("allergies", [])
        cuisines = user_pref.get("cuisines", [])

        candidates = self._apply_hard_filters(
            distances[0], indices[0], max_cal, diet, allergies, cuisines
        )

        # Relax cuisine filter if too few results
        if len(candidates) < 3 and cuisines:
            candidates = self._apply_hard_filters(
                distances[0], indices[0], max_cal, diet, allergies, []
            )

        if not candidates:
            return []

        # ── Step 2: Decision Tree pre-filter ─────────────────────────────────
        cand_feats = np.array([self._food_to_features(c["food"]) for c in candidates])
        dt_preds = self.dt.predict(cand_feats)
        dt_filtered = [c for c, p in zip(candidates, dt_preds) if p == 1]

        # Fall back to all candidates if DT removes everything
        if len(dt_filtered) < 3:
            dt_filtered = candidates

        # ── Step 3: PyTorch MLP re-ranking ───────────────────────────────────
        if self.mlp and dt_filtered:
            mlp_feats = np.array([self._food_to_features(c["food"]) for c in dt_filtered])
            mlp_scores = score_foods_mlp(self.mlp, mlp_feats)

            for i, cand in enumerate(dt_filtered):
                mlp_s = float(mlp_scores[i])
                knn_s = cand["knn_score"]
                cand["score"] = round(0.55 * knn_s + 0.45 * mlp_s, 4)

            dt_filtered.sort(key=lambda c: c["score"], reverse=True)

        # ── Build results ─────────────────────────────────────────────────────
        results = []
        for cand in dt_filtered[:n]:
            food_dict = {k: v for k, v in cand["food"].items() if k != "_id"}
            results.append(
                {
                    "food": food_dict,
                    "score": cand.get("score", cand["knn_score"]),
                    "reason": self._generate_reason(cand["food"], user_pref),
                }
            )
        return results

    def _apply_hard_filters(
        self,
        distances: np.ndarray,
        indices: np.ndarray,
        max_cal: int,
        diet: str,
        allergies: List[str],
        cuisines: List[str],
    ) -> List[Dict]:
        candidates = []
        for dist, idx in zip(distances, indices):
            food = self.foods[idx]
            tags = food.get("tags", [])

            if food.get("calories", 0) > max_cal:
                continue
            if diet == "vegetarian" and "non-vegetarian" in tags:
                continue
            if diet == "vegan" and (
                "non-vegetarian" in tags or "dairy" in tags
            ):
                continue
            if any(al in tags for al in allergies):
                continue
            if cuisines and food.get("cuisine", "") not in cuisines:
                continue

            knn_score = 1.0 / (1.0 + dist)
            candidates.append({"food": food, "knn_score": knn_score, "score": knn_score})
        return candidates

    def _generate_reason(self, food: Dict, pref: Dict) -> str:
        tags = food.get("tags", [])
        cal = food.get("calories", 0)
        prot = food.get("protein", 0)
        diet = pref.get("diet_type", "any")
        tastes = pref.get("taste_preferences", [])

        reasons = []

        if cal < 250:
            reasons.append("very low calorie")
        elif cal < 400:
            reasons.append("low calorie")

        if prot >= 30:
            reasons.append("very high protein")
        elif prot >= 18:
            reasons.append("high protein")

        if diet in ("vegetarian", "vegan") and diet in tags:
            reasons.append(f"{diet}-friendly")

        for taste in tastes:
            if taste in tags:
                reasons.append(f"matches your {taste} craving")

        if "gluten-free" in tags and "gluten" in pref.get("allergies", []):
            reasons.append("gluten-free ✓")

        if not reasons:
            cuisine = food.get("cuisine", "")
            reasons.append(f"well-balanced {cuisine} dish")

        return " • ".join(reasons)
