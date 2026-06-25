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
 * DELETE /api/subjects/approve/[subject_id]
 * Desmarca una materia como aprobada (deshacer aprobación).
 * Requiere autenticación.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ subject_id: string }> },
) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const { subject_id } = await params;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Esta materia no está marcada como aprobada" },
			{ status: 400 },
		);
	}

	const approvedSubjects = profile.approvedSubjects as ApprovedSubjectItem[];
	const existing = approvedSubjects.find((s) => s.subjectId === subject_id);

	if (!existing) {
		return NextResponse.json(
			{ error: "Esta materia no está marcada como aprobada" },
			{ status: 400 },
		);
	}

	// Filtrar la materia del array
	const updatedList = approvedSubjects.filter(
		(s) => s.subjectId !== subject_id,
	);

	// Calcular total de créditos de manera robusta
	const allApprovedIds = updatedList
		.map((s) => s.subjectId)
		.filter((id): id is string => !!id);

	const subjects = await prisma.subject.findMany({
		where: { id: { in: allApprovedIds } },
		select: { credits: true },
	});
	const newTotal = subjects.reduce((sum, s) => sum + s.credits, 0);

	await prisma.userProfile.update({
		where: { userId: session.user.id },
		data: {
			approvedSubjects: updatedList,
			totalApprovedCredits: newTotal,
		},
	});

	return NextResponse.json({
		message: "Materia desmarcada como aprobada",
		totalApprovedCredits: newTotal,
	});
}
