import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";
import { validateSectionsMentions } from "@/lib/mentions-validation";

/**
 * PUT /api/schedules/[id]
 * Actualiza un horario existente del usuario. Requiere autenticación.
 */
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const { id } = await params;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	// Verificar que el horario pertenece al usuario
	const existing = await prisma.schedule.findFirst({
		where: { id, userProfileId: profile.id },
	});

	if (!existing) {
		return NextResponse.json(
			{ error: "Horario no encontrado" },
			{ status: 404 },
		);
	}

	const body = await request.json();
	const { universityId, periodId, scheduleType, sectionIds } = body as {
		universityId?: string;
		periodId?: string;
		scheduleType?: string;
		sectionIds?: string[];
	};

	// Validar que las materias seleccionadas correspondan a menciones cursadas por el usuario
	if (sectionIds && sectionIds.length > 0) {
		const validation = await validateSectionsMentions(profile.id, sectionIds);
		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}
	}

	const updated = await prisma.schedule.update({
		where: { id },
		data: {
			...(universityId !== undefined && { universityId }),
			...(periodId !== undefined && { periodId }),
			...(scheduleType !== undefined && { scheduleType }),
			...(sectionIds !== undefined && { sectionIds }),
		},
	});

	return NextResponse.json(updated);
}

/**
 * DELETE /api/schedules/[id]
 * Elimina un horario del usuario. Requiere autenticación.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const { id } = await params;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	const existing = await prisma.schedule.findFirst({
		where: { id, userProfileId: profile.id },
	});

	if (!existing) {
		return NextResponse.json(
			{ error: "Horario no encontrado" },
			{ status: 404 },
		);
	}

	await prisma.schedule.delete({ where: { id } });

	return new Response(null, { status: 204 });
}
