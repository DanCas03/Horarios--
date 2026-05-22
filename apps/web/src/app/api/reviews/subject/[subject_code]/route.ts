import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/reviews/subject/[subject_code]?university_id=&professor=
 * Retorna las reseñas de una materia (anónimas - sin userId).
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ subject_code: string }> },
) {
	const { subject_code } = await params;
	const sp = request.nextUrl.searchParams;
	const universityId = sp.get("university_id");
	const professor = sp.get("professor");

	const reviews = await prisma.review.findMany({
		where: {
			subjectCode: subject_code,
			...(universityId && { universityId }),
			...(professor && {
				professorName: { contains: professor, mode: "insensitive" },
			}),
		},
		orderBy: { createdAt: "desc" },
	});

	// Omitir userId para mantener anonimato
	return NextResponse.json(reviews.map(({ userId: _userId, ...rest }) => rest));
}
