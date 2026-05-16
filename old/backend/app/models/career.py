from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CareerBase(BaseModel):
    name: str = Field(..., description="Nombre de la carrera")
    code: Optional[str] = Field(None, description="Código de la carrera")
    university_id: str = Field(..., description="ID de la universidad")
    faculty: Optional[str] = Field(None, description="Facultad a la que pertenece")
    total_credits: Optional[int] = Field(None, description="Total de créditos para graduarse")
    total_semesters: Optional[int] = Field(None, description="Duración estimada en semestres")
    degree_title: Optional[str] = Field(None, description="Título que otorga")
    minors: Optional[List[str]] = Field(default=[], description="Minors/Menciones disponibles")


class CareerCreate(CareerBase):
    pass


class CareerInDB(CareerBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class CareerResponse(CareerBase):
    id: str = Field(..., alias="_id")

    model_config = {"populate_by_name": True}
