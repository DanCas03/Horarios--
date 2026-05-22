import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

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

	// Verificar que el horario pertenece al usuario
	const existing = await prisma.schedule.findFirst({
		where: { id, userId: session.user.id },
	});

	if (!existing) {
		return NextResponse.json(
			{ error: "Horario no encontrado" },
			{ status: 404 },
		);
	}

	const body = await request.json();
	const { universityId, period, scheduleType, blocks, tentativeSubjects } =
		body as {
			universityId?: string;
			period?: string;
			scheduleType?: string;
			blocks?: unknown;
			tentativeSubjects?: unknown;
		};

	const updated = await prisma.schedule.update({
		where: { id },
		data: {
			...(universityId !== undefined && { universityId }),
			...(period !== undefined && { period }),
			...(scheduleType !== undefined && { scheduleType }),
			...(blocks !== undefined && { blocks: blocks as never }),
			...(tentativeSubjects !== undefined && {
				tentativeSubjects: tentativeSubjects as never,
			}),
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

	const existing = await prisma.schedule.findFirst({
		where: { id, userId: session.user.id },
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
