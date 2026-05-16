/*
  Seed directo para MongoDB Atlas (mongosh)
  UNIMET - Administracion de Empresas - Flujograma Enero 2026

  Uso:
  1) Conectate a tu cluster en Atlas y abre mongosh.
  2) Selecciona la DB del proyecto.
  3) Pega este archivo completo y ejecuta.
*/

const UNIMET_DATA = {
	name: "Universidad Metropolitana",
	short_name: "UNIMET",
	logo_url: "/assets/logos/unimet-logo.png",
	website: "https://www.unimet.edu.ve",
	academic_period_type: "trimestre",
	location: "Caracas, Venezuela",
};

const ADM_CAREER = {
	name: "Administracion de Empresas",
	code: "ADM",
	faculty: "Escuela de Ciencias Administrativas",
	total_credits: 200,
	total_semesters: 12,
};

const SUBJECTS_RAW = [
	[
		"FBTGF01",
		"Introduccion a las Ciencias Administrativas",
		1,
		"obligatoria",
		null,
	],
	["FBTMM04", "Matematica Basica", 1, "obligatoria", null],
	["FBTBC01", "Elaboracion de Reportes Empresariales", 1, "obligatoria", null],
	["BPTBC27", "Contabilidad I", 1, "obligatoria", null],
	["FBTEM01", "Competencias para Emprender", 2, "obligatoria", "FBTGF01"],
	["FBTMM01", "Calculo Aplicado I", 2, "obligatoria", "FBTMM04"],
	["FPTAK28", "Herramientas Tecnologicas I", 2, "obligatoria", null],
	["BPTBC28", "Contabilidad II", 2, "obligatoria", "BPTBC27"],
	["FBTEM02", "Ideas Emprendedoras", 3, "obligatoria", "FBTEM01"],
	["FBTMA01", "Calculo Aplicado II", 3, "obligatoria", "FBTMM01"],
	["FPTAK29", "Herramientas Tecnologicas II", 3, "obligatoria", "FPTAK28"],
	["BPTBC29", "Contabilidad III", 3, "obligatoria", "BPTBC28"],
	["FBTHE11", "Venezuela Identidad y Contexto", 4, "electiva", null],
	["BPTMA21", "Estadistica I", 4, "obligatoria", "FBTMA01"],
	["BPTAK30", "Principios de Economia", 4, "obligatoria", null],
	["BPTBC30", "Contabilidad de Costos I", 4, "obligatoria", "BPTBC29"],
	["BPTGF01", "Matematica Financiera", 5, "obligatoria", "FBTHE11"],
	["BPTMA22", "Estadistica II", 5, "obligatoria", "BPTMA21"],
	["BPTAK01", "Microeconomia I", 5, "obligatoria", "BPTAK30"],
	[
		"BPTGF22",
		"Teoria del Comportamiento Organizacional",
		5,
		"obligatoria",
		"BPTBC30",
	],
	[
		"FBTEP02",
		"Mundo Global Tendencias y Transformaciones",
		6,
		"electiva",
		null,
	],
	["BPTGF02", "Finanzas I", 6, "obligatoria", "BPTGF01"],
	["BPTAK11", "Macroeconomia I", 6, "obligatoria", "BPTAK01"],
	["BPTBC24", "Analisis de Estados Financieros", 6, "obligatoria", "BPTBC30"],
	["BPTMK01", "Mercadeo", 7, "obligatoria", "BPTGF01"],
	["BPTGF03", "Finanzas II", 7, "obligatoria", "BPTGF02"],
	["BPTAK12", "Economia Gerencial", 7, "obligatoria", "BPTAK11"],
	["BPTBC26", "Presupuesto Empresarial", 7, "obligatoria", "BPTBC24"],
	["BPTAK13", "Evaluacion de Proyectos", 8, "obligatoria", "FBTEP02"],
	["BPTFG05", "Finanzas Internacionales", 8, "obligatoria", "BPTGF03"],
	["FPTMK01", "Investigacion de Mercado", 8, "obligatoria", "BPTMK01"],
	["BPTGF83", "Taller de Trabajo de Grado", 8, "obligatoria", "105 creditos"],
	["FGE-I", "Electiva I", 9, "electiva", "BPTMK01"],
	["FPTBC63", "Mercado de Valores", 9, "obligatoria", "BPTFG05"],
	["FPTAK27", "Economia Conductual", 9, "obligatoria", "FPTMK01"],
	["FPTBC07", "Bootcamp de Mineria de Datos", 9, "minor", "FPTAK27"],
	["FGE-II", "Electiva II", 10, "electiva", "FGE"],
	["FPSGF-I", "Seminario Profesional I", 10, "obligatoria", "FPTBC63"],
	["FPTBC05", "Bootcamp de Analitica de Datos", 10, "minor", "FPTBC07"],
	[
		"FPTEJ20",
		"Derecho para los Negocios (Business Law)",
		10,
		"obligatoria",
		null,
	],
	["FGE-III", "Electiva III", 11, "electiva", "FGE"],
	["FPSGF-II", "Seminario Profesional II", 11, "obligatoria", "FPSGF-I"],
	["FPTBC71", "Tributos I", 11, "minor", "FPTEJ20"],
	["FGE-IV", "Electiva IV", 12, "electiva", "FGE"],
	["FPSGF-III", "Seminario Profesional III", 12, "obligatoria", "FPSGF-II"],
	["FBTLI14", "Ingles IV", 9, "obligatoria", null],
	["FBTLI15", "Ingles V", 10, "obligatoria", "FBTLI14"],
	["FBTHE05", "Investigacion y Sostenibilidad", 11, "obligatoria", "FBTLI15"],
	["BPTMA31", "Investigacion de Operaciones", 11, "obligatoria", "FBTHE05"],
	["BPTGF46", "Gestion del Capital Humano", 11, "obligatoria", "BPTMA31"],
	["BPTGF62", "Planificacion Empresarial", 12, "obligatoria", "BPTGF46"],
	["FPTGF07", "Gestion de Empresas Familiares", 12, "obligatoria", "BPTGF62"],
	["FPTGF06", "Gobierno Corporativo", 12, "obligatoria", "FPTGF07"],
	["FPTGF05", "Etica Empresarial", 12, "obligatoria", "FPTGF06"],
	["FPTBC62", "Simulacion de Negocios Nacionales", 12, "minor", "FPTGF05"],
	[
		"FPTMK04",
		"Gerencia de Mercadeo y Ventas",
		11,
		"mencion_gerencia",
		"BPTMK01",
	],
	["FPTGF10", "Negociacion", 11, "mencion_gerencia", "105 creditos"],
	["FPTMK20", "Mercado Internacional", 12, "mencion_gerencia", "FPTMK01"],
	[
		"FPTGF53",
		"Manufactura y Cadena de Suministros",
		12,
		"mencion_gerencia",
		"FPTGF10",
	],
	["FPTGF11", "Procesos Gerenciales", 12, "mencion_gerencia", "FPTGF10"],
	[
		"FPTBC56",
		"Gestion de Tesoreria",
		11,
		"mencion_banca_finanzas",
		"105 creditos",
	],
	["FPTBC76", "Banca y Seguros", 11, "mencion_banca_finanzas", "105 creditos"],
	[
		"FPTGF21",
		"Analisis de Inversion y Portafolio",
		12,
		"mencion_banca_finanzas",
		"BPTGF02",
	],
	[
		"FPTGF24",
		"Simulacion Financieras",
		12,
		"mencion_banca_finanzas",
		"BPTGF02",
	],
	["FPTGF22", "Productos Derivados", 12, "mencion_banca_finanzas", "BPTGF02"],
];

