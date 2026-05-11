"""
KNNBaseline model loader — no scikit-surprise dependency.
Loads knnbaseline_exported.pkl and reimplements predict() in pure numpy.
"""
import pickle
import logging
import numpy as np
from typing import List, Dict, Tuple, Optional
from pathlib import Path
from collections import defaultdict

logger = logging.getLogger(__name__)


class KNNModelLoader:
    """
    Loads knnbaseline_exported.pkl and serves recommendations.

    The model was trained on Amazon Beauty ratings data (5 000 users,
    15 911 products).  Product IDs are Amazon ASINs, not MongoDB ObjectIds.
    Popularity rankings from this model are used to weight MongoDB queries.
    Direct predictions are available for any user whose raw ID appears in the
    training set.
    """

    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.bundle: Optional[Dict] = None
        self.is_loaded = False

        # Cached arrays
        self._sim: Optional[np.ndarray] = None   # (n_users, n_users)
        self._bu:  Optional[np.ndarray] = None   # user biases
        self._bi:  Optional[np.ndarray] = None   # item biases
        self._mu:  float = 0.0
        self._k:   int = 20
        self._min_k: int = 1

    # ── Loading ───────────────────────────────────────────────────────────────

    def load(self) -> bool:
        try:
            if not self.model_path.exists():
                logger.error(f"Model file not found: {self.model_path}")
                return False

            with open(self.model_path, "rb") as f:
                self.bundle = pickle.load(f)

            required = {"sim", "bu", "bi", "mu", "raw2inner_u", "raw2inner_i",
                        "inner2raw_i", "ur", "popularity_sorted"}
            missing = required - set(self.bundle.keys())
            if missing:
                logger.error(f"Bundle missing keys: {missing}")
                return False

            self._sim = np.array(self.bundle["sim"], dtype=np.float32)
            self._bu  = np.array(self.bundle["bu"],  dtype=np.float32)
            self._bi  = np.array(self.bundle["bi"],  dtype=np.float32)
            self._mu  = float(self.bundle["mu"])
            self._k   = int(self.bundle.get("k", 20))
            self._min_k = int(self.bundle.get("min_k", 1))

            self.is_loaded = True
            logger.info(
                f"KNNBaseline loaded: {len(self.bundle['raw2inner_u']):,} users | "
                f"{len(self.bundle['raw2inner_i']):,} items | "
                f"sim {self._sim.shape}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            return False

    # ── Public API ────────────────────────────────────────────────────────────

    def get_recommendations(self, raw_user_id: str, limit: int = 10) -> List[str]:
        """
        Top-N Amazon ASIN recommendations for a known user.
        Returns popularity fallback for users not in the training set.
        """
        if not self.is_loaded:
            return []

        uid = str(raw_user_id)
        u_inner = self.bundle["raw2inner_u"].get(uid)

        if u_inner is None:
            return self.get_trending(limit)

        already_rated = {str(iid) for iid, _ in self.bundle["ur"].get(u_inner, [])}
        all_items = self.bundle["all_product_ids"]

        scores: List[Tuple[str, float]] = []
        for raw_iid in all_items:
            if str(raw_iid) in already_rated:
                continue
            est = self._predict(u_inner, raw_iid)
            if est is not None:
                scores.append((str(raw_iid), est))

        scores.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scores[:limit]]

    def get_trending(self, limit: int = 10) -> List[str]:
        """Popularity-ranked Amazon ASINs (most-rated first)."""
        if not self.is_loaded:
            return []
        return [str(p) for p in self.bundle["popularity_sorted"][:limit]]

    def get_popularity_position(self, limit: int) -> Dict[str, float]:
        """
        Returns {product_id: score} where score ∈ (0, 1], 1 = most popular.
        Used to weight MongoDB queries.
        """
        if not self.is_loaded:
            return {}
        pop = self.bundle["popularity_sorted"][:limit]
        n = len(pop)
        return {str(pid): (n - i) / n for i, pid in enumerate(pop)}

    def user_in_model(self, raw_user_id: str) -> bool:
        if not self.is_loaded:
            return False
        return str(raw_user_id) in self.bundle["raw2inner_u"]

    # ── KNNBaseline predict (pure numpy) ──────────────────────────────────────

    def _predict(self, u_inner: int, raw_iid: str) -> Optional[float]:
        """
        Reimplements surprise KNNBaseline.predict() without surprise.

        Rating estimate = baseline(u, i) + weighted correction from neighbors.
        baseline(u, i) = μ + bu[u] + bi[i]
        """
        b = self.bundle
        i_inner = b["raw2inner_i"].get(str(raw_iid))
        if i_inner is None:
            # Item not in training set — return baseline from global mean
            return float(self._mu + self._bu[u_inner])

        # Baseline estimate
        baseline_ui = self._mu + self._bu[u_inner] + self._bi[i_inner]

        # Neighbors: other users who rated item i, sorted by similarity to u
        i_raters = b["ir"].get(i_inner, [])  # [(v_inner, rating), ...]
        if not i_raters:
            return float(np.clip(baseline_ui, 1.0, 5.0))

        neighbors = []
        for v_inner, r_vi in i_raters:
            if v_inner == u_inner:
                continue
            sim_uv = float(self._sim[u_inner, v_inner])
            if sim_uv <= 0:
                continue
            baseline_vi = self._mu + self._bu[v_inner] + self._bi[i_inner]
            neighbors.append((sim_uv, r_vi - baseline_vi))

        if len(neighbors) < self._min_k:
            return float(np.clip(baseline_ui, 1.0, 5.0))

        # Take top-k by similarity
        neighbors.sort(key=lambda x: x[0], reverse=True)
        neighbors = neighbors[:self._k]

        sim_sum   = sum(s for s, _ in neighbors)
        correction = sum(s * d for s, d in neighbors) / sim_sum if sim_sum > 0 else 0.0

        est = baseline_ui + correction
        return float(np.clip(est, 1.0, 5.0))
