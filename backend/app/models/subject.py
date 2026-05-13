from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SubjectBase(BaseModel):
    name: str = Field(..., description="Nombre de la materia")
    code: str = Field(..., description="Código de la materia (ej: MAT-1115)")
    career_id: str = Field(..., description="ID de la carrera")
    university_id: str = Field(..., description="ID de la universidad")
    credits: int = Field(..., description="Créditos de la materia")
    semester_suggested: Optional[int] = Field(
        None, description="Semestre sugerido en el pensum"
    )
    subject_type: str = Field(
        "obligatoria",
        description="Tipo: obligatoria, electiva, pasantia",
    )
    prerequisites: List[str] = Field(
        default=[], description="Códigos de materias prerrequisito"
    )
    corequisites: List[str] = Field(
        default=[], description="Códigos de materias correquisito"
    )
    modality: str = Field(
        "presencial", description="Modalidad: presencial, virtual, hibrida"
    )
    weekly_hours: Optional[int] = Field(None, description="Horas de clase semanales (síncronas)")
    async_hours: Optional[int] = Field(
        None, description="Horas asíncronas estimadas semanales"
    )
    usual_availability: str = Field(
        "todos", description="Disponibilidad: todos, pares, impares (semestres)"
    )
    description: Optional[str] = Field(None, description="Descripción de la materia")


class SubjectCreate(SubjectBase):
    pass


class SubjectInDB(SubjectBase):
    id: Optional[str] = Field(None, alias="_id")
    avg_difficulty: float = Field(default=0.0, description="Dificultad promedio (1-5)")
    avg_approval_rate: float = Field(default=0.0, description="Tasa de aprobación estimada")
    review_count: int = Field(default=0, description="Cantidad de reseñas")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class SubjectResponse(SubjectBase):
    id: str = Field(..., alias="_id")
    avg_difficulty: float = 0.0
    avg_approval_rate: float = 0.0
    review_count: int = 0

    model_config = {"populate_by_name": True}
