from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager

from utils.knn_model_loader import KNNModelLoader
from utils.mongodb_client import mongo_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# ── Pydantic models ───────────────────────────────────────────────────────────

class UserBehavior(BaseModel):
    purchaseHistory: Optional[List[Dict[str, Any]]] = []
    wishlistItems:   Optional[List[Dict[str, Any]]] = []
    recentlyViewed:  Optional[List[Dict[str, Any]]] = []

class RecommendationContext(BaseModel):
    userBehavior: Optional[UserBehavior] = None

class RecommendationRequest(BaseModel):
    userId:      Optional[str] = None
    limit:       int = 10
    requestType: str = "personalized"
    context:     Optional[RecommendationContext] = None

class SimilarRequest(BaseModel):
    productId: str
    limit:     int = 10

class TrackEventRequest(BaseModel):
    userId:    Optional[str] = None
    eventType: str
    productId: str
    metadata:  Optional[Dict[str, Any]] = None

# ── Lifecycle ─────────────────────────────────────────────────────────────────

model_loader = KNNModelLoader("")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting KNNBaseline Recommendation Service...")
    model_loader.model_path = __import__("pathlib").Path(
        os.getenv("MODEL_PATH",
                  "../../recommendation system/models/knnbaseline_exported.pkl")
    )
    if model_loader.load():
        logger.info("✅ KNNBaseline model loaded")
    else:
        logger.error("❌ Model failed to load — service running in fallback mode")
    yield
    mongo_client.close()
    logger.info("Service shutdown")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Recommendation Service",
    description="KNNBaseline recommendations for the Agelgil e-commerce platform",
    version="2.0.0",
    lifespan=lifespan,
)

_origins = [o.strip() for o in
            os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_category_weights(behavior: Optional[UserBehavior]) -> Dict[str, float]:
    """
    Returns {category_id: weight} from a user's full behavior.
    Purchases carry the most signal (3 pts each), wishlist adds (2 pts), views (1 pt).
    """
    if not behavior:
        return {}
    weights: Dict[str, float] = {}
    for item in (behavior.purchaseHistory or []):
        cat = str(item.get("category") or "")
        if cat:
            weights[cat] = weights.get(cat, 0) + 3.0
    for item in (behavior.wishlistItems or []):
        cat = str(item.get("category") or "")
        if cat:
            weights[cat] = weights.get(cat, 0) + 2.0
    for item in (behavior.recentlyViewed or []):
        cat = str(item.get("category") or "")
        if cat:
            weights[cat] = weights.get(cat, 0) + 1.0
    return weights


def _extract_purchased_ids(behavior: Optional[UserBehavior]) -> List[str]:
    """Product IDs the user already bought — exclude from recommendations."""
    if not behavior:
        return []
    return [
        str(item["productId"])
        for item in (behavior.purchaseHistory or [])
        if item.get("productId")
    ]


def _is_returning_user(behavior: Optional[UserBehavior]) -> bool:
    if not behavior:
        return False
    return bool(behavior.purchaseHistory or behavior.wishlistItems or behavior.recentlyViewed)

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check(x_request_id: Optional[str] = Header(None)):
    return {
        "status":          "healthy" if model_loader.is_loaded else "degraded",
        "model_loaded":    model_loader.is_loaded,
        "mongo_connected": mongo_client.db is not None,
        "version":         "2.0.0",
    }


@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest,
                              x_request_id: Optional[str] = Header(None)):
    """
    Personalized recommendations.

    Returning users: categories weighted by interaction intensity
    (purchase ×3, wishlist ×2, view ×1). Already-purchased products
    are excluded. KNNBaseline popularity breaks ties within categories.

    Cold-start / new users: trending products from MongoDB.
    """
    limit    = max(1, min(request.limit, 50))
    behavior = request.context.userBehavior if request.context else None

    if request.userId and _is_returning_user(behavior):
        category_weights = _extract_category_weights(behavior)
        exclude_ids      = _extract_purchased_ids(behavior)

        if category_weights:
            # Apply KNN global popularity as a mild secondary signal.
            # The model IDs are Amazon ASINs, not MongoDB ObjectIds, so we use
            # its popularity ranking as a category-level weight booster rather
            # than direct product scoring.
            knn_boost = model_loader.get_popularity_position(200) if model_loader.is_loaded else {}

            products = mongo_client.get_products_by_category_weights(
                category_weights, exclude_ids, limit
            )

            if products:
                # Apply KNN popularity boost: re-score products whose _id
                # coincidentally matches a known popular product rank.
                def final_score(p: Dict) -> float:
                    pid = str(p["_id"])
                    cat = str(p.get("category", ""))
                    return (
                        category_weights.get(cat, 0) * 5
                        + (p.get("pop_score") or 0)
                        + knn_boost.get(pid, 0) * 2
                    )

                products.sort(key=final_score, reverse=True)

                ids = [str(p["_id"]) for p in products]
                print("\n========================================")
                print(f"  AI RECOMMENDATIONS  |  user: {request.userId}")
                print(f"  type: recommended_for_you  |  count: {len(ids)}")
                print(f"  top categories: {sorted(category_weights, key=category_weights.get, reverse=True)[:3]}")
                print("----------------------------------------")
                for i, p in enumerate(products, 1):
                    name  = p.get("name", "Unknown")
                    score = round(final_score(p), 2)
                    print(f"  {i:2}. {name}  (score: {score})")
                print("========================================\n")
                logger.info(
                    "Personalized (%s): %d products, top cats: %s",
                    request.userId,
                    len(products),
                    sorted(category_weights, key=category_weights.get, reverse=True)[:3],
                )
                return {
                    "recommendations": ids,
                    "count": len(ids),
                    "type": "recommended_for_you",
                    "category_weights": {
                        k: v for k, v in sorted(
                            category_weights.items(), key=lambda x: x[1], reverse=True
                        )[:5]
                    },
                }

    # Cold-start fallback — trending from MongoDB
    products = mongo_client.get_trending_products(limit)
    print("\n========================================")
    print(f"  TRENDING FALLBACK  |  user: {request.userId or 'anonymous'}")
    print(f"  count: {len(products)}")
    print("----------------------------------------")
    for i, p in enumerate(products, 1):
        print(f"  {i:2}. {p.get('name', 'Unknown')}")
    print("========================================\n")
    logger.info("Trending fallback: %d products", len(products))
    return {
        "recommendations": [str(p["_id"]) for p in products],
        "count": len(products),
        "type": "trending_fallback",
    }


