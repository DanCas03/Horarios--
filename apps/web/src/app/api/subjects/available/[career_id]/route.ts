import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectEntry = {
	subjectCode: string;
	grade?: number;
	period?: string;
};

/**
 * GET /api/subjects/available/[career_id]
 * Retorna las materias disponibles según las prelaciones aprobadas del usuario.
 * Requiere autenticación.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ career_id: string }> },
) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const { career_id } = await params;

	// Obtener los códigos de materias aprobadas del perfil del usuario
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	const approvedCodes = new Set(
		(profile?.approvedSubjects ?? []).map(
			(s) => (s as ApprovedSubjectEntry).subjectCode,
		),
	);

	// Obtener todas las materias de la carrera
	const allSubjects = await prisma.subject.findMany({
		where: { careerId: career_id },
	});

	// Filtrar: excluir aprobadas y las que no tienen todos los prerrequisitos
	const available = allSubjects.filter((subject) => {
		if (approvedCodes.has(subject.code)) return false;
		return subject.prerequisites.every((prereq) => approvedCodes.has(prereq));
	});

	return NextResponse.json(available);
}
