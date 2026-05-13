from fastapi import APIRouter, HTTPException, status, Query, Depends
from bson import ObjectId
from typing import List, Optional

from app.database import get_collection
from app.models.subject import SubjectCreate, SubjectResponse
from app.models.user import UserUpdate, ApprovedSubject
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[SubjectResponse])
async def list_subjects(
    career_id: Optional[str] = Query(None),
    university_id: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    subject_type: Optional[str] = Query(None),
):
    """Listar materias con filtros opcionales."""
    subjects = get_collection("subjects")
    query = {}
    if career_id:
        query["career_id"] = career_id
    if university_id:
        query["university_id"] = university_id
    if semester:
        query["semester_suggested"] = semester
    if subject_type:
        query["subject_type"] = subject_type

    cursor = subjects.find(query).sort("semester_suggested", 1)
    results = []
    async for subject in cursor:
        subject["_id"] = str(subject["_id"])
        results.append(SubjectResponse(**subject))
    return results


@router.get("/pensum/{career_id}", response_model=List[SubjectResponse])
async def get_pensum(career_id: str):
    """Obtener pensum completo de una carrera (todas las materias ordenadas por semestre)."""
    subjects = get_collection("subjects")
    cursor = subjects.find({"career_id": career_id}).sort("semester_suggested", 1)
    results = []
    async for subject in cursor:
        subject["_id"] = str(subject["_id"])
        results.append(SubjectResponse(**subject))
    return results


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: str):
    """Obtener detalle de una materia."""
    subjects = get_collection("subjects")
    subject = await subjects.find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia no encontrada",
        )
    subject["_id"] = str(subject["_id"])
    return SubjectResponse(**subject)


@router.get("/available/{career_id}", response_model=List[SubjectResponse])
async def get_available_subjects(career_id: str, current_user: dict = Depends(get_current_user)):
    """Obtener materias disponibles según prelaciones aprobadas del usuario."""
    subjects_col = get_collection("subjects")
    approved_codes = {s["subject_code"] for s in current_user.get("approved_subjects", [])}

    # Get all subjects for this career
    cursor = subjects_col.find({"career_id": career_id})
    available = []
    async for subject in cursor:
        code = subject["code"]
        # Skip already approved subjects
        if code in approved_codes:
            continue
        # Check if all prerequisites are met
        prereqs = subject.get("prerequisites", [])
        if all(prereq in approved_codes for prereq in prereqs):
            subject["_id"] = str(subject["_id"])
            available.append(SubjectResponse(**subject))

    return available


@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_subject(
    subject: ApprovedSubject,
    current_user: dict = Depends(get_current_user),
):
    """Marcar una materia como aprobada."""
    users = get_collection("users")
    subjects_col = get_collection("subjects")

    # Verify subject exists
    subject_doc = await subjects_col.find_one({"code": subject.subject_code})
    if not subject_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia no encontrada",
        )

    # Add to approved list
    approved_list = current_user.get("approved_subjects", [])
    # Check if already approved
    if any(s["subject_code"] == subject.subject_code for s in approved_list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta materia ya está marcada como aprobada",
        )

    new_credits = current_user.get("total_approved_credits", 0) + subject_doc["credits"]

    await users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$push": {"approved_subjects": subject.model_dump()},
            "$set": {"total_approved_credits": new_credits},
        },
    )

    return {
        "message": f"Materia {subject.subject_code} marcada como aprobada",
        "total_approved_credits": new_credits,
    }


@router.delete("/approve/{subject_code}", status_code=status.HTTP_200_OK)
async def unapprove_subject(
    subject_code: str,
    current_user: dict = Depends(get_current_user),
):
    """Desmarcar una materia como aprobada (deshacer)."""
    users = get_collection("users")
    subjects_col = get_collection("subjects")

    approved_list = current_user.get("approved_subjects", [])
    if not any(s["subject_code"] == subject_code for s in approved_list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta materia no está marcada como aprobada",
        )

    subject_doc = await subjects_col.find_one({"code": subject_code})
    credits_to_remove = subject_doc.get("credits", 0) if subject_doc else 0
    new_credits = max(0, current_user.get("total_approved_credits", 0) - credits_to_remove)

    await users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$pull": {"approved_subjects": {"subject_code": subject_code}},
            "$set": {"total_approved_credits": new_credits},
        },
    )

    return {
        "message": f"Materia {subject_code} desmarcada como aprobada",
        "total_approved_credits": new_credits,
    }


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(subject: SubjectCreate):
    """Crear una nueva materia (admin/scraper)."""
    subjects = get_collection("subjects")
    doc = subject.model_dump()
    result = await subjects.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return SubjectResponse(**doc)