function buildSubject([
	code,
	name,
	semester_suggested,
	subject_type,
	prelacion,
]) {
	const isCodeLike =
		typeof prelacion === "string" &&
		/^[A-Z]{2,5}[A-Z0-9-]{2,}$/.test(prelacion);
	return {
		code,
		name,
		credits: 4,
		semester_suggested,
		subject_type: subject_type || "obligatoria",
		prerequisites: isCodeLike ? [prelacion] : [],
		corequisites: [],
		modality: "presencial",
		usual_availability: "todos",
		description:
			prelacion && !isCodeLike
				? `Prelacion (segun flujograma): ${prelacion}`
				: null,
	};
}

const universities = db.getCollection("universities");
const careers = db.getCollection("careers");
const subjects = db.getCollection("subjects");

let unimet = universities.findOne({ short_name: "UNIMET" });
if (!unimet) {
	const insertResult = universities.insertOne(UNIMET_DATA);
	unimet = universities.findOne({ _id: insertResult.insertedId });
	print(`[OK] Universidad creada: ${unimet._id}`);
} else {
	universities.updateOne({ _id: unimet._id }, { $set: UNIMET_DATA });
	print(`[OK] Universidad actualizada: ${unimet._id}`);
}

const universityId = String(unimet._id);

let adm = careers.findOne({ university_id: universityId, code: "ADM" });
if (!adm) {
	const insertResult = careers.insertOne({
		...ADM_CAREER,
		university_id: universityId,
	});
	adm = careers.findOne({ _id: insertResult.insertedId });
	print(`[OK] Carrera creada: ${adm._id}`);
} else {
	careers.updateOne(
		{ _id: adm._id },
		{ $set: { ...ADM_CAREER, university_id: universityId } },
	);
	print(`[OK] Carrera actualizada: ${adm._id}`);
}

const careerId = String(adm._id);

const deleted = subjects.deleteMany({
	university_id: universityId,
	career_id: careerId,
});
print(`[OK] Materias anteriores eliminadas: ${deleted.deletedCount}`);

const docs = SUBJECTS_RAW.map((row) => ({
	...buildSubject(row),
	university_id: universityId,
	career_id: careerId,
}));

if (docs.length > 0) {
	const inserted = subjects.insertMany(docs);
	print(
		`[OK] Materias insertadas: ${Object.keys(inserted.insertedIds).length}`,
	);
} else {
	print("[WARN] No hay materias para insertar");
}

subjects.createIndex({ code: 1 });
subjects.createIndex({ career_id: 1 });
subjects.createIndex({ university_id: 1 });
print("[OK] Indices creados/verificados");
print("[DONE] Seed UNIMET ADM 2026 completado");
