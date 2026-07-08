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
	} else {
		// Autocorrección de créditos aprobados
		const approvedList = (profile.approvedSubjects ?? []) as {
			subjectId?: string | null;
		}[];
		const subjectIds = approvedList
			.map((s) => s.subjectId)
			.filter((id): id is string => !!id);

		const subjects = await prisma.subject.findMany({
			where: { id: { in: subjectIds } },
			select: { credits: true },
		});
		const correctCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

		if (profile.totalApprovedCredits !== correctCredits) {
			profile = await prisma.userProfile.update({
				where: { userId: session.user.id },
				data: { totalApprovedCredits: correctCredits },
			});
		}
	}

	return NextResponse.json({
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image,
		role: session.user.role,
		universityIds: profile.universityIds,
		academicProgramIds: profile.academicProgramIds,
		activeMentionIds: profile.activeMentionIds,
		approvedSubjects: profile.approvedSubjects,
		totalApprovedCredits: profile.totalApprovedCredits,
		surveyCompleted: profile.surveyCompleted,
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
	const { universityIds, academicProgramIds, activeMentionIds } = body as {
		universityIds?: string[];
		academicProgramIds?: string[];
		activeMentionIds?: string[];
	};

	// Detectar cambio de carrera para invalidar las materias aprobadas del
	// pensum anterior (las reseñas se conservan, están atadas a subjectCode).
	const existing = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
		select: { academicProgramIds: true, activeMentionIds: true },
	});

	const programChanged =
		academicProgramIds !== undefined &&
		JSON.stringify([...academicProgramIds].sort()) !==
			JSON.stringify([...(existing?.academicProgramIds ?? [])].sort());

	// Validar que las menciones seleccionadas no superen el límite maxMentions y pertenezcan a los programas
	if (activeMentionIds !== undefined && !programChanged) {
		const targetPrograms =
			academicProgramIds ?? existing?.academicProgramIds ?? [];

		const programs = await prisma.academicProgram.findMany({
			where: { id: { in: targetPrograms } },
			select: { id: true, name: true, maxMentions: true },
		});

		const mentions = await prisma.mention.findMany({
			where: { id: { in: activeMentionIds } },
			select: { id: true, name: true, academicProgramId: true },
		});

		const programIdsSet = new Set(programs.map((p) => p.id));
		const invalidMention = mentions.find(
			(m) => m.academicProgramId && !programIdsSet.has(m.academicProgramId),
		);

		if (invalidMention) {
			return NextResponse.json(
				{
					error: `La mención "${invalidMention.name}" no pertenece a tus programas académicos activos.`,
				},
				{ status: 400 },
			);
		}

		for (const program of programs) {
			const count = mentions.filter(
				(m) => m.academicProgramId === program.id,
			).length;
			const max = program.maxMentions ?? 1;
			if (count > max) {
				return NextResponse.json(
					{
						error: `No puedes seleccionar más de ${max} mención(es) para el programa "${program.name}".`,
					},
					{ status: 400 },
				);
			}
		}
	}

	const profile = await prisma.userProfile.upsert({
		where: { userId: session.user.id },
		update: {
			...(universityIds !== undefined && { universityIds }),
			...(academicProgramIds !== undefined && { academicProgramIds }),
			...(activeMentionIds !== undefined &&
				!programChanged && { activeMentionIds }),
			...(programChanged && {
				approvedSubjects: [],
				totalApprovedCredits: 0,
				activeMentionIds: [],
			}),
		},
		create: {
			userId: session.user.id,
			universityIds: universityIds ?? [],
			academicProgramIds: academicProgramIds ?? [],
			activeMentionIds: activeMentionIds ?? [],
			approvedSubjects: [],
			totalApprovedCredits: 0,
		},
	});

	return NextResponse.json({
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		role: session.user.role,
		universityIds: profile.universityIds,
		academicProgramIds: profile.academicProgramIds,
		activeMentionIds: profile.activeMentionIds,
		approvedSubjects: profile.approvedSubjects,
		totalApprovedCredits: profile.totalApprovedCredits,
	});
}
