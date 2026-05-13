"""
Script para inicializar la base de datos en MongoDB Atlas.
Ejecutar UNA VEZ antes de levantar la aplicación.

Uso:
    python init_database.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings

settings = get_settings()

# ============================================================
# DATOS INICIALES - UCAB
# ============================================================
UCAB_DATA = {
    "name": "Universidad Católica Andrés Bello",
    "short_name": "UCAB",
    "logo_url": "/assets/logos/ucab-logo.png",
    "website": "https://www.ucab.edu.ve",
    "academic_period_type": "semestre",
    "location": "Caracas, Venezuela",
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
}

UCAB_CAREERS = [
    {"name": "Ingeniería Informática", "code": "INF", "faculty": "Ingeniería", "total_credits": 200, "total_semesters": 10},
    {"name": "Ingeniería Civil", "code": "CIV", "faculty": "Ingeniería", "total_credits": 200, "total_semesters": 10},
    {"name": "Ingeniería Industrial", "code": "IND", "faculty": "Ingeniería", "total_credits": 200, "total_semesters": 10},
    {"name": "Derecho", "code": "DER", "faculty": "Derecho", "total_credits": 190, "total_semesters": 10},
    {"name": "Comunicación Social", "code": "COM", "faculty": "Humanidades y Educación", "total_credits": 180, "total_semesters": 10},
    {"name": "Psicología", "code": "PSI", "faculty": "Humanidades y Educación", "total_credits": 180, "total_semesters": 10},
    {"name": "Administración y Contaduría", "code": "ADM", "faculty": "Ciencias Económicas y Sociales", "total_credits": 180, "total_semesters": 10},
    {"name": "Economía", "code": "ECO", "faculty": "Ciencias Económicas y Sociales", "total_credits": 180, "total_semesters": 10},
    {"name": "Educación", "code": "EDU", "faculty": "Humanidades y Educación", "total_credits": 170, "total_semesters": 10},
    {"name": "Filosofía", "code": "FIL", "faculty": "Humanidades y Educación", "total_credits": 160, "total_semesters": 10},
    {"name": "Letras", "code": "LET", "faculty": "Humanidades y Educación", "total_credits": 160, "total_semesters": 10},
    {"name": "Relaciones Industriales", "code": "RIN", "faculty": "Ciencias Económicas y Sociales", "total_credits": 180, "total_semesters": 10},
    {"name": "Sociología", "code": "SOC", "faculty": "Ciencias Económicas y Sociales", "total_credits": 170, "total_semesters": 10},
    {"name": "Ingeniería de Telecomunicaciones", "code": "TEL", "faculty": "Ingeniería", "total_credits": 200, "total_semesters": 10},
]

UCAB_INF_SUBJECTS = [
    # Semester 1
    {"code": "MAT-1115", "name": "Matemáticas I", "credits": 4, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "FIS-1115", "name": "Física I", "credits": 3, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "QUI-1115", "name": "Química General", "credits": 3, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "LEN-1100", "name": "Lenguaje y Comunicación", "credits": 3, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "INT-1100", "name": "Introducción a la Ingeniería", "credits": 2, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 2, "usual_availability": "todos"},
    # Semester 2
    {"code": "MAT-1215", "name": "Matemáticas II", "credits": 4, "semester_suggested": 2, "prerequisites": ["MAT-1115"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "FIS-1215", "name": "Física II", "credits": 3, "semester_suggested": 2, "prerequisites": ["FIS-1115"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "PRG-1100", "name": "Programación I", "credits": 4, "semester_suggested": 2, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "DIB-1100", "name": "Dibujo Técnico", "credits": 2, "semester_suggested": 2, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 2, "usual_availability": "todos"},
    # Semester 3
    {"code": "MAT-1315", "name": "Matemáticas III", "credits": 4, "semester_suggested": 3, "prerequisites": ["MAT-1215"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "FIS-1315", "name": "Física III", "credits": 3, "semester_suggested": 3, "prerequisites": ["FIS-1215"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "PRG-1200", "name": "Programación II", "credits": 4, "semester_suggested": 3, "prerequisites": ["PRG-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "EST-1100", "name": "Estadística I", "credits": 3, "semester_suggested": 3, "prerequisites": ["MAT-1115"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    # Semester 4
    {"code": "MAT-1415", "name": "Matemáticas IV", "credits": 4, "semester_suggested": 4, "prerequisites": ["MAT-1315"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "EDD-1100", "name": "Estructuras de Datos", "credits": 4, "semester_suggested": 4, "prerequisites": ["PRG-1200"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BDD-1100", "name": "Bases de Datos I", "credits": 3, "semester_suggested": 4, "prerequisites": ["PRG-1200"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "ARQ-1100", "name": "Arquitectura del Computador", "credits": 3, "semester_suggested": 4, "prerequisites": ["PRG-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    # Semester 5
    {"code": "ALG-1100", "name": "Algoritmos y Complejidad", "credits": 3, "semester_suggested": 5, "prerequisites": ["EDD-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BDD-1200", "name": "Bases de Datos II", "credits": 3, "semester_suggested": 5, "prerequisites": ["BDD-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "RED-1100", "name": "Redes de Computadoras", "credits": 3, "semester_suggested": 5, "prerequisites": ["ARQ-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "ING-1100", "name": "Ingeniería de Software I", "credits": 3, "semester_suggested": 5, "prerequisites": ["EDD-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    # Semester 6
    {"code": "SIS-1100", "name": "Sistemas Operativos", "credits": 3, "semester_suggested": 6, "prerequisites": ["ARQ-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "ING-1200", "name": "Ingeniería de Software II", "credits": 3, "semester_suggested": 6, "prerequisites": ["ING-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "WEB-1100", "name": "Desarrollo Web", "credits": 3, "semester_suggested": 6, "prerequisites": ["BDD-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "INT-1200", "name": "Inteligencia Artificial", "credits": 3, "semester_suggested": 6, "prerequisites": ["ALG-1100"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
]

# ============================================================
# DATOS INICIALES - UNIMET
# ============================================================
UNIMET_DATA = {
    "name": "Universidad Metropolitana",
    "short_name": "UNIMET",
    "logo_url": "/assets/logos/unimet-logo.png",
    "website": "https://www.unimet.edu.ve",
    "academic_period_type": "trimestre",
    "location": "Caracas, Venezuela",
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
}

UNIMET_CAREERS = [
    {"name": "Ingeniería de Sistemas", "code": "ISI", "faculty": "Ingeniería", "total_credits": 230, "total_semesters": 12},
    {"name": "Ingeniería Mecánica", "code": "IME", "faculty": "Ingeniería", "total_credits": 230, "total_semesters": 12},
    {"name": "Ingeniería Eléctrica", "code": "IEL", "faculty": "Ingeniería", "total_credits": 230, "total_semesters": 12},
    {"name": "Ingeniería Química", "code": "IQU", "faculty": "Ingeniería", "total_credits": 230, "total_semesters": 12},
    {"name": "Ingeniería de Producción", "code": "IPR", "faculty": "Ingeniería", "total_credits": 230, "total_semesters": 12},
    {"name": "Ingeniería Civil", "code": "ICI", "faculty": "Ingeniería", "total_credits": 230, "total_semesters": 12},
    {"name": "Administración", "code": "ADM", "faculty": "Ciencias y Artes", "total_credits": 200, "total_semesters": 12},
    {"name": "Contaduría Pública", "code": "CON", "faculty": "Ciencias y Artes", "total_credits": 200, "total_semesters": 12},
    {"name": "Economía Empresarial", "code": "ECE", "faculty": "Ciencias y Artes", "total_credits": 200, "total_semesters": 12},
    {"name": "Derecho", "code": "DER", "faculty": "Ciencias y Artes", "total_credits": 200, "total_semesters": 12},
    {"name": "Idiomas Modernos", "code": "IDM", "faculty": "Ciencias y Artes", "total_credits": 180, "total_semesters": 12},
    {"name": "Psicología", "code": "PSI", "faculty": "Ciencias y Artes", "total_credits": 200, "total_semesters": 12},
    {"name": "Educación", "code": "EDU", "faculty": "Ciencias y Artes", "total_credits": 180, "total_semesters": 12},
    {"name": "Matemáticas Industriales", "code": "MAI", "faculty": "Ciencias y Artes", "total_credits": 200, "total_semesters": 12},
]

UNIMET_ISI_SUBJECTS = [
    # Trimestre 1
    {"code": "BPTM1111", "name": "Matemáticas I", "credits": 4, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTF1111", "name": "Física I", "credits": 3, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTQ1111", "name": "Química I", "credits": 3, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTC1121", "name": "Comunicación y Lenguaje", "credits": 3, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTI1111", "name": "Introducción a la Ingeniería", "credits": 2, "semester_suggested": 1, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 2, "usual_availability": "todos"},
    # Trimestre 2
    {"code": "BPTM1211", "name": "Matemáticas II", "credits": 4, "semester_suggested": 2, "prerequisites": ["BPTM1111"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTF1211", "name": "Física II", "credits": 3, "semester_suggested": 2, "prerequisites": ["BPTF1111"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS1111", "name": "Programación I", "credits": 4, "semester_suggested": 2, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTD1111", "name": "Dibujo para Ingeniería", "credits": 2, "semester_suggested": 2, "prerequisites": [], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 2, "usual_availability": "todos"},
    # Trimestre 3
    {"code": "BPTM1311", "name": "Matemáticas III", "credits": 4, "semester_suggested": 3, "prerequisites": ["BPTM1211"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTF1311", "name": "Física III", "credits": 3, "semester_suggested": 3, "prerequisites": ["BPTF1211"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS1211", "name": "Programación II", "credits": 4, "semester_suggested": 3, "prerequisites": ["BPTS1111"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTE1111", "name": "Estadística I", "credits": 3, "semester_suggested": 3, "prerequisites": ["BPTM1111"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    # Trimestre 4
    {"code": "BPTM1411", "name": "Matemáticas IV", "credits": 4, "semester_suggested": 4, "prerequisites": ["BPTM1311"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTS1311", "name": "Estructuras de Datos", "credits": 4, "semester_suggested": 4, "prerequisites": ["BPTS1211"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 4, "usual_availability": "todos"},
    {"code": "BPTS1411", "name": "Bases de Datos", "credits": 3, "semester_suggested": 4, "prerequisites": ["BPTS1211"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTE1211", "name": "Estadística II", "credits": 3, "semester_suggested": 4, "prerequisites": ["BPTE1111"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    # Trimestre 5
    {"code": "BPTS1511", "name": "Sistemas Operativos", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS1611", "name": "Redes de Computadoras", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS1711", "name": "Ingeniería de Software", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS1811", "name": "Algoritmos y Complejidad", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    # Trimestre 6
    {"code": "BPTS1911", "name": "Desarrollo Web", "credits": 3, "semester_suggested": 6, "prerequisites": ["BPTS1411"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS2011", "name": "Arquitectura de Software", "credits": 3, "semester_suggested": 6, "prerequisites": ["BPTS1711"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS2111", "name": "Seguridad Informática", "credits": 3, "semester_suggested": 6, "prerequisites": ["BPTS1611"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
    {"code": "BPTS2211", "name": "Inteligencia Artificial", "credits": 3, "semester_suggested": 6, "prerequisites": ["BPTS1811"], "corequisites": [], "subject_type": "obligatoria", "modality": "presencial", "weekly_hours": 3, "usual_availability": "todos"},
]


async def init_database():
    """Inicializar base de datos en MongoDB Atlas."""
    print("\n" + "=" * 70)
    print("  INICIALIZANDO BASE DE DATOS - Guía Estudiantil")
    print("=" * 70 + "\n")

    # Conectar a MongoDB
    print(f"[1/6] Conectando a MongoDB Atlas...")
    print(f"      URI: {settings.mongodb_uri[:30]}...")
    
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]

    try:
        # Verificar conexión
        await client.admin.command("ping")
        print(f"      ✓ Conexión exitosa a la base de datos '{settings.database_name}'\n")
    except Exception as e:
        print(f"      ✗ ERROR: No se pudo conectar a MongoDB Atlas")
        print(f"      Detalle: {e}")
        print("\n      Verifica que:")
        print("      - Tu archivo .env tenga la URI correcta")
        print("      - Tu IP esté en la whitelist de Atlas")
        print("      - El cluster esté activo")
        return

    # --- Limpiar colecciones existentes ---
    print("[2/6] Limpiando colecciones existentes...")
    collections = ["universities", "careers", "subjects", "users", "reviews", "schedules"]
    for col_name in collections:
        await db[col_name].delete_many({})
    print(f"      ✓ Colecciones limpiadas\n")

    # --- Insertar Universidades ---
    print("[3/6] Insertando universidades...")
    universities_col = db["universities"]
    
    ucab_result = await universities_col.insert_one(UCAB_DATA)
    ucab_id = str(ucab_result.inserted_id)
    print(f"      ✓ UCAB insertada (ID: {ucab_id})")

    unimet_result = await universities_col.insert_one(UNIMET_DATA)
    unimet_id = str(unimet_result.inserted_id)
    print(f"      ✓ UNIMET insertada (ID: {unimet_id})\n")

    # --- Insertar Carreras ---
    print("[4/6] Insertando carreras...")
    careers_col = db["careers"]

    ucab_career_ids = {}
    for career in UCAB_CAREERS:
        career_doc = {
            **career,
            "university_id": ucab_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await careers_col.insert_one(career_doc)
        ucab_career_ids[career["code"]] = str(result.inserted_id)
    print(f"      ✓ {len(UCAB_CAREERS)} carreras UCAB insertadas")

    unimet_career_ids = {}
    for career in UNIMET_CAREERS:
        career_doc = {
            **career,
            "university_id": unimet_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await careers_col.insert_one(career_doc)
        unimet_career_ids[career["code"]] = str(result.inserted_id)
    print(f"      ✓ {len(UNIMET_CAREERS)} carreras UNIMET insertadas\n")

    # --- Insertar Materias ---
    print("[5/6] Insertando materias de ejemplo...")
    subjects_col = db["subjects"]

    # UCAB - Ingeniería Informática
    ucab_subjects = []
    for subject in UCAB_INF_SUBJECTS:
        subject_doc = {
            **subject,
            "career_id": ucab_career_ids["INF"],
            "university_id": ucab_id,
            "avg_difficulty": 0.0,
            "avg_approval_rate": 0.0,
            "review_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        ucab_subjects.append(subject_doc)
    
    if ucab_subjects:
        await subjects_col.insert_many(ucab_subjects)
    print(f"      ✓ {len(ucab_subjects)} materias UCAB (Ing. Informática) insertadas")

    # UNIMET - Ingeniería de Sistemas
    unimet_subjects = []
    for subject in UNIMET_ISI_SUBJECTS:
        subject_doc = {
            **subject,
            "career_id": unimet_career_ids["ISI"],
            "university_id": unimet_id,
            "avg_difficulty": 0.0,
            "avg_approval_rate": 0.0,
            "review_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        unimet_subjects.append(subject_doc)
    
    if unimet_subjects:
        await subjects_col.insert_many(unimet_subjects)
    print(f"      ✓ {len(unimet_subjects)} materias UNIMET (Ing. Sistemas) insertadas\n")

    # --- Crear Índices ---
    print("[6/6] Creando índices para optimizar consultas...")
    
    # Índices de subjects
    await subjects_col.create_index("code")
    await subjects_col.create_index("career_id")
    await subjects_col.create_index("university_id")
    await subjects_col.create_index([("career_id", 1), ("semester_suggested", 1)])
    print("      ✓ Índices de subjects creados")

    # Índices de careers
    await careers_col.create_index("university_id")
    await careers_col.create_index("code")
    print("      ✓ Índices de careers creados")

    # Índices de universities
    await universities_col.create_index("short_name", unique=True)
    print("      ✓ Índices de universities creados")

    # Índices de users
    users_col = db["users"]
    await users_col.create_index("email", unique=True)
    await users_col.create_index("username", unique=True)
    print("      ✓ Índices de users creados")

    # Índices de reviews
    reviews_col = db["reviews"]
    await reviews_col.create_index("subject_code")
    await reviews_col.create_index("professor_name")
    await reviews_col.create_index("university_id")
    await reviews_col.create_index([("subject_code", 1), ("university_id", 1)])
    print("      ✓ Índices de reviews creados")

    # Índices de schedules
    schedules_col = db["schedules"]
    await schedules_col.create_index("user_id")
    await schedules_col.create_index([("user_id", 1), ("period", 1)])
    await schedules_col.create_index([("user_id", 1), ("schedule_type", 1)])
    print("      ✓ Índices de schedules creados\n")

    # --- Resumen ---
    print("=" * 70)
    print("  ✓ INICIALIZACIÓN COMPLETADA")
    print("=" * 70)
    print(f"\n  Base de Datos: {settings.database_name}")
    print(f"  Universidades: 2 (UCAB, UNIMET)")
    print(f"  Carreras UCAB: {len(UCAB_CAREERS)}")
    print(f"  Carreras UNIMET: {len(UNIMET_CAREERS)}")
    print(f"  Materias ejemplo: {len(ucab_subjects) + len(unimet_subjects)}")
    print(f"  Índices: Creados en todas las colecciones")
    print("\n  La base de datos está lista para usar.")
    print("  Ahora puedes ejecutar: docker-compose up --build")
    print("=" * 70 + "\n")

    client.close()


if __name__ == "__main__":
    try:
        asyncio.run(init_database())
    except KeyboardInterrupt:
        print("\n\n[!] Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n\n[ERROR] Ocurrió un error: {e}")
        import traceback
        traceback.print_exc()
