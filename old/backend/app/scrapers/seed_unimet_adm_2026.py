"""
Seed dedicado para UNIMET - Administración de Empresas (Flujograma Enero 2026).

Uso:
    python -m app.scrapers.seed_unimet_adm_2026
"""
import asyncio
import re
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings

settings = get_settings()

UNIMET_DATA = {
    "name": "Universidad Metropolitana",
    "short_name": "UNIMET",
    "logo_url": "/assets/logos/unimet-logo.png",
    "website": "https://www.unimet.edu.ve",
    "academic_period_type": "trimestre",
    "location": "Caracas, Venezuela",
}

ADM_CAREER = {
    "name": "Administración de Empresas",
    "code": "ADM",
    "faculty": "Escuela de Ciencias Administrativas",
    "total_credits": 200,
    "total_semesters": 12,
}


def build_subject(
    code: str,
    name: str,
    trimester: int,
    subject_type: str = "obligatoria",
    prelacion: Optional[str] = None,
) -> Dict[str, Any]:
    prerequisites: List[str] = []
    description = None

    if prelacion:
        if re.fullmatch(r"[A-Z]{2,5}[A-Z0-9-]{2,}", prelacion):
            prerequisites = [prelacion]
        else:
            description = f"Prelación (según flujograma): {prelacion}"

    return {
        "code": code,
        "name": name,
        "credits": 4,
        "semester_suggested": trimester,
        "subject_type": subject_type,
        "prerequisites": prerequisites,
        "corequisites": [],
        "modality": "presencial",
        "usual_availability": "todos",
        "description": description,
    }


UNIMET_ADM_2026_SUBJECTS = [
    # Ciclo común (trimestres I-XII)
    build_subject("FBTGF01", "Introducción a las Ciencias Administrativas", 1),
    build_subject("FBTMM04", "Matemática Básica", 1),
    build_subject("FBTBC01", "Elaboración de Reportes Empresariales", 1),
    build_subject("BPTBC27", "Contabilidad I", 1),
    build_subject("FBTEM01", "Competencias para Emprender", 2, prelacion="FBTGF01"),
    build_subject("FBTMM01", "Cálculo Aplicado I", 2, prelacion="FBTMM04"),
    build_subject("FPTAK28", "Herramientas Tecnológicas I", 2),
    build_subject("BPTBC28", "Contabilidad II", 2, prelacion="BPTBC27"),
    build_subject("FBTEM02", "Ideas Emprendedoras", 3, prelacion="FBTEM01"),
    build_subject("FBTMA01", "Cálculo Aplicado II", 3, prelacion="FBTMM01"),
    build_subject("FPTAK29", "Herramientas Tecnológicas II", 3, prelacion="FPTAK28"),
    build_subject("BPTBC29", "Contabilidad III", 3, prelacion="BPTBC28"),
    build_subject("FBTHE11", "Venezuela Identidad y Contexto", 4, subject_type="electiva"),
    build_subject("BPTMA21", "Estadística I", 4, prelacion="FBTMA01"),
    build_subject("BPTAK30", "Principios de Economía", 4),
    build_subject("BPTBC30", "Contabilidad de Costos I", 4, prelacion="BPTBC29"),
    build_subject("BPTGF01", "Matemática Financiera", 5, prelacion="FBTHE11"),
    build_subject("BPTMA22", "Estadística II", 5, prelacion="BPTMA21"),
    build_subject("BPTAK01", "Microeconomía I", 5, prelacion="BPTAK30"),
    build_subject("BPTGF22", "Teoría del Comportamiento Organizacional", 5, prelacion="BPTBC30"),
    build_subject("FBTEP02", "Mundo Global Tendencias y Transformaciones", 6, subject_type="electiva"),
    build_subject("BPTGF02", "Finanzas I", 6, prelacion="BPTGF01"),
    build_subject("BPTAK11", "Macroeconomía I", 6, prelacion="BPTAK01"),
    build_subject("BPTBC24", "Análisis de Estados Financieros", 6, prelacion="BPTBC30"),
    build_subject("BPTMK01", "Mercadeo", 7, prelacion="BPTGF01"),
    build_subject("BPTGF03", "Finanzas II", 7, prelacion="BPTGF02"),
    build_subject("BPTAK12", "Economía Gerencial", 7, prelacion="BPTAK11"),
    build_subject("BPTBC26", "Presupuesto Empresarial", 7, prelacion="BPTBC24"),
    build_subject("BPTAK13", "Evaluación de Proyectos", 8, prelacion="FBTEP02"),
    build_subject("BPTFG05", "Finanzas Internacionales", 8, prelacion="BPTGF03"),
    build_subject("FPTMK01", "Investigación de Mercado", 8, prelacion="BPTMK01"),
    build_subject("BPTGF83", "Taller de Trabajo de Grado", 8, prelacion="105 créditos"),
    build_subject("FGE-I", "Electiva I", 9, subject_type="electiva", prelacion="BPTMK01"),
    build_subject("FPTBC63", "Mercado de Valores", 9, prelacion="BPTFG05"),
    build_subject("FPTAK27", "Economía Conductual", 9, prelacion="FPTMK01"),
    build_subject("FPTBC07", "Bootcamp de Minería de Datos", 9, subject_type="minor", prelacion="FPTAK27"),
    build_subject("FGE-II", "Electiva II", 10, subject_type="electiva", prelacion="FGE"),
    build_subject("FPSGF-I", "Seminario Profesional I", 10, prelacion="FPTBC63"),
    build_subject("FPTBC05", "Bootcamp de Analítica de Datos", 10, subject_type="minor", prelacion="FPTBC07"),
    build_subject("FPTEJ20", "Derecho para los Negocios (Business Law)", 10),
    build_subject("FGE-III", "Electiva III", 11, subject_type="electiva", prelacion="FGE"),
    build_subject("FPSGF-II", "Seminario Profesional II", 11, prelacion="FPSGF-I"),
    build_subject("FPTBC71", "Tributos I", 11, subject_type="minor", prelacion="FPTEJ20"),
    build_subject("FGE-IV", "Electiva IV", 12, subject_type="electiva", prelacion="FGE"),
    build_subject("FPSGF-III", "Seminario Profesional III", 12, prelacion="FPSGF-II"),
    # Bloque avanzado gerencial
    build_subject("FBTLI14", "Inglés IV", 9),
    build_subject("FBTLI15", "Inglés V", 10, prelacion="FBTLI14"),
    build_subject("FBTHE05", "Investigación y Sostenibilidad", 11, prelacion="FBTLI15"),
    build_subject("BPTMA31", "Investigación de Operaciones", 11, prelacion="FBTHE05"),
    build_subject("BPTGF46", "Gestión del Capital Humano", 11, prelacion="BPTMA31"),
    build_subject("BPTGF62", "Planificación Empresarial", 12, prelacion="BPTGF46"),
    build_subject("FPTGF07", "Gestión de Empresas Familiares", 12, prelacion="BPTGF62"),
    build_subject("FPTGF06", "Gobierno Corporativo", 12, prelacion="FPTGF07"),
    build_subject("FPTGF05", "Ética Empresarial", 12, prelacion="FPTGF06"),
    build_subject("FPTBC62", "Simulación de Negocios Nacionales", 12, subject_type="minor", prelacion="FPTGF05"),
    # Mención gerencia
    build_subject("FPTMK04", "Gerencia de Mercadeo y Ventas", 11, subject_type="mencion_gerencia", prelacion="BPTMK01"),
    build_subject("FPTGF10", "Negociación", 11, subject_type="mencion_gerencia", prelacion="105 créditos"),
    build_subject("FPTMK20", "Mercado Internacional", 12, subject_type="mencion_gerencia", prelacion="FPTMK01"),
    build_subject("FPTGF53", "Manufactura y Cadena de Suministros", 12, subject_type="mencion_gerencia", prelacion="FPTGF10"),
    build_subject("FPTGF11", "Procesos Gerenciales", 12, subject_type="mencion_gerencia", prelacion="FPTGF10"),
    # Mención banca y finanzas
    build_subject("FPTBC56", "Gestión de Tesorería", 11, subject_type="mencion_banca_finanzas", prelacion="105 créditos"),
    build_subject("FPTBC76", "Banca y Seguros", 11, subject_type="mencion_banca_finanzas", prelacion="105 créditos"),
    build_subject("FPTGF21", "Análisis de Inversión y Portafolio", 12, subject_type="mencion_banca_finanzas", prelacion="BPTGF02"),
    build_subject("FPTGF24", "Simulación Financieras", 12, subject_type="mencion_banca_finanzas", prelacion="BPTGF02"),
    build_subject("FPTGF22", "Productos Derivados", 12, subject_type="mencion_banca_finanzas", prelacion="BPTGF02"),
]


