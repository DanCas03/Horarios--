from fastapi import APIRouter, HTTPException, status, Query
from bson import ObjectId
from typing import List, Optional

from app.database import get_collection
from app.models.career import CareerCreate, CareerResponse

router = APIRouter()


@router.get("/", response_model=List[CareerResponse])
async def list_careers(university_id: Optional[str] = Query(None)):
    """Listar carreras, opcionalmente filtradas por universidad."""
    careers = get_collection("careers")
    query = {}
    if university_id:
        query["university_id"] = university_id
    cursor = careers.find(query)
    results = []
    async for career in cursor:
        career["_id"] = str(career["_id"])
        results.append(CareerResponse(**career))
    return results


@router.get("/{career_id}", response_model=CareerResponse)
async def get_career(career_id: str):
    """Obtener una carrera por ID."""
    careers = get_collection("careers")
    career = await careers.find_one({"_id": ObjectId(career_id)})
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carrera no encontrada",
        )
    career["_id"] = str(career["_id"])
    return CareerResponse(**career)


@router.post("/", response_model=CareerResponse, status_code=status.HTTP_201_CREATED)
async def create_career(career: CareerCreate):
    """Crear una nueva carrera (admin)."""
    careers = get_collection("careers")
    doc = career.model_dump()
    result = await careers.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return CareerResponse(**doc)
