import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/universities/[id]
 * Obtiene una universidad por su ID.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const university = await prisma.university.findUnique({ where: { id } });
	if (!university) {
		return NextResponse.json(
			{ error: "Universidad no encontrada" },
			{ status: 404 },
		);
	}

	return NextResponse.json(university);
}
