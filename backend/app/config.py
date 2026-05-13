from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Ruta absoluta al directorio backend/, sin importar desde dónde se ejecute
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "guia_estudiantil"

    # JWT Auth
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # App
    app_name: str = "Guía Estudiantil"
    debug: bool = True

    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
