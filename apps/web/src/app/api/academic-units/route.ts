import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/academic-units?university_id=...
 * Lista las unidades académicas, opcionalmente filtradas por universidad.
 */
export async function GET(request: NextRequest) {
	const universityId = request.nextUrl.searchParams.get("university_id");

	const units = await prisma.academicUnit.findMany({
		where: universityId ? { universityId } : undefined,
		orderBy: { name: "asc" },
	});

	return NextResponse.json(units);
}

/**
 * POST /api/academic-units
 * Crea una nueva unidad académica.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, code, universityId, isExtracurricular, parentId } = body as {
			name?: string;
			code?: string;
			universityId?: string;
			isExtracurricular?: boolean;
			parentId?: string;
		};

		if (!name || !universityId) {
			return NextResponse.json(
				{ error: "name y universityId son requeridos" },
				{ status: 400 },
			);
		}

		const unit = await prisma.academicUnit.create({
			data: {
				name,
				code: code || null,
				universityId,
				isExtracurricular: isExtracurricular ?? false,
				parentId: parentId || null,
			},
		});

		return NextResponse.json(unit, { status: 201 });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