@app.get("/api/homepage")
async def get_homepage_recommendations(limit: int = 10):
    """
    Homepage trending products (public — called for unauthenticated visitors).
    Uses MongoDB popularity scoring (reviews × avg rating).
    """
    limit    = max(1, min(limit, 50))
    products = mongo_client.get_trending_products(limit)

    # If MongoDB returned fewer than requested, pad with most-recently added
    if len(products) < limit:
        extra = mongo_client.get_new_arrivals(limit - len(products))
        seen  = {str(p["_id"]) for p in products}
        products += [p for p in extra if str(p["_id"]) not in seen]

    logger.info(f"Homepage: {len(products)} products")
    return {
        "recommendations": [str(p["_id"]) for p in products],
        "count": len(products),
        "type": "homepage_trending",
    }


@app.post("/api/similar")
async def get_similar(request: SimilarRequest,
                      x_request_id: Optional[str] = Header(None)):
    """Similar products based on category and price range."""
    products = mongo_client.get_similar_products(request.productId, request.limit)
    return {
        "similarProducts": [str(p["_id"]) for p in products],
        "count": len(products),
    }


@app.post("/api/bought-together")
async def get_bought_together(request: SimilarRequest,
                              x_request_id: Optional[str] = Header(None)):
    """Frequently bought together — same category, different products."""
    products = mongo_client.get_similar_products(request.productId, request.limit)
    return {
        "recommendations": [str(p["_id"]) for p in products],
        "count": len(products),
    }


@app.post("/api/track")
async def track_event(request: TrackEventRequest,
                      x_request_id: Optional[str] = Header(None)):
    """Log a user interaction for future model retraining."""
    success = mongo_client.log_interaction(
        request.userId or "anonymous",
        request.eventType,
        request.productId,
        request.metadata,
    )
    return {"success": success}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true",
    )
