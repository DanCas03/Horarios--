import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * GET /api/reviews/mine
 * Retorna los códigos de materia que el usuario actual ya reseñó,
 * para poder retomar la encuesta con materias aún no reseñadas.
 */
export async function GET() {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!profile) {
		return NextResponse.json({ reviewedSubjectCodes: [] });
	}

	const reviews = await prisma.review.findMany({
		where: { userProfileId: profile.id },
		select: { subjectCode: true },
	});

	const reviewedSubjectCodes = Array.from(
		new Set(reviews.map((r) => r.subjectCode)),
	);

	return NextResponse.json({ reviewedSubjectCodes });
}
