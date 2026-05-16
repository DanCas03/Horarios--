from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UniversityBase(BaseModel):
    name: str = Field(..., description="Nombre completo de la universidad")
    short_name: str = Field(..., description="Nombre corto (ej: UCAB, UNIMET)")
    logo_url: Optional[str] = Field(None, description="URL del logo de la universidad")
    website: Optional[str] = Field(None, description="Sitio web oficial")
    academic_period_type: str = Field(
        ..., description="Tipo de periodo: 'semestre' o 'trimestre'"
    )
    location: Optional[str] = Field(None, description="Ubicación principal")


class UniversityCreate(UniversityBase):
    pass


class UniversityInDB(UniversityBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UniversityResponse(UniversityBase):
    id: str = Field(..., alias="_id")

    model_config = {"populate_by_name": True}
