import prisma from "@horaios/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/subjects?university_id=&subject_type=
 * Lista materias con filtros opcionales.
 */
export async function GET(request: NextRequest) {
	const sp = request.nextUrl.searchParams;
	const universityId = sp.get("university_id");
	const subjectType = sp.get("subject_type");

	const subjects = await prisma.subject.findMany({
		where: {
			...(universityId && { universityId }),
			...(subjectType && { subjectType }),
		},
		orderBy: { name: "asc" },
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
	const universityId = body.universityId ?? body.university_id;
	const credits = body.credits;
	const subjectType = body.subjectType ?? body.subject_type;
	const modality = body.modality;
	const usualAvailability = body.usualAvailability ?? body.usual_availability;
	const description = body.description;
	const isActive = body.isActive ?? true;

	if (!name || !code || !universityId || credits === undefined) {
		return NextResponse.json(
			{ error: "name, code, universityId y credits son requeridos" },
			{ status: 400 },
		);
	}

	const subject = await prisma.subject.create({
		data: {
			name,
			code,
			universityId,
			credits,
			subjectType: subjectType ?? "obligatoria",
			modality: modality ?? "presencial",
			usualAvailability: usualAvailability ?? "todos",
			description,
			isActive,
			attributes: [],
		},
	});

	return NextResponse.json(subject, { status: 201 });
}
