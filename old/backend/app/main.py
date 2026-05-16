from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, universities, careers, subjects, reviews, schedules

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    description="API para la Guía Estudiantil - UCAB & UNIMET",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS - permitir frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(universities.router, prefix="/api/universities", tags=["Universidades"])
app.include_router(careers.router, prefix="/api/careers", tags=["Carreras"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["Materias"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reseñas"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Horarios"])


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "universities": ["UCAB", "UNIMET"],
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
