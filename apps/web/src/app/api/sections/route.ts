import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sections?subjectId=...&periodId=...
 * Retorna las secciones de una materia para un período específico, incluyendo nombres de profesores.
 */
export async function GET(request: NextRequest) {
	const sp = request.nextUrl.searchParams;
	const subjectId = sp.get("subjectId");
	const periodId = sp.get("periodId");

	if (!subjectId) {
		return NextResponse.json(
			{ error: "subjectId es requerido" },
			{ status: 400 },
		);
	}

	const sections = await prisma.section.findMany({
		where: {
			subjectId,
			...(periodId && { periodId }),
		},
	});

	// Obtener los nombres de los profesores asociados
	const teacherIds = Array.from(
		new Set(sections.flatMap((s) => s.teacherIds).filter(Boolean)),
	);

	const teachers = teacherIds.length
		? await prisma.teacher.findMany({
				where: { id: { in: teacherIds } },
			})
		: [];

	const teacherNameById = new Map<string, string>(
		teachers.map((t) => {
			const name = [t.name1, t.name2, t.surname1, t.surname2]
				.filter(Boolean)
				.join(" ");
			return [t.id, name];
		}),
	);

	const populatedSections = sections.map((s) => ({
		id: s.id,
		code: s.code,
		teacherIds: s.teacherIds,
		teachers: s.teacherIds
			.map((id) => teacherNameById.get(id))
			.filter((name): name is string => !!name),
		teacherOptions: s.teacherIds
			.filter((id) => teacherNameById.has(id))
			.map((id) => ({ id, name: teacherNameById.get(id) as string })),
	}));

	return NextResponse.json(populatedSections);
}
