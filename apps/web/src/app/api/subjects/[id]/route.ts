import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/subjects/[id]
 * Obtiene el detalle de una materia por su ID.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const subject = await prisma.subject.findUnique({ where: { id } });
	if (!subject) {
		return NextResponse.json(
			{ error: "Materia no encontrada" },
			{ status: 404 },
		);
	}

	return NextResponse.json(subject);
}
