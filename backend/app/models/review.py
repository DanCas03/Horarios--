from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    subject_code: str = Field(..., description="Código de la materia reseñada")
    university_id: str = Field(..., description="ID de la universidad")
    professor_name: Optional[str] = Field(None, description="Nombre del profesor")
    period: str = Field(..., description="Periodo académico (ej: 2024-1)")
    section: Optional[str] = Field(None, description="Sección cursada")

    # Ratings (1-5)
    difficulty_rating: int = Field(..., ge=1, le=5, description="Dificultad (1=fácil, 5=difícil)")
    professor_rating: Optional[int] = Field(
        None, ge=1, le=5, description="Calidad del profesor (1-5)"
    )
    workload_rating: int = Field(..., ge=1, le=5, description="Carga de trabajo (1=baja, 5=alta)")
    would_recommend: bool = Field(..., description="¿Recomiendas esta materia?")

    # Text feedback
    comment: Optional[str] = Field(None, max_length=2000, description="Comentario/reseña")
    tips: Optional[str] = Field(None, max_length=1000, description="Tips y consejos")
    study_strategy: Optional[str] = Field(
        None, max_length=1000, description="Estrategia de estudio recomendada"
    )


class ReviewCreate(ReviewBase):
    pass


class ReviewInDB(ReviewBase):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="ID del usuario (no público)")
    is_verified: bool = Field(default=False, description="Si el usuario cursó la materia")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class ReviewResponse(ReviewBase):
    """Respuesta pública - SIN user_id para mantener anonimato."""
    id: str = Field(..., alias="_id")
    is_verified: bool = False
    created_at: datetime

    model_config = {"populate_by_name": True}