async def seed_unimet_adm_2026() -> None:
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]

    universities_col = db["universities"]
    careers_col = db["careers"]
    subjects_col = db["subjects"]

    university = await universities_col.find_one({"short_name": "UNIMET"})
    if not university:
        result = await universities_col.insert_one(UNIMET_DATA)
        university_id = str(result.inserted_id)
        print(f"[OK] Universidad UNIMET creada (ID: {university_id})")
    else:
        university_id = str(university["_id"])
        print(f"[OK] Universidad UNIMET encontrada (ID: {university_id})")

    career = await careers_col.find_one({"university_id": university_id, "code": "ADM"})
    if not career:
        payload = {**ADM_CAREER, "university_id": university_id}
        result = await careers_col.insert_one(payload)
        career_id = str(result.inserted_id)
        print(f"[OK] Carrera ADM creada (ID: {career_id})")
    else:
        career_id = str(career["_id"])
        await careers_col.update_one(
            {"_id": career["_id"]},
            {"$set": {**ADM_CAREER, "university_id": university_id}},
        )
        print(f"[OK] Carrera ADM actualizada (ID: {career_id})")

    delete_result = await subjects_col.delete_many(
        {"university_id": university_id, "career_id": career_id}
    )
    print(f"[OK] Materias anteriores eliminadas: {delete_result.deleted_count}")

    payload = []
    for subject in UNIMET_ADM_2026_SUBJECTS:
        payload.append(
            {
                **subject,
                "career_id": career_id,
                "university_id": university_id,
            }
        )

    await subjects_col.insert_many(payload)
    print(f"[OK] Materias insertadas: {len(payload)}")

    await subjects_col.create_index("code")
    await subjects_col.create_index("career_id")
    await subjects_col.create_index("university_id")
    print("[OK] Índices verificados")

    client.close()
    print("[DONE] Seed UNIMET Administración 2026 completado")


if __name__ == "__main__":
    asyncio.run(seed_unimet_adm_2026())
