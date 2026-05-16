from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


class ApprovedSubject(BaseModel):
    subject_code: str = Field(..., description="Código de la materia")
    grade: Optional[float] = Field(None, description="Nota obtenida (opcional)")
    period: Optional[str] = Field(None, description="Periodo en que se cursó (ej: 2024-1)")


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico")
    username: str = Field(..., description="Nombre de usuario")
    university_id: Optional[str] = Field(None, description="ID de la universidad")
    career_id: Optional[str] = Field(None, description="ID de la carrera")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Contraseña")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    hashed_password: str
    approved_subjects: List[ApprovedSubject] = Field(default=[])
    total_approved_credits: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    username: str
    university_id: Optional[str] = None
    career_id: Optional[str] = None
    approved_subjects: List[ApprovedSubject] = []
    total_approved_credits: int = 0

    model_config = {"populate_by_name": True}


class UserUpdate(BaseModel):
    university_id: Optional[str] = None
    career_id: Optional[str] = None
    approved_subjects: Optional[List[ApprovedSubject]] = None
    total_approved_credits: Optional[int] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
