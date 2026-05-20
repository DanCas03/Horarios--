import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ScheduleBlock = {
	subjectCode: string;
	subjectName?: string;
	section: string;
	professor?: string;
	day: string;
	startTime: string;
	endTime: string;
	classroom?: string;
	modality: string;
};

type TentativeSubject = {
	subjectCode: string;
	subjectName?: string;
	priority: number;
};

/**
 * POST /api/schedules
 * Crea un horario (actual o tentativo). Requiere autenticación.
 */
export async function POST(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const { universityId, period, scheduleType, blocks, tentativeSubjects } =
		body as {
			universityId: string;
			period: string;
			scheduleType: string;
			blocks?: ScheduleBlock[];
			tentativeSubjects?: TentativeSubject[];
		};

	if (!universityId || !period || !scheduleType) {
		return NextResponse.json(
			{ error: "universityId, period y scheduleType son requeridos" },
			{ status: 400 },
		);
	}

	const schedule = await prisma.schedule.create({
		data: {
			userId: session.user.id,
			universityId,
			period,
			scheduleType,
			blocks: blocks ?? [],
			tentativeSubjects: tentativeSubjects ?? [],
		},
	});

	return NextResponse.json(schedule, { status: 201 });
}
