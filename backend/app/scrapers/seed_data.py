"""
Seed script to populate initial university data into MongoDB.
Run this script once to set up base data for UCAB and UNIMET.

Usage:
    python -m app.scrapers.seed_data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

# ============================================================
# UCAB - Universidad Católica Andrés Bello
# ============================================================
UCAB_DATA = {
    "name": "Universidad Católica Andrés Bello",
    "short_name": "UCAB",
    "logo_url": "/assets/logos/ucab-logo.png",
    "website": "https://www.ucab.edu.ve",
    "academic_period_type": "semestre",
    "location": "Caracas, Venezuela",
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

# Sample subjects for UCAB Ingeniería Informática (first semesters)
UCAB_INF_SUBJECTS = [
    # Semester 1
    {"code": "MAT-1115", "name": "Matemáticas I", "credits": 4, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "FIS-1115", "name": "Física I", "credits": 3, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "QUI-1115", "name": "Química General", "credits": 3, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "LEN-1100", "name": "Lenguaje y Comunicación", "credits": 3, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "INT-1100", "name": "Introducción a la Ingeniería", "credits": 2, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    # Semester 2
    {"code": "MAT-1215", "name": "Matemáticas II", "credits": 4, "semester_suggested": 2, "prerequisites": ["MAT-1115"], "subject_type": "obligatoria"},
    {"code": "FIS-1215", "name": "Física II", "credits": 3, "semester_suggested": 2, "prerequisites": ["FIS-1115"], "subject_type": "obligatoria"},
    {"code": "PRG-1100", "name": "Programación I", "credits": 4, "semester_suggested": 2, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "DIB-1100", "name": "Dibujo Técnico", "credits": 2, "semester_suggested": 2, "prerequisites": [], "subject_type": "obligatoria"},
    # Semester 3
    {"code": "MAT-1315", "name": "Matemáticas III", "credits": 4, "semester_suggested": 3, "prerequisites": ["MAT-1215"], "subject_type": "obligatoria"},
    {"code": "FIS-1315", "name": "Física III", "credits": 3, "semester_suggested": 3, "prerequisites": ["FIS-1215"], "subject_type": "obligatoria"},
    {"code": "PRG-1200", "name": "Programación II", "credits": 4, "semester_suggested": 3, "prerequisites": ["PRG-1100"], "subject_type": "obligatoria"},
    {"code": "EST-1100", "name": "Estadística I", "credits": 3, "semester_suggested": 3, "prerequisites": ["MAT-1115"], "subject_type": "obligatoria"},
    # Semester 4
    {"code": "MAT-1415", "name": "Matemáticas IV", "credits": 4, "semester_suggested": 4, "prerequisites": ["MAT-1315"], "subject_type": "obligatoria"},
    {"code": "EDD-1100", "name": "Estructuras de Datos", "credits": 4, "semester_suggested": 4, "prerequisites": ["PRG-1200"], "subject_type": "obligatoria"},
    {"code": "BDD-1100", "name": "Bases de Datos I", "credits": 3, "semester_suggested": 4, "prerequisites": ["PRG-1200"], "subject_type": "obligatoria"},
    {"code": "ARQ-1100", "name": "Arquitectura del Computador", "credits": 3, "semester_suggested": 4, "prerequisites": ["PRG-1100"], "subject_type": "obligatoria"},
    # Semester 5
    {"code": "ALG-1100", "name": "Algoritmos y Complejidad", "credits": 3, "semester_suggested": 5, "prerequisites": ["EDD-1100"], "subject_type": "obligatoria"},
    {"code": "BDD-1200", "name": "Bases de Datos II", "credits": 3, "semester_suggested": 5, "prerequisites": ["BDD-1100"], "subject_type": "obligatoria"},
    {"code": "RED-1100", "name": "Redes de Computadoras", "credits": 3, "semester_suggested": 5, "prerequisites": ["ARQ-1100"], "subject_type": "obligatoria"},
    {"code": "ING-1100", "name": "Ingeniería de Software I", "credits": 3, "semester_suggested": 5, "prerequisites": ["EDD-1100"], "subject_type": "obligatoria"},
]

# ============================================================
# UNIMET - Universidad Metropolitana
# ============================================================
UNIMET_DATA = {
    "name": "Universidad Metropolitana",
    "short_name": "UNIMET",
    "logo_url": "/assets/logos/unimet-logo.png",
    "website": "https://www.unimet.edu.ve",
    "academic_period_type": "trimestre",
    "location": "Caracas, Venezuela",
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

# Sample subjects for UNIMET Ingeniería de Sistemas (first trimesters)
UNIMET_ISI_SUBJECTS = [
    # Trimester 1
    {"code": "BPTM1111", "name": "Matemáticas I", "credits": 4, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "BPTF1111", "name": "Física I", "credits": 3, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "BPTQ1111", "name": "Química I", "credits": 3, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "BPTC1121", "name": "Comunicación y Lenguaje", "credits": 3, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "BPTI1111", "name": "Introducción a la Ingeniería", "credits": 2, "semester_suggested": 1, "prerequisites": [], "subject_type": "obligatoria"},
    # Trimester 2
    {"code": "BPTM1211", "name": "Matemáticas II", "credits": 4, "semester_suggested": 2, "prerequisites": ["BPTM1111"], "subject_type": "obligatoria"},
    {"code": "BPTF1211", "name": "Física II", "credits": 3, "semester_suggested": 2, "prerequisites": ["BPTF1111"], "subject_type": "obligatoria"},
    {"code": "BPTS1111", "name": "Programación I", "credits": 4, "semester_suggested": 2, "prerequisites": [], "subject_type": "obligatoria"},
    {"code": "BPTD1111", "name": "Dibujo para Ingeniería", "credits": 2, "semester_suggested": 2, "prerequisites": [], "subject_type": "obligatoria"},
    # Trimester 3
    {"code": "BPTM1311", "name": "Matemáticas III", "credits": 4, "semester_suggested": 3, "prerequisites": ["BPTM1211"], "subject_type": "obligatoria"},
    {"code": "BPTF1311", "name": "Física III", "credits": 3, "semester_suggested": 3, "prerequisites": ["BPTF1211"], "subject_type": "obligatoria"},
    {"code": "BPTS1211", "name": "Programación II", "credits": 4, "semester_suggested": 3, "prerequisites": ["BPTS1111"], "subject_type": "obligatoria"},
    {"code": "BPTE1111", "name": "Estadística I", "credits": 3, "semester_suggested": 3, "prerequisites": ["BPTM1111"], "subject_type": "obligatoria"},
    # Trimester 4
    {"code": "BPTM1411", "name": "Matemáticas IV", "credits": 4, "semester_suggested": 4, "prerequisites": ["BPTM1311"], "subject_type": "obligatoria"},
    {"code": "BPTS1311", "name": "Estructuras de Datos", "credits": 4, "semester_suggested": 4, "prerequisites": ["BPTS1211"], "subject_type": "obligatoria"},
    {"code": "BPTS1411", "name": "Bases de Datos", "credits": 3, "semester_suggested": 4, "prerequisites": ["BPTS1211"], "subject_type": "obligatoria"},
    {"code": "BPTE1211", "name": "Estadística II", "credits": 3, "semester_suggested": 4, "prerequisites": ["BPTE1111"], "subject_type": "obligatoria"},
    # Trimester 5
    {"code": "BPTS1511", "name": "Sistemas Operativos", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "subject_type": "obligatoria"},
    {"code": "BPTS1611", "name": "Redes de Computadoras", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "subject_type": "obligatoria"},
    {"code": "BPTS1711", "name": "Ingeniería de Software", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "subject_type": "obligatoria"},
    {"code": "BPTS1811", "name": "Algoritmos y Complejidad", "credits": 3, "semester_suggested": 5, "prerequisites": ["BPTS1311"], "subject_type": "obligatoria"},
]


async def seed_database():
    """Populate database with initial university, career, and subject data."""
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]

    print("=" * 60)
    print("  SEEDING DATABASE - Guía Estudiantil")
    print("=" * 60)

    # --- Universities ---
    universities_col = db["universities"]
    # Clear existing
    await universities_col.delete_many({})

    ucab_result = await universities_col.insert_one(UCAB_DATA)
    ucab_id = str(ucab_result.inserted_id)
    print(f"[OK] UCAB insertada (ID: {ucab_id})")

    unimet_result = await universities_col.insert_one(UNIMET_DATA)
    unimet_id = str(unimet_result.inserted_id)
    print(f"[OK] UNIMET insertada (ID: {unimet_id})")

    # --- Careers ---
    careers_col = db["careers"]
    await careers_col.delete_many({})

    ucab_career_ids = {}
    for career in UCAB_CAREERS:
        career["university_id"] = ucab_id
        result = await careers_col.insert_one(career)
        ucab_career_ids[career["code"]] = str(result.inserted_id)
    print(f"[OK] {len(UCAB_CAREERS)} carreras UCAB insertadas")

    unimet_career_ids = {}
    for career in UNIMET_CAREERS:
        career["university_id"] = unimet_id
        result = await careers_col.insert_one(career)
        unimet_career_ids[career["code"]] = str(result.inserted_id)
    print(f"[OK] {len(UNIMET_CAREERS)} carreras UNIMET insertadas")

    # --- Subjects ---
    subjects_col = db["subjects"]
    await subjects_col.delete_many({})

    for subject in UCAB_INF_SUBJECTS:
        subject["career_id"] = ucab_career_ids["INF"]
        subject["university_id"] = ucab_id
        subject["corequisites"] = []
        subject["modality"] = "presencial"
    await subjects_col.insert_many(UCAB_INF_SUBJECTS)
    print(f"[OK] {len(UCAB_INF_SUBJECTS)} materias UCAB Ing. Informática insertadas")

    for subject in UNIMET_ISI_SUBJECTS:
        subject["career_id"] = unimet_career_ids["ISI"]
        subject["university_id"] = unimet_id
        subject["corequisites"] = []
        subject["modality"] = "presencial"
    await subjects_col.insert_many(UNIMET_ISI_SUBJECTS)
    print(f"[OK] {len(UNIMET_ISI_SUBJECTS)} materias UNIMET Ing. Sistemas insertadas")

    # --- Create indexes ---
    await subjects_col.create_index("code")
    await subjects_col.create_index("career_id")
    await subjects_col.create_index("university_id")
    await careers_col.create_index("university_id")
    await db["users"].create_index("email", unique=True)
    await db["users"].create_index("username", unique=True)
    await db["reviews"].create_index("subject_code")
    await db["reviews"].create_index("professor_name")
    await db["schedules"].create_index("user_id")
    print("[OK] Índices creados")

    print("=" * 60)
    print("  SEEDING COMPLETADO")
    print(f"  Universidades: 2")
    print(f"  Carreras UCAB: {len(UCAB_CAREERS)}")
    print(f"  Carreras UNIMET: {len(UNIMET_CAREERS)}")
    print(f"  Materias ejemplo: {len(UCAB_INF_SUBJECTS) + len(UNIMET_ISI_SUBJECTS)}")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
