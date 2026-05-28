import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/reviews/professor/[teacher_id]
 * Retorna las reseñas de un profesor (anónimas).
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ teacher_id: string }> },
) {
	const { teacher_id } = await params;

	const reviews = await prisma.review.findMany({
		where: {
			teacherIds: { has: teacher_id },
		},
		orderBy: { createdAt: "desc" },
	});

	// Omitir userProfileId
	return NextResponse.json(reviews.map(({ userProfileId: _upId, ...rest }) => rest));
}
