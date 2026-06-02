import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/reviews/subject/[subject_code]?university_id=&teacher_id=
 * Retorna las reseñas de una materia (anónimas - sin userProfileId).
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ subject_code: string }> },
) {
	const { subject_code } = await params;
	const sp = request.nextUrl.searchParams;
	const universityId = sp.get("university_id");
	const teacherId = sp.get("teacher_id");

	const reviews = await prisma.review.findMany({
		where: {
			subjectCode: subject_code,
			...(universityId && { universityId }),
			...(teacherId && {
				teacherIds: { has: teacherId },
			}),
		},
		orderBy: { createdAt: "desc" },
	});

	// Omitir userProfileId para mantener anonimato
	return NextResponse.json(reviews.map(({ userProfileId: _upId, ...rest }) => rest));
}
