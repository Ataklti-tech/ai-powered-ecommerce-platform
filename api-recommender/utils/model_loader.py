import pickle
import logging
import numpy as np
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


def _normalize(arr: np.ndarray) -> np.ndarray:
    """Min-max normalize to [0, 1]; returns zeros if constant."""
    mn, mx = arr.min(), arr.max()
    if mx - mn < 1e-10:
        return np.zeros_like(arr, dtype=np.float32)
    return ((arr - mn) / (mx - mn)).astype(np.float32)


class ModelLoader:
    """Loads the trained recommendation bundle (recommendation_bundle_v2.pkl)."""

    # Minimum keys required for any recommendation to work
    REQUIRED_KEYS = {
        'ALL_USERS', 'ALL_PRODUCTS', 'uid2idx', 'pid2idx',
        'U_als', 'V_als', 'knn_user', 'knn_item',
        'popularity_scores', 'tfidf_pid2idx', 'content_sim',
        'user_seen_train',
    }

    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.bundle: Optional[Dict[str, Any]] = None
        self.is_loaded = False

        # Cached numpy arrays built on load for fast scoring
        self._pop_arr: Optional[np.ndarray] = None

    # ─── Loading ────────────────────────────────────────────────────────────────

    def load(self) -> bool:
        try:
            if not self.model_path.exists():
                logger.error(f"Model file not found: {self.model_path}")
                return False

            with open(self.model_path, 'rb') as f:
                self.bundle = pickle.load(f)

            missing = self.REQUIRED_KEYS - set(self.bundle.keys())
            if missing:
                logger.error(f"Bundle missing keys: {missing}")
                return False

            # Pre-build popularity array aligned to ALL_PRODUCTS order
            pop = self.bundle['popularity_scores']
            self._pop_arr = _normalize(np.array(
                [float(pop.get(p, 0.0)) for p in self.bundle['ALL_PRODUCTS']],
                dtype=np.float32
            ))

            self.is_loaded = True
            logger.info(f"Model loaded: {self.model_path}")
            logger.info(f"  Users: {len(self.bundle['ALL_USERS']):,}  "
                        f"Products: {len(self.bundle['ALL_PRODUCTS']):,}")
            return True

        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            return False

    # ─── Public API ─────────────────────────────────────────────────────────────

    def get_recommendations(self, user_id: str, top_n: int = 10) -> List[str]:
        """Hybrid recommendations for a known or cold-start user."""
        if not self.is_loaded:
            return self._popularity_fallback(top_n)

        b = self.bundle
        uid = str(user_id)
        user_idx = b['uid2idx'].get(uid)

        if user_idx is not None:
            return self._hybrid_recommendations(user_idx, uid, top_n)
        else:
            logger.info(f"Cold-start user: {uid}")
            return self._cold_start(top_n)

    def get_trending(self, limit: int = 10) -> List[str]:
        """Popularity-ranked products (for new users / homepage)."""
        if not self.is_loaded:
            return []
        pop = self.bundle['popularity_scores']
        ranked = sorted(pop.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [str(pid) for pid, _ in ranked]

    def get_similar(self, product_id: str, limit: int = 10) -> List[str]:
        """Content-based similar products for a given product ID."""
        if not self.is_loaded:
            return []

        b = self.bundle
        pid2idx = b['tfidf_pid2idx']
        idx = pid2idx.get(str(product_id))
        if idx is None:
            return self.get_trending(limit)

        sim_row = np.array(b['content_sim'][idx], dtype=np.float32)
        # Exclude self (set self-score to -1 so argsort pushes it down)
        sim_row[idx] = -1.0
        top_indices = np.argsort(sim_row)[::-1][:limit]
        return [str(b['ALL_PRODUCTS'][i]) for i in top_indices]

    # ─── Hybrid Scoring ─────────────────────────────────────────────────────────

    def _hybrid_recommendations(self, user_idx: int, uid: str, top_n: int) -> List[str]:
        b = self.bundle
        n_products = len(b['ALL_PRODUCTS'])
        seen = b['user_seen_train'].get(uid, set())

        try:
            # ── ALS direct prediction ──────────────────────────────────────────
            u_als = np.array(b['U_als'][user_idx], dtype=np.float64)
            V_als = np.array(b['V_als'], dtype=np.float64)
            scores_als = _normalize((u_als @ V_als.T).astype(np.float32))

            # ── BPR-MF prediction ──────────────────────────────────────────────
            scores_bpr = np.zeros(n_products, dtype=np.float32)
            if 'U_bpr' in b and 'V_bpr' in b:
                u_bpr = np.array(b['U_bpr'][user_idx], dtype=np.float32)
                V_bpr = np.array(b['V_bpr'], dtype=np.float32)
                bu = float(b['bu_bpr'][user_idx]) if 'bu_bpr' in b else 0.0
                bi = np.array(b['bi_bpr'], dtype=np.float32) if 'bi_bpr' in b else np.zeros(n_products)
                scores_bpr = _normalize(u_bpr @ V_bpr.T + bu + bi)

            # ── Content-based (from seen items) ───────────────────────────────
            scores_content = self._content_from_history(seen)

            # ── Hybrid combination ─────────────────────────────────────────────
            hybrid = (0.40 * scores_als
                      + 0.30 * scores_bpr
                      + 0.20 * scores_content
                      + 0.10 * self._pop_arr)

            # Exclude items the user already interacted with
            seen_str = {str(p) for p in seen}
            results = []
            for i in np.argsort(hybrid)[::-1]:
                pid = str(b['ALL_PRODUCTS'][i])
                if pid not in seen_str:
                    results.append(pid)
                if len(results) >= top_n:
                    break
            return results

        except Exception as e:
            logger.error(f"Hybrid scoring failed for user_idx={user_idx}: {e}", exc_info=True)
            return self._popularity_fallback(top_n)

    def _cold_start(self, top_n: int) -> List[str]:
        """For unknown users: return top-popularity products."""
        return self._popularity_fallback(top_n)

    def _content_from_history(self, seen_pids, max_seen: int = 15) -> np.ndarray:
        """Average content-sim row across a user's recently-seen products."""
        b = self.bundle
        pid2idx = b['tfidf_pid2idx']
        n = len(b['ALL_PRODUCTS'])
        agg = np.zeros(n, dtype=np.float32)
        count = 0
        for pid in list(seen_pids)[:max_seen]:
            idx = pid2idx.get(str(pid))
            if idx is not None:
                agg += np.array(b['content_sim'][idx], dtype=np.float32)
                count += 1
        if count > 0:
            agg /= count
        return _normalize(agg)

    def _popularity_fallback(self, top_n: int) -> List[str]:
        if not self.bundle:
            return []
        pop = self.bundle['popularity_scores']
        ranked = sorted(pop.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [str(pid) for pid, _ in ranked]
