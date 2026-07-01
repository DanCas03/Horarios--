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
		new Set(
			sections.flatMap((s: any) => s.teacherIds).filter((id: any) => !!id),
		),
	) as string[];

	const teachers = teacherIds.length
		? await prisma.teacher.findMany({
				where: { id: { in: teacherIds } },
			})
		: [];

	const teacherNameById = new Map(
		teachers.map((t: any) => {
			const name = [t.name1, t.name2, t.surname1, t.surname2]
				.filter(Boolean)
				.join(" ");
			return [t.id, name];
		}),
	);

	const populatedSections = sections.map((s: any) => ({
		id: s.id,
		code: s.code,
		teacherIds: s.teacherIds,
		teachers: s.teacherIds
			.map((id: string) => teacherNameById.get(id))
			.filter(Boolean),
		teacherOptions: s.teacherIds
			.filter((id: string) => teacherNameById.has(id))
			.map((id: string) => ({ id, name: teacherNameById.get(id) })),
	}));

	return NextResponse.json(populatedSections);
}
