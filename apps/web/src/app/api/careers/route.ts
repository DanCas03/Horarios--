import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/careers?university_id=...
 * Lista carreras, opcionalmente filtradas por universidad.
 */
export async function GET(request: NextRequest) {
	const universityId = request.nextUrl.searchParams.get("university_id");

	const careers = await prisma.career.findMany({
		where: universityId ? { universityId } : undefined,
		orderBy: { name: "asc" },
	});

	return NextResponse.json(careers);
}

/**
 * POST /api/careers
 * Crea una nueva carrera.
 */
export async function POST(request: Request) {
	const body = await request.json();
	const {
		name,
		code,
		universityId,
		faculty,
		totalCredits,
		totalSemesters,
		degreeTitle,
		minors,
	} = body as {
		name: string;
		code?: string;
		universityId: string;
		faculty?: string;
		totalCredits?: number;
		totalSemesters?: number;
		degreeTitle?: string;
		minors?: string[];
	};

	if (!name || !universityId) {
		return NextResponse.json(
			{ error: "name y universityId son requeridos" },
			{ status: 400 },
		);
	}

	const career = await prisma.career.create({
		data: {
			name,
			code,
			universityId,
			faculty,
			totalCredits,
			totalSemesters,
			degreeTitle,
			minors: minors ?? [],
		},
	});

	return NextResponse.json(career, { status: 201 });
}
