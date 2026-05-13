from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()


class Database:
    client: AsyncIOMotorClient = None
    db = None


db_instance = Database()


async def connect_to_mongo():
    """Establish connection to MongoDB Atlas."""
    db_instance.client = AsyncIOMotorClient(settings.mongodb_uri)
    db_instance.db = db_instance.client[settings.database_name]
    # Verify connection
    try:
        await db_instance.client.admin.command("ping")
        print(f"[OK] Conectado a MongoDB Atlas - DB: {settings.database_name}")
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MongoDB: {e}")
        raise e


async def close_mongo_connection():
    """Close MongoDB connection."""
    if db_instance.client:
        db_instance.client.close()
        print("[OK] Conexión a MongoDB cerrada")


def get_database():
    """Get database instance."""
    return db_instance.db


# Collection helpers
def get_collection(name: str):
    """Get a specific collection from the database."""
    return db_instance.db[name]
