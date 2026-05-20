import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type TentativeSubject = {
	subjectCode: string;
	subjectName?: string;
	priority: number;
};

/**
 * POST /api/schedules/tentative?period=...
 * Crea un horario tentativo para el próximo periodo.
 * Requiere autenticación.
 *
 * Body: array de TentativeSubject
 * Query param: period (periodo académico, e.g. "2025-2")
 */
export async function POST(request: NextRequest) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const period = request.nextUrl.searchParams.get("period");
	if (!period) {
		return NextResponse.json(
			{ error: "El parámetro 'period' es requerido" },
			{ status: 400 },
		);
	}

	const subjects = (await request.json()) as TentativeSubject[];

	// Obtener la universidad del perfil del usuario (primera, si tiene varias)
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});
	const universityId = profile?.universityIds[0] ?? "";

	const schedule = await prisma.schedule.create({
		data: {
			userId: session.user.id,
			universityId,
			period,
			scheduleType: "tentative",
			blocks: [],
			tentativeSubjects: subjects,
		},
	});

	return NextResponse.json(schedule, { status: 201 });
}
