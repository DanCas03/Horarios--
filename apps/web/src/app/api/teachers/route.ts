import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/teachers
 * Retorna todos los profesores registrados en la universidad, formateando sus nombres completos.
 */
export async function GET(request: NextRequest) {
	try {
		const teachers = await prisma.teacher.findMany({
			orderBy: [{ surname1: "asc" }, { name1: "asc" }],
		});

		const formatted = teachers.map((t: any) => {
			const name = [t.name1, t.name2, t.surname1, t.surname2]
				.filter(Boolean)
				.join(" ");
			return {
				id: t.id,
				name,
			};
		});

		return NextResponse.json(formatted);
	} catch (error) {
		console.error("Error al obtener profesores:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
