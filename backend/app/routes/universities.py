from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from typing import List

from app.database import get_collection
from app.models.university import UniversityCreate, UniversityResponse

router = APIRouter()


@router.get("/", response_model=List[UniversityResponse])
async def list_universities():
    """Listar todas las universidades disponibles."""
    universities = get_collection("universities")
    cursor = universities.find()
    results = []
    async for uni in cursor:
        uni["_id"] = str(uni["_id"])
        results.append(UniversityResponse(**uni))
    return results


@router.get("/{university_id}", response_model=UniversityResponse)
async def get_university(university_id: str):
    """Obtener una universidad por ID."""
    universities = get_collection("universities")
    uni = await universities.find_one({"_id": ObjectId(university_id)})
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universidad no encontrada",
        )
    uni["_id"] = str(uni["_id"])
    return UniversityResponse(**uni)


@router.post("/", response_model=UniversityResponse, status_code=status.HTTP_201_CREATED)
async def create_university(university: UniversityCreate):
    """Crear una nueva universidad (admin)."""
    universities = get_collection("universities")
    doc = university.model_dump()
    result = await universities.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return UniversityResponse(**doc)
