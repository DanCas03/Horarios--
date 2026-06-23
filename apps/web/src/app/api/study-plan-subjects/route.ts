import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/study-plan-subjects?study_plan_id=...
 * Obtiene todas las materias asignadas a un plan de estudio.
 */
export async function GET(request: NextRequest) {
	const studyPlanId = request.nextUrl.searchParams.get("study_plan_id");

	if (!studyPlanId) {
		return NextResponse.json(
			{ error: "study_plan_id es requerido" },
			{ status: 400 },
		);
	}

	const planSubjects = await prisma.studyPlanSubject.findMany({
		where: { studyPlanId },
	});

	if (planSubjects.length === 0) {
		return NextResponse.json([]);
	}

	const subjectIds = planSubjects
		.map((ps) => ps.subjectId)
		.filter(Boolean) as string[];

	const subjects = await prisma.subject.findMany({
		where: { id: { in: subjectIds } },
	});

	const result = planSubjects.map((ps) => {
		const subDetail = subjects.find((s) => s.id === ps.subjectId);
		return {
			id: ps.id,
			studyPlanId: ps.studyPlanId,
			subjectId: ps.subjectId,
			suggestedTerm: ps.suggestedTerm,
			prerequisiteIds: ps.prerequisiteIds || [],
			corequisiteIds: ps.corequisiteIds || [],
			// Datos de la materia
			code: subDetail?.code || "",
			name: subDetail?.name || "",
			credits: subDetail?.credits || 0,
			modality: subDetail?.modality || "Presencial",
			subjectType: subDetail?.subjectType || "Asignatura",
		};
	});

	// Ordenar por término sugerido
	result.sort((a, b) => (a.suggestedTerm || 0) - (b.suggestedTerm || 0));

	return NextResponse.json(result);
}

/**
 * POST /api/study-plan-subjects
 * Asigna una materia a un plan de estudio.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {
			studyPlanId,
			subjectId,
			suggestedTerm,
			prerequisiteIds,
			corequisiteIds,
		} = body as {
			studyPlanId: string;
			subjectId: string;
			suggestedTerm: number;
			prerequisiteIds?: string[];
			corequisiteIds?: string[];
		};

		if (!studyPlanId || !subjectId || suggestedTerm === undefined) {
			return NextResponse.json(
				{ error: "studyPlanId, subjectId y suggestedTerm son requeridos" },
				{ status: 400 },
			);
		}

		// Evitar duplicación
		const existing = await prisma.studyPlanSubject.findFirst({
			where: { studyPlanId, subjectId },
		});

		if (existing) {
			return NextResponse.json(
				{ error: "La materia ya está asignada a este plan de estudio" },
				{ status: 400 },
			);
		}

		const planSubject = await prisma.studyPlanSubject.create({
			data: {
				studyPlanId,
				subjectId,
				suggestedTerm,
				prerequisiteIds: prerequisiteIds || [],
				corequisiteIds: corequisiteIds || [],
			},
		});

		return NextResponse.json(planSubject, { status: 201 });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
