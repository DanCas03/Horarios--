import prisma from "@horaios/db";
import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

// Función cacheada por Next.js para popular las secciones y armar los bloques.
// Almacenará en caché el resultado para no recargar la BD con datos estáticos de secciones.
const getPopulatedSections = unstable_cache(
	async (sectionIds: string[]) => {
		if (!sectionIds || sectionIds.length === 0) return [];

		const sections = await prisma.section.findMany({
			where: { id: { in: sectionIds } },
		});

		// Obtenemos los subjects y teachers referenciados
		const subjectIds = sections
			.map((s) => s.subjectId)
			.filter((id): id is string => !!id);
		const allTeacherIds = Array.from(
			new Set(sections.flatMap((s) => s.teacherIds)),
		);

		const subjects = await prisma.subject.findMany({
			where: { id: { in: subjectIds } },
		});

		const teachers = await prisma.teacher.findMany({
			where: { id: { in: allTeacherIds } },
		});

		return sections.map((section) => {
			const subject = subjects.find((s) => s.id === section.subjectId);
			const sectionTeachers = teachers.filter((t) =>
				section.teacherIds.includes(t.id),
			);
			const professorNames = sectionTeachers
				.map((t) => `${t.name1} ${t.surname1}`)
				.join(", ");

			return {
				sectionId: section.id,
				code: section.code,
				subjectCode: subject?.code ?? "",
				subjectName: subject?.name ?? "",
				professor: professorNames,
				modality: subject?.modality ?? "presencial",
				capacity: section.capacity,
				campus: section.campus,
				learningType: section.learningType,
				scheduleBlocks: section.scheduleBlocks, // { startTime, endTime, dayOfWeek, classroom }
			};
		});
	},
	["populated-sections"], // Etiqueta de caché
	{ revalidate: 3600 }, // Revalidar cada hora si cambian los datos base
);

/**
 * GET /api/schedules/my?periodId=&schedule_type=
 * Retorna los horarios del usuario autenticado, populando las secciones cacheadas.
 */
export async function GET(request: NextRequest) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const sp = request.nextUrl.searchParams;
	const periodId = sp.get("periodId");
	const scheduleType = sp.get("schedule_type");

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	let resolvedPeriodId = periodId;
	if (periodId && !/^[0-9a-fA-F]{24}$/.test(periodId)) {
		const period = await prisma.period.findFirst({
			where: {
				code: periodId,
			},
		});
		if (period) {
			resolvedPeriodId = period.id;
		}
		// Si no se encuentra, dejamos resolvedPeriodId como null/undefined o mantenemos el valor
		// original. Mantenemos el original para que falle la consulta si es un código inválido.
	}

	const schedules = await prisma.schedule.findMany({
		where: {
			userProfileId: profile.id,
			...(resolvedPeriodId && { periodId: resolvedPeriodId }),
			...(scheduleType && { scheduleType }),
		},
		orderBy: { createdAt: "desc" },
	});

	// Map periodId -> code so the client can display a human-readable period.
	const periodIds = Array.from(
		new Set(
			schedules.map((s) => s.periodId).filter((id): id is string => !!id),
		),
	);
	const periods = periodIds.length
		? await prisma.period.findMany({
				where: { id: { in: periodIds } },
				select: { id: true, code: true },
			})
		: [];
	const periodCodeById = new Map(periods.map((p) => [p.id, p.code]));

	// Popular los sectionIds con la función cacheada
	const populatedSchedules = await Promise.all(
		schedules.map(async (schedule) => {
			const blocks = await getPopulatedSections(schedule.sectionIds);
			return {
				...schedule,
				period: schedule.periodId
					? (periodCodeById.get(schedule.periodId) ?? schedule.periodId)
					: "",
				populatedBlocks: blocks,
			};
		}),
	);

	return NextResponse.json(populatedSchedules);
}
