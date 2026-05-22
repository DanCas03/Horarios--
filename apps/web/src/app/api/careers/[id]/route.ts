import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/careers/[id]
 * Obtiene una carrera por su ID.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const career = await prisma.career.findUnique({ where: { id } });
	if (!career) {
		return NextResponse.json(
			{ error: "Carrera no encontrada" },
			{ status: 404 },
		);
	}

	return NextResponse.json(career);
}
