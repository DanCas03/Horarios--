import prisma from "@horaios/db";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";
import { validateSectionsMentions } from "@/lib/mentions-validation";

/**
 * POST /api/schedules
 * Crea un horario. Requiere autenticación.
 */
export async function POST(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const { universityId, periodId, scheduleType, sectionIds, customBlocks } =
		body as {
			universityId?: string;
			periodId?: string;
			scheduleType: string;
			sectionIds?: string[];
			customBlocks?: Prisma.InputJsonValue[];
		};

	if (!scheduleType) {
		return NextResponse.json(
			{ error: "scheduleType es requerido" },
			{ status: 400 },
		);
	}

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	// Validar que las materias seleccionadas correspondan a menciones cursadas por el usuario
	if (sectionIds && sectionIds.length > 0) {
		const validation = await validateSectionsMentions(profile.id, sectionIds);
		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}
	}

	let resolvedPeriodId = periodId;
	if (periodId && !/^[0-9a-fA-F]{24}$/.test(periodId)) {
		const period = await prisma.period.findFirst({
			where: {
				code: periodId,
				...(universityId && { universityId }),
			},
		});
		if (period) {
			resolvedPeriodId = period.id;
		} else {
			return NextResponse.json(
				{ error: "Periodo no encontrado" },
				{ status: 404 },
			);
		}
	}

	const schedule = await prisma.schedule.create({
		data: {
			userProfileId: profile.id,
			universityId,
			periodId: resolvedPeriodId,
			scheduleType,
			sectionIds: sectionIds ?? [],
			customBlocks: customBlocks ?? [],
		},
	});

	return NextResponse.json(schedule, { status: 201 });
}
