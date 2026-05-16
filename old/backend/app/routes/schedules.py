from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

from app.database import get_collection
from app.models.schedule import UserSchedule, UserScheduleResponse, TentativeSubject
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/my", response_model=List[UserScheduleResponse])
async def get_my_schedules(
    period: Optional[str] = Query(None),
    schedule_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Obtener horarios del usuario autenticado."""
    schedules = get_collection("schedules")
    query = {"user_id": current_user["_id"]}
    if period:
        query["period"] = period
    if schedule_type:
        query["schedule_type"] = schedule_type

    cursor = schedules.find(query).sort("created_at", -1)
    results = []
    async for schedule in cursor:
        schedule["_id"] = str(schedule["_id"])
        results.append(UserScheduleResponse(**schedule))
    return results


@router.post("/", response_model=UserScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule: UserSchedule,
    current_user: dict = Depends(get_current_user),
):
    """Crear un horario (actual o tentativo)."""
    schedules = get_collection("schedules")

    doc = schedule.model_dump()
    doc["user_id"] = current_user["_id"]
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()

    result = await schedules.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return UserScheduleResponse(**doc)


@router.put("/{schedule_id}", response_model=UserScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule: UserSchedule,
    current_user: dict = Depends(get_current_user),
):
    """Actualizar un horario existente."""
    schedules = get_collection("schedules")

    existing = await schedules.find_one(
        {"_id": ObjectId(schedule_id), "user_id": current_user["_id"]}
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado",
        )

    update_data = schedule.model_dump()
    update_data["updated_at"] = datetime.utcnow()

    await schedules.update_one(
        {"_id": ObjectId(schedule_id)},
        {"$set": update_data},
    )

    updated = await schedules.find_one({"_id": ObjectId(schedule_id)})
    updated["_id"] = str(updated["_id"])
    return UserScheduleResponse(**updated)


@router.post("/tentative", response_model=UserScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_tentative_schedule(
    period: str,
    subjects: List[TentativeSubject],
    current_user: dict = Depends(get_current_user),
):
    """Crear un horario tentativo para el próximo periodo."""
    schedules = get_collection("schedules")

    doc = {
        "user_id": current_user["_id"],
        "university_id": current_user.get("university_id", ""),
        "period": period,
        "schedule_type": "tentative",
        "blocks": [],
        "tentative_subjects": [s.model_dump() for s in subjects],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await schedules.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return UserScheduleResponse(**doc)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Eliminar un horario."""
    schedules = get_collection("schedules")
    result = await schedules.delete_one(
        {"_id": ObjectId(schedule_id), "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado",
        )
