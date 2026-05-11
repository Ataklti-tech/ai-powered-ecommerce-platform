import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
import logging
from bson import ObjectId

load_dotenv()
logger = logging.getLogger(__name__)


class MongoDBClient:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.connect()

    def connect(self) -> bool:
        try:
            uri = os.getenv("DATABASE")
            if not uri:
                logger.error("DATABASE URI not set")
                return False
            self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            self.db = self.client.get_default_database()
            self.client.admin.command("ping")
            logger.info("MongoDB connected")
            return True
        except PyMongoError as e:
            logger.error(f"MongoDB connection failed: {e}")
            return False

    # ── Product queries ───────────────────────────────────────────────────────

    def get_active_products(self, product_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetch active products by MongoDB ObjectId list, preserving order."""
        try:
            obj_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]
            if not obj_ids:
                return []
            products = list(self.db.products.find(
                {"_id": {"$in": obj_ids}, "status": "active"}
            ))
            # Preserve original order
            order = {str(oid): i for i, oid in enumerate(obj_ids)}
            products.sort(key=lambda p: order.get(str(p["_id"]), 9999))
            return products
        except Exception as e:
            logger.error(f"get_active_products error: {e}")
            return []

    def get_trending_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Products ranked by: avg_rating × ln(review_count + 1).
        Falls back to newest products if no reviews exist.
        """
        try:
            pipeline = [
                {"$match": {"status": "active"}},
                {"$lookup": {
                    "from": "reviews",
                    "localField": "_id",
                    "foreignField": "product",
                    "as": "reviews",
                }},
                {"$addFields": {
                    "review_count": {"$size": "$reviews"},
                    "avg_rating":   {"$avg": "$reviews.rating"},
                }},
                {"$addFields": {
                    "pop_score": {
                        "$multiply": [
                            {"$ifNull": ["$avg_rating", 3.0]},
                            {"$ln": {"$add": [{"$ifNull": ["$review_count", 0]}, 1]}},
                        ]
                    }
                }},
                {"$sort": {"pop_score": -1}},
                {"$limit": limit},
                {"$project": {
                    "_id": 1, "name": 1, "price": 1, "images": 1,
                    "shortDescription": 1, "category": 1,
                    "avgRating":   {"$ifNull": ["$avg_rating", 0]},
                    "numReviews":  {"$ifNull": ["$review_count", 0]},
                }},
            ]
            return list(self.db.products.aggregate(pipeline))
        except Exception as e:
            logger.error(f"get_trending_products error: {e}")
            return []

    def get_products_by_categories(
        self, category_ids: List[str], limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch active products from the given category ObjectIds,
        ranked by pop_score (same formula as trending).
        category_ids is the list extracted from the user's purchase/view history.
        """
        try:
            obj_cat_ids = [
                ObjectId(cid) for cid in category_ids if ObjectId.is_valid(cid)
            ]
            if not obj_cat_ids:
                return self.get_trending_products(limit)

            pipeline = [
                {"$match": {"status": "active", "category": {"$in": obj_cat_ids}}},
                {"$lookup": {
                    "from": "reviews",
                    "localField": "_id",
                    "foreignField": "product",
                    "as": "reviews",
                }},
                {"$addFields": {
                    "review_count": {"$size": "$reviews"},
                    "avg_rating":   {"$avg": "$reviews.rating"},
                }},
                {"$addFields": {
                    "pop_score": {
                        "$multiply": [
                            {"$ifNull": ["$avg_rating", 3.0]},
                            {"$ln": {"$add": [{"$ifNull": ["$review_count", 0]}, 1]}},
                        ]
                    }
                }},
                {"$sort": {"pop_score": -1}},
                {"$limit": limit},
                {"$project": {
                    "_id": 1, "name": 1, "price": 1, "images": 1,
                    "shortDescription": 1, "category": 1,
                }},
            ]
            products = list(self.db.products.aggregate(pipeline))

            # If the user's categories have fewer products than limit, pad with trending
            if len(products) < limit:
                seen = {str(p["_id"]) for p in products}
                extra = self.get_trending_products(limit)
                for p in extra:
                    if str(p["_id"]) not in seen:
                        products.append(p)
                    if len(products) >= limit:
                        break

            return products[:limit]
        except Exception as e:
            logger.error(f"get_products_by_categories error: {e}")
            return self.get_trending_products(limit)

    def get_similar_products(
        self, product_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Products in the same category and similar price range."""
        try:
            if not ObjectId.is_valid(product_id):
                return []

            source = self.db.products.find_one({"_id": ObjectId(product_id)})
            if not source:
                return []

            price      = source.get("price", 0)
            category   = source.get("category")
            price_low  = price * 0.6
            price_high = price * 1.6

            query: Dict[str, Any] = {
                "_id":    {"$ne": ObjectId(product_id)},
                "status": "active",
                "price":  {"$gte": price_low, "$lte": price_high},
            }
            if category:
                query["category"] = category

            return list(self.db.products.find(query).limit(limit))
        except Exception as e:
            logger.error(f"get_similar_products error: {e}")
            return []

    def get_products_by_category_weights(
        self,
        category_weights: Dict[str, float],
        exclude_product_ids: List[str],
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Fetch active products from weighted categories, excluding already-purchased ones.
        Combined score = category_weight × 5 + pop_score (avg_rating × ln(review_count+1)).
        Falls back to trending if no valid categories provided.
        """
        try:
            valid_cats = {
                cid: w for cid, w in category_weights.items()
                if ObjectId.is_valid(cid)
            }
            if not valid_cats:
                return self.get_trending_products(limit)

            cat_obj_ids = [ObjectId(cid) for cid in valid_cats]
            exclude_obj_ids = [
                ObjectId(eid) for eid in exclude_product_ids
                if ObjectId.is_valid(eid)
            ]

            match_stage: Dict[str, Any] = {
                "status": "active",
                "category": {"$in": cat_obj_ids},
            }
            if exclude_obj_ids:
                match_stage["_id"] = {"$nin": exclude_obj_ids}

            pipeline = [
                {"$match": match_stage},
                {"$lookup": {
                    "from": "reviews",
                    "localField": "_id",
                    "foreignField": "product",
                    "as": "reviews",
                }},
                {"$addFields": {
                    "review_count": {"$size": "$reviews"},
                    "avg_rating":   {"$avg": "$reviews.rating"},
                    "pop_score": {
                        "$multiply": [
                            {"$ifNull": ["$avg_rating", 3.0]},
                            {"$ln": {"$add": [{"$ifNull": ["$review_count", 0]}, 1]}},
                        ]
                    },
                }},
                {"$project": {
                    "_id": 1, "name": 1, "price": 1, "images": 1,
                    "shortDescription": 1, "category": 1,
                    "discount": 1, "pop_score": 1,
                    "avgRating": {"$ifNull": ["$avg_rating", 0]},
                }},
                # Fetch more than needed so we can re-rank in Python
                {"$limit": limit * 4},
            ]

            products = list(self.db.products.aggregate(pipeline))

            # Re-rank: category preference weight dominates, pop_score breaks ties
            def combined_score(p: Dict) -> float:
                cat_str = str(p.get("category", ""))
                return valid_cats.get(cat_str, 0) * 5 + (p.get("pop_score") or 0)

            products.sort(key=combined_score, reverse=True)
            result = products[:limit]

            # Pad with trending if not enough results
            if len(result) < limit:
                seen = {str(p["_id"]) for p in result}
                extra = self.get_trending_products(limit)
                for p in extra:
                    pid = str(p["_id"])
                    if pid not in seen and pid not in {str(e) for e in exclude_obj_ids}:
                        result.append(p)
                    if len(result) >= limit:
                        break

            return result

        except Exception as e:
            logger.error(f"get_products_by_category_weights error: {e}")
            return self.get_trending_products(limit)

    def get_new_arrivals(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Most recently added active products."""
        try:
            return list(
                self.db.products.find({"status": "active"})
                .sort("createdAt", -1)
                .limit(limit)
            )
        except Exception as e:
            logger.error(f"get_new_arrivals error: {e}")
            return []

    # ── Interaction logging ───────────────────────────────────────────────────

    def log_interaction(
        self,
        user_id: str,
        event_type: str,
        product_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        try:
            self.db.interactions.insert_one({
                "userId":    user_id,
                "productId": product_id,
                "eventType": event_type,
                "timestamp": datetime.now(timezone.utc),
                "metadata":  metadata or {},
            })
            return True
        except Exception as e:
            logger.error(f"log_interaction error: {e}")
            return False

    def close(self):
        if self.client:
            self.client.close()


mongo_client = MongoDBClient()
