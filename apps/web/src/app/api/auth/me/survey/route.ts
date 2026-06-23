import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * PATCH /api/auth/me/survey
 * Marca la encuesta del usuario como completada.
 * Requiere al menos 1 review guardada.
 */
export async function PATCH() {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	// Verificar que el usuario tiene al menos 1 review
	const reviewCount = await prisma.review.count({
		where: { userProfileId: profile.id },
	});

	if (reviewCount < 1) {
		return NextResponse.json(
			{ error: "Debes tener al menos 1 resena antes de finalizar la encuesta" },
			{ status: 400 },
		);
	}

	await prisma.userProfile.update({
		where: { userId: session.user.id },
		data: { surveyCompleted: true },
	});

	return NextResponse.json({ success: true });
}
