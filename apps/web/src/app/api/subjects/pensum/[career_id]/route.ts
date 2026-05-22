import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/subjects/pensum/[career_id]
 * Retorna el pensum completo de una carrera (todas las materias ordenadas por semestre).
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ career_id: string }> },
) {
	const { career_id } = await params;

	const subjects = await prisma.subject.findMany({
		where: { careerId: career_id },
		orderBy: { semesterSuggested: "asc" },
	});

	return NextResponse.json(subjects);
}
