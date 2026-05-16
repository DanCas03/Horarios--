from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query, Depends
from bson import ObjectId
from typing import List, Optional

from app.database import get_collection
from app.models.review import ReviewCreate, ReviewResponse
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/subject/{subject_code}", response_model=List[ReviewResponse])
async def get_subject_reviews(
    subject_code: str,
    university_id: Optional[str] = Query(None),
    professor: Optional[str] = Query(None),
):
    """Obtener reseñas de una materia (anónimo - sin user_id)."""
    reviews = get_collection("reviews")
    query = {"subject_code": subject_code}
    if university_id:
        query["university_id"] = university_id
    if professor:
        query["professor_name"] = {"$regex": professor, "$options": "i"}

    cursor = reviews.find(query).sort("created_at", -1)
    results = []
    async for review in cursor:
        review["_id"] = str(review["_id"])
        # Explicitly exclude user_id for anonymity
        review.pop("user_id", None)
        results.append(ReviewResponse(**review))
    return results


@router.get("/professor/{professor_name}", response_model=List[ReviewResponse])
async def get_professor_reviews(professor_name: str):
    """Obtener reseñas por nombre de profesor (búsqueda parcial)."""
    reviews = get_collection("reviews")
    cursor = reviews.find(
        {"professor_name": {"$regex": professor_name, "$options": "i"}}
    ).sort("created_at", -1)
    results = []
    async for review in cursor:
        review["_id"] = str(review["_id"])
        review.pop("user_id", None)
        results.append(ReviewResponse(**review))
    return results


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user),
):
    """Crear una reseña (requiere estar autenticado y haber cursado la materia)."""
    # Verify the user has approved this subject
    approved_codes = {s["subject_code"] for s in current_user.get("approved_subjects", [])}
    is_verified = review.subject_code in approved_codes

    now = datetime.now(timezone.utc)
    review_doc = review.model_dump()
    review_doc["user_id"] = current_user["_id"]
    review_doc["is_verified"] = is_verified
    review_doc["created_at"] = now

    reviews_col = get_collection("reviews")
    result = await reviews_col.insert_one(review_doc)

    # Update subject average ratings
    if is_verified:
        await _update_subject_stats(review.subject_code)

    review_doc["_id"] = str(result.inserted_id)
    review_doc.pop("user_id", None)  # Remove for anonymity in response
    return ReviewResponse(**review_doc)


async def _update_subject_stats(subject_code: str):
    """Recalculate average stats for a subject after a new review."""
    reviews_col = get_collection("reviews")
    subjects_col = get_collection("subjects")

    pipeline = [
        {"$match": {"subject_code": subject_code, "is_verified": True}},
        {
            "$group": {
                "_id": "$subject_code",
                "avg_difficulty": {"$avg": "$difficulty_rating"},
                "count": {"$sum": 1},
                "recommend_count": {
                    "$sum": {"$cond": ["$would_recommend", 1, 0]}
                },
            }
        },
    ]

    async for stats in reviews_col.aggregate(pipeline):
        approval_rate = (stats["recommend_count"] / stats["count"]) * 100 if stats["count"] > 0 else 0
        await subjects_col.update_many(
            {"code": subject_code},
            {
                "$set": {
                    "avg_difficulty": round(stats["avg_difficulty"], 2),
                    "avg_approval_rate": round(approval_rate, 2),
                    "review_count": stats["count"],
                }
            },
        )
