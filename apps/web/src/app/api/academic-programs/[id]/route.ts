import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/academic-programs/[id]
 * Obtiene un programa académico por su ID.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const program = await prisma.academicProgram.findUnique({ where: { id } });
	if (!program) {
		return NextResponse.json(
			{ error: "Programa académico no encontrado" },
			{ status: 404 },
		);
	}

	return NextResponse.json(program);
}
