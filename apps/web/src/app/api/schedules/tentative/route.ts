import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * POST /api/schedules/tentative?periodId=...
 * Crea un horario tentativo para un periodo.
 * Requiere autenticación.
 *
 * Body: { sectionIds?: string[], customBlocks?: any[] }
 * Query param: periodId
 */
export async function POST(request: NextRequest) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const periodId = request.nextUrl.searchParams.get("periodId");
	if (!periodId) {
		return NextResponse.json(
			{ error: "El parámetro 'periodId' es requerido" },
			{ status: 400 },
		);
	}

	const body = await request.json();
	const { sectionIds, customBlocks } = body as {
		sectionIds?: string[];
		customBlocks?: any[];
	};

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
	}

	const universityId = profile.universityIds[0] ?? "";

	let resolvedPeriodId = periodId;
	if (periodId && !/^[0-9a-fA-F]{24}$/.test(periodId)) {
		const period = await prisma.period.findFirst({
			where: {
				code: periodId,
				universityId,
			},
		});
		if (period) {
			resolvedPeriodId = period.id;
		} else {
			return NextResponse.json({ error: "Periodo no encontrado" }, { status: 404 });
		}
	}

	const schedule = await prisma.schedule.create({
		data: {
			userProfileId: profile.id,
			universityId,
			periodId: resolvedPeriodId,
			scheduleType: "tentative",
			sectionIds: sectionIds ?? [],
			customBlocks: customBlocks ?? [],
		},
	});

	return NextResponse.json(schedule, { status: 201 });
}
