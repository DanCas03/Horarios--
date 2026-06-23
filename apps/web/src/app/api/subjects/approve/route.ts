import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectPeriod = {
	code?: string;
	start?: Date;
	end?: Date;
	termType?: string;
};

type ApprovedSubjectItem = {
	subjectId?: string | null;
	grade?: number | null;
	period?: ApprovedSubjectPeriod | null;
};

/**
 * POST /api/subjects/approve
 * Marca una materia como aprobada para el usuario autenticado.
 * Body: { subjectId: string, grade?: number, period?: ApprovedSubjectPeriod }
 */
export async function POST(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const payload = body as {
		subjectId?: string;
		grade?: number;
		period?: ApprovedSubjectPeriod;
	};
	const subjectId = payload.subjectId;
	const grade = payload.grade;
	const period = payload.period;

	if (!subjectId) {
		return NextResponse.json(
			{ error: "subjectId es requerido" },
			{ status: 400 },
		);
	}

	// Verificar que la materia existe
	const subject = await prisma.subject.findUnique({
		where: { id: subjectId },
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
		[]) as ApprovedSubjectItem[];

	// Verificar que no esté ya aprobada
	if (approvedSubjects.some((s) => s.subjectId === subjectId)) {
		return NextResponse.json(
			{ error: "Esta materia ya está marcada como aprobada" },
			{ status: 400 },
		);
	}

	const newEntry: ApprovedSubjectItem = { subjectId, grade, period };
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
			academicProgramIds: [],
		},
	});

	return NextResponse.json({
		message: "Materia marcada como aprobada",
		totalApprovedCredits: updatedProfile.totalApprovedCredits,
	});
}
