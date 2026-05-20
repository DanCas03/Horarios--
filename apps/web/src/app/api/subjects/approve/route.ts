import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectEntry = {
	subjectCode: string;
	grade?: number;
	period?: string;
};

/**
 * POST /api/subjects/approve
 * Marca una materia como aprobada para el usuario autenticado.
 * Body: { subjectCode?: string, subject_code?: string, grade?: number, period?: string }
 */
export async function POST(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const payload = body as {
		subjectCode?: string;
		subject_code?: string;
		grade?: number;
		period?: string;
	};
	const subjectCode = payload.subjectCode ?? payload.subject_code;
	const grade = payload.grade;
	const period = payload.period;

	if (!subjectCode) {
		return NextResponse.json(
			{ error: "subjectCode es requerido" },
			{ status: 400 },
		);
	}

	// Verificar que la materia existe
	const subject = await prisma.subject.findFirst({
		where: { code: subjectCode },
	});
	if (!subject) {
		return NextResponse.json(
			{ error: "Materia no encontrada" },
			{ status: 404 },
		);
	}

	// Obtener o crear perfil
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	const approvedSubjects = (profile?.approvedSubjects ??
		[]) as ApprovedSubjectEntry[];

	// Verificar que no esté ya aprobada
	if (approvedSubjects.some((s) => s.subjectCode === subjectCode)) {
		return NextResponse.json(
			{ error: "Esta materia ya está marcada como aprobada" },
			{ status: 400 },
		);
	}

	const newEntry: ApprovedSubjectEntry = { subjectCode, grade, period };
	const newTotal = (profile?.totalApprovedCredits ?? 0) + subject.credits;

	const updatedProfile = await prisma.userProfile.upsert({
		where: { userId: session.user.id },
		update: {
			approvedSubjects: { push: newEntry },
			totalApprovedCredits: newTotal,
		},
		create: {
			userId: session.user.id,
			approvedSubjects: [newEntry],
			totalApprovedCredits: subject.credits,
			universityIds: [],
			careerIds: [],
		},
	});

	return NextResponse.json({
		message: `Materia ${subjectCode} marcada como aprobada`,
		totalApprovedCredits: updatedProfile.totalApprovedCredits,
	});
}
