import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * GET /api/auth/me
 * Retorna la sesión actual + perfil extendido del usuario (UserProfile).
 * Crea el perfil si es la primera vez que el usuario accede.
 */
export async function GET() {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	// Obtener o crear el perfil del usuario
	let profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		profile = await prisma.userProfile.create({
			data: {
				userId: session.user.id,
				universityIds: [],
				academicProgramIds: [],
				approvedSubjects: [],
				totalApprovedCredits: 0,
			},
		});
	}

	return NextResponse.json({
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image,
		username: profile.username,
		universityIds: profile.universityIds,
		academicProgramIds: profile.academicProgramIds,
		approvedSubjects: profile.approvedSubjects,
		totalApprovedCredits: profile.totalApprovedCredits,
	});
}

/**
 * PUT /api/auth/me
 * Actualiza los campos del perfil extendido (username, universityIds, careerIds).
 */
export async function PUT(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const { username, universityIds, academicProgramIds } = body as {
		username?: string;
		universityIds?: string[];
		academicProgramIds?: string[];
	};

	const profile = await prisma.userProfile.upsert({
		where: { userId: session.user.id },
		update: {
			...(username !== undefined && { username }),
			...(universityIds !== undefined && { universityIds }),
			...(academicProgramIds !== undefined && { academicProgramIds }),
		},
		create: {
			userId: session.user.id,
			username: username ?? null,
			universityIds: universityIds ?? [],
			academicProgramIds: academicProgramIds ?? [],
			approvedSubjects: [],
			totalApprovedCredits: 0,
		},
	});

	return NextResponse.json({
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		username: profile.username,
		universityIds: profile.universityIds,
		academicProgramIds: profile.academicProgramIds,
		approvedSubjects: profile.approvedSubjects,
		totalApprovedCredits: profile.totalApprovedCredits,
	});
}
