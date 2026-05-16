from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ScheduleBlock(BaseModel):
    subject_code: str = Field(..., description="Código de la materia")
    subject_name: Optional[str] = Field(None, description="Nombre de la materia")
    section: str = Field(..., description="Sección")
    professor: Optional[str] = Field(None, description="Profesor asignado")
    day: str = Field(..., description="Día: lunes, martes, miercoles, jueves, viernes, sabado")
    start_time: str = Field(..., description="Hora inicio (HH:MM)")
    end_time: str = Field(..., description="Hora fin (HH:MM)")
    classroom: Optional[str] = Field(None, description="Aula/Salón")
    modality: str = Field("presencial", description="presencial, virtual, hibrida")


class SemesterOffering(BaseModel):
    """Oferta de una materia en un semestre específico."""
    subject_code: str
    subject_name: Optional[str] = None
    university_id: str
    period: str = Field(..., description="Periodo académico (ej: 2025-1)")
    sections: List[ScheduleBlock] = []


class TentativeSubject(BaseModel):
    subject_code: str = Field(..., description="Código de la materia tentativa")
    subject_name: Optional[str] = None
    priority: int = Field(default=1, ge=1, le=5, description="Prioridad (1=alta, 5=baja)")


class UserSchedule(BaseModel):
    user_id: str = Field(..., description="ID del usuario")
    university_id: str = Field(..., description="ID de la universidad")
    period: str = Field(..., description="Periodo académico")
    schedule_type: str = Field(
        ..., description="Tipo: 'current' (inscrito) o 'tentative' (planificación)"
    )
    blocks: List[ScheduleBlock] = Field(default=[], description="Bloques de horario")
    tentative_subjects: List[TentativeSubject] = Field(
        default=[], description="Materias tentativas (solo para type=tentative)"
    )


class UserScheduleInDB(UserSchedule):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserScheduleResponse(UserSchedule):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}
