import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * GET /api/periods?university_id=...
 * Obtiene la lista de periodos (por defecto los de la universidad del usuario).
 */
export async function GET(request: NextRequest) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const searchParams = request.nextUrl.searchParams;
	const requestedUniversityId = searchParams.get("university_id");

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	const universityId = requestedUniversityId || profile.universityIds[0];

	if (!universityId) {
		return NextResponse.json(
			{ error: "No se ha especificado la universidad" },
			{ status: 400 },
		);
	}

	try {
		const periods = await prisma.period.findMany({
			where: {
				universityId,
			},
			orderBy: {
				start: "desc",
			},
		});

		return NextResponse.json(periods);
	} catch (error) {
		console.error("Error al obtener periodos:", error);
		return NextResponse.json(
			{ error: "Error al obtener periodos" },
			{ status: 500 },
		);
	}
}
