import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectEntry = {
	subjectCode: string;
	grade?: number;
	period?: string;
};

/**
 * DELETE /api/subjects/approve/[subject_code]
 * Desmarca una materia como aprobada (deshacer aprobación).
 * Requiere autenticación.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ subject_code: string }> },
) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const { subject_code } = await params;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Esta materia no está marcada como aprobada" },
			{ status: 400 },
		);
	}

	const approvedSubjects = profile.approvedSubjects as ApprovedSubjectEntry[];
	const existing = approvedSubjects.find((s) => s.subjectCode === subject_code);

	if (!existing) {
		return NextResponse.json(
			{ error: "Esta materia no está marcada como aprobada" },
			{ status: 400 },
		);
	}

	// Calcular créditos a restar
	const subject = await prisma.subject.findFirst({
		where: { code: subject_code },
	});
	const creditsToRemove = subject?.credits ?? 0;
	const newTotal = Math.max(0, profile.totalApprovedCredits - creditsToRemove);

	// Filtrar la materia del array
	const updatedList = approvedSubjects.filter(
		(s) => s.subjectCode !== subject_code,
	);

	await prisma.userProfile.update({
		where: { userId: session.user.id },
		data: {
			approvedSubjects: updatedList,
			totalApprovedCredits: newTotal,
		},
	});

	return NextResponse.json({
		message: `Materia ${subject_code} desmarcada como aprobada`,
		totalApprovedCredits: newTotal,
	});
}
