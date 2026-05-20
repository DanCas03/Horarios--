import prisma from "@horaios/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/subjects?career_id=&university_id=&semester=&subject_type=
 * Lista materias con filtros opcionales.
 */
export async function GET(request: NextRequest) {
	const sp = request.nextUrl.searchParams;
	const careerId = sp.get("career_id");
	const universityId = sp.get("university_id");
	const semester = sp.get("semester");
	const subjectType = sp.get("subject_type");

	const subjects = await prisma.subject.findMany({
		where: {
			...(careerId && { careerId }),
			...(universityId && { universityId }),
			...(semester && { semesterSuggested: Number(semester) }),
			...(subjectType && { subjectType }),
		},
		orderBy: { semesterSuggested: "asc" },
	});

	return NextResponse.json(subjects);
}

/**
 * POST /api/subjects
 * Crea una nueva materia (admin/scraper).
 */
export async function POST(request: Request) {
	const body = await request.json();
	const name = body.name ?? body.nombre;
	const code = body.code;
	const careerId = body.careerId ?? body.career_id;
	const universityId = body.universityId ?? body.university_id;
	const credits = body.credits;
	const semesterSuggested = body.semesterSuggested ?? body.semester_suggested;
	const subjectType = body.subjectType ?? body.subject_type;
	const prerequisites = body.prerequisites;
	const corequisites = body.corequisites;
	const modality = body.modality;
	const weeklyHours = body.weeklyHours ?? body.weekly_hours;
	const asyncHours = body.asyncHours ?? body.async_hours;
	const usualAvailability = body.usualAvailability ?? body.usual_availability;
	const description = body.description;

	if (!name || !code || !careerId || !universityId || credits === undefined) {
		return NextResponse.json(
			{ error: "name, code, careerId, universityId y credits son requeridos" },
			{ status: 400 },
		);
	}

	const subject = await prisma.subject.create({
		data: {
			name,
			code,
			careerId,
			universityId,
			credits,
			semesterSuggested,
			subjectType: subjectType ?? "obligatoria",
			prerequisites: prerequisites ?? [],
			corequisites: corequisites ?? [],
			modality: modality ?? "presencial",
			weeklyHours,
			asyncHours,
			usualAvailability: usualAvailability ?? "todos",
			description,
		},
	});

	return NextResponse.json(subject, { status: 201 });
}
