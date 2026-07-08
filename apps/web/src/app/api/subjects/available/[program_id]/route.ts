import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectItem = {
	subjectId?: string | null;
	grade?: number | null;
	period?: unknown | null;
};

/**
 * GET /api/subjects/available/[program_id]
 * Retorna las materias disponibles según las prelaciones aprobadas del usuario en el plan de estudios.
 * Requiere autenticación.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ program_id: string }> },
) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const { program_id } = await params;

	// Obtener IDs de materias aprobadas del perfil del usuario
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	const approvedIds = new Set(
		(profile?.approvedSubjects ?? [])
			.map((s) => (s as ApprovedSubjectItem).subjectId)
			.filter((id): id is string => !!id),
	);

	// Obtener el plan de estudios activo
	const activePlan = await prisma.studyPlan.findFirst({
		where: { academicProgramId: program_id, isActive: true },
	});

	if (!activePlan) {
		return NextResponse.json([]);
	}

	// Obtener las materias del plan de estudios con sus prerrequisitos
	const planSubjects = await prisma.studyPlanSubject.findMany({
		where: { studyPlanId: activePlan.id },
	});

	// Filtrar las materias que NO están aprobadas y que cumplen prerrequisitos
	const availablePlanSubjects = planSubjects.filter((ps) => {
		if (!ps.subjectId || approvedIds.has(ps.subjectId)) return false;
		// Tiene que tener aprobados todos los prerrequisitos (identificados por subjectId)
		return ps.prerequisiteIds.every((prereqId) => approvedIds.has(prereqId));
	});

	const availableSubjectIds = availablePlanSubjects
		.map((ps) => ps.subjectId)
		.filter((id): id is string => id !== null);

	if (availableSubjectIds.length === 0) {
		return NextResponse.json([]);
	}

	// Obtener el detalle de las materias disponibles
	const availableSubjects = await prisma.subject.findMany({
		where: { id: { in: availableSubjectIds } },
	});

	// Mapear con información de prerrequisitos/semestre
	const result = availableSubjects.map((subject) => {
		const planSubject = availablePlanSubjects.find(
			(ps) => ps.subjectId === subject.id,
		);
		return {
			...subject,
			semesterSuggested: planSubject?.suggestedTerm || null,
			prerequisites: planSubject?.prerequisiteIds || [],
			corequisites: planSubject?.corequisiteIds || [],
		};
	});

	return NextResponse.json(result);
}
