import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/reviews/professor/[professor_name]
 * Retorna las reseñas de un profesor (búsqueda parcial, anónimas).
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ professor_name: string }> },
) {
	const { professor_name } = await params;

	const reviews = await prisma.review.findMany({
		where: {
			professorName: {
				contains: decodeURIComponent(professor_name),
				mode: "insensitive",
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json(reviews.map(({ userId: _userId, ...rest }) => rest));
}
