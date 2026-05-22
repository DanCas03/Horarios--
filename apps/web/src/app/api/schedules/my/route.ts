import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * GET /api/schedules/my?period=&schedule_type=
 * Retorna los horarios del usuario autenticado.
 */
export async function GET(request: NextRequest) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const sp = request.nextUrl.searchParams;
	const period = sp.get("period");
	const scheduleType = sp.get("schedule_type");

	const schedules = await prisma.schedule.findMany({
		where: {
			userId: session.user.id,
			...(period && { period }),
			...(scheduleType && { scheduleType }),
		},
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json(schedules);
}
