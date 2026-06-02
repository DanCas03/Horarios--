import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/subjects/pensum/[program_id]
 * Retorna el pensum completo de un programa académico (todas las materias del plan de estudios activo).
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ program_id: string }> },
) {
	const { program_id } = await params;

	// 1. Encontrar el plan de estudios activo para el programa
	const activePlan = await prisma.studyPlan.findFirst({
		where: { academicProgramId: program_id, isActive: true },
	});

	if (!activePlan) {
		return NextResponse.json(
			{ error: "No hay un plan de estudios activo para este programa" },
			{ status: 404 }
		);
	}

	// 2. Obtener las materias del plan de estudios
	const planSubjects = await prisma.studyPlanSubject.findMany({
		where: { studyPlanId: activePlan.id },
	});

	if (planSubjects.length === 0) {
		return NextResponse.json([]);
	}

	const subjectIds = planSubjects
		.map((ps: any) => ps.subjectId)
		.filter((id: any) => id !== null) as string[];

	// 3. Obtener el detalle de las materias
	const subjects = await prisma.subject.findMany({
		where: { id: { in: subjectIds } },
	});

	// 4. Mapear la respuesta para incluir el semestre sugerido
	const result = subjects.map((subject: any) => {
		const planSubject = planSubjects.find((ps: any) => ps.subjectId === subject.id);
		return {
			...subject,
			semesterSuggested: planSubject?.suggestedTerm || null,
			prerequisites: planSubject?.prerequisiteIds || [],
			corequisites: planSubject?.corequisiteIds || []
		};
	});

	// Ordenar por semestre
	result.sort((a: any, b: any) => {
		const semA = a.semesterSuggested || 99;
		const semB = b.semesterSuggested || 99;
		return semA - semB;
	});

	return NextResponse.json(result);
}
