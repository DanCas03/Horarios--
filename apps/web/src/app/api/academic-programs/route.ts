import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/academic-programs?university_id=...
 * Lista programas académicos, opcionalmente filtrados por universidad.
 */
export async function GET(request: NextRequest) {
	const universityId = request.nextUrl.searchParams.get("university_id");

	const programs = await prisma.academicProgram.findMany({
		where: universityId ? { universityId } : undefined,
		orderBy: { name: "asc" },
	});

	return NextResponse.json(programs);
}

/**
 * POST /api/academic-programs
 * Crea un nuevo programa académico.
 */
export async function POST(request: Request) {
	const body = await request.json();
	const {
		name,
		universityId,
		academicUnitId,
		programType,
		termType,
		academicLevel,
		totalTerms,
		totalCredits,
	} = body as {
		name: string;
		universityId?: string;
		academicUnitId?: string;
		programType?: string;
		termType?: string;
		academicLevel?: string;
		totalTerms?: number;
		totalCredits?: number;
	};

	if (!name) {
		return NextResponse.json({ error: "name es requerido" }, { status: 400 });
	}

	const program = await prisma.academicProgram.create({
		data: {
			name,
			universityId,
			academicUnitId,
			programType,
			termType,
			academicLevel,
			totalTerms,
			totalCredits,
		},
	});

	return NextResponse.json(program, { status: 201 });
}
