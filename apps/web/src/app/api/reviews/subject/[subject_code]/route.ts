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

	// Obtener los ObjectIds de periodos, secciones y profesores para popularlos en memoria
	const periodIds = Array.from(
		new Set(reviews.map((r) => r.periodId).filter((id): id is string => !!id)),
	);
	const sectionIds = Array.from(
		new Set(reviews.map((r) => r.sectionId).filter((id): id is string => !!id)),
	);
	const allTeacherIds = Array.from(
		new Set(
			reviews.flatMap((r) => r.teacherIds).filter((id): id is string => !!id),
		),
	);

	const periods = periodIds.length
		? await prisma.period.findMany({
				where: { id: { in: periodIds } },
				select: { id: true, code: true },
			})
		: [];
	const sections = sectionIds.length
		? await prisma.section.findMany({
				where: { id: { in: sectionIds } },
				select: { id: true, code: true },
			})
		: [];
	const teachers = allTeacherIds.length
		? await prisma.teacher.findMany({
				where: { id: { in: allTeacherIds } },
				select: {
					id: true,
					name1: true,
					name2: true,
					surname1: true,
					surname2: true,
				},
			})
		: [];

	const periodCodeById = new Map(periods.map((p) => [p.id, p.code]));
	const sectionCodeById = new Map(sections.map((s) => [s.id, s.code]));
	const teacherNameById = new Map(
		teachers.map((t) => {
			const name = [t.name1, t.name2, t.surname1, t.surname2]
				.filter(Boolean)
				.join(" ");
			return [t.id, name];
		}),
	);

	const populatedReviews = reviews.map(({ userProfileId: _upId, ...rest }) => {
		const profNames = rest.teacherIds
			.map((id: string) => teacherNameById.get(id))
			.filter((name): name is string => !!name);
		return {
			...rest,
			period: rest.periodId
				? (periodCodeById.get(rest.periodId) ?? rest.periodId)
				: "",
			section: rest.sectionId
				? (sectionCodeById.get(rest.sectionId) ?? rest.sectionId)
				: "",
			professorName: profNames.length > 0 ? profNames.join(", ") : undefined,
		};
	});

	return NextResponse.json(populatedReviews);
}
