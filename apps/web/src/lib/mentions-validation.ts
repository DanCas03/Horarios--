import prisma from "@horaios/db";

interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Valida si las secciones que se intentan agregar a un horario respetan las menciones del usuario.
 * Si alguna sección pertenece a una materia asociada a una mención en el plan de estudios activo,
 * el usuario debe tener dicha mención seleccionada en su perfil.
 */
export async function validateSectionsMentions(
	userProfileId: string,
	sectionIds: string[],
): Promise<ValidationResult> {
	if (!sectionIds || sectionIds.length === 0) {
		return { valid: true };
	}

	const profile = await prisma.userProfile.findUnique({
		where: { id: userProfileId },
		select: { activeMentionIds: true, academicProgramIds: true },
	});

	if (!profile) {
		return { valid: false, error: "Perfil no encontrado" };
	}

	const activeMentionIds = profile.activeMentionIds || [];

	// Obtener los detalles de las secciones y sus materias
	const sections = await prisma.section.findMany({
		where: { id: { in: sectionIds } },
		select: { subjectId: true },
	});

	const subjectIds = sections
		.map((s) => s.subjectId)
		.filter((id): id is string => !!id);

	if (subjectIds.length === 0) {
		return { valid: true };
	}

	// Obtener los planes de estudio activos para las carreras del usuario
	const activePlans = await prisma.studyPlan.findMany({
		where: {
			academicProgramId: { in: profile.academicProgramIds },
			isActive: true,
		},
		select: { id: true },
	});

	const planIds = activePlans.map((p) => p.id);
	if (planIds.length === 0) {
		return { valid: true };
	}

	// Buscar la configuración de estas materias en los planes de estudio activos
	const planSubjects = await prisma.studyPlanSubject.findMany({
		where: {
			studyPlanId: { in: planIds },
			subjectId: { in: subjectIds },
		},
		select: {
			subjectId: true,
			mentionIds: true,
		},
	});

	for (const ps of planSubjects) {
		if (ps.mentionIds && ps.mentionIds.length > 0) {
			const hasActiveMention = ps.mentionIds.some((mId) =>
				activeMentionIds.includes(mId),
			);

			if (!hasActiveMention) {
				const subject = await prisma.subject.findUnique({
					where: { id: ps.subjectId ?? "" },
					select: { name: true },
				});

				const mentions = await prisma.mention.findMany({
					where: { id: { in: ps.mentionIds } },
					select: { name: true },
				});

				const mentionNames = mentions.map((m) => m.name).join(" o ");

				return {
					valid: false,
					error: `La materia "${
						subject?.name ?? "Materia de mención"
					}" requiere que selecciones la mención: ${
						mentionNames || "Mención no especificada"
					} en tu perfil.`,
				};
			}
		}
	}

	return { valid: true };
}
