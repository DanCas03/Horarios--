import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";
import { hasProfanity } from "@/lib/profanity";

type RatingInput = {
	category: string;
	value: number;
};

type ApprovedSubjectItem = {
	subjectId?: string | null;
	grade?: number | null;
	period?: unknown | null;
};

/**
 * POST /api/reviews
 * Crea una reseña. Requiere autenticación.
 * `isVerified` se activa si el usuario tiene la materia marcada como aprobada.
 */
export async function POST(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const payload = body as {
		subjectCode: string;
		universityId?: string;
		teacherIds?: string[];
		periodId?: string;
		sectionId?: string;
		ratings: RatingInput[];
		overallRating?: number;
		wouldRecommend: boolean;
		comment: string;
		tips?: string;
		studyStrategy?: string;
		notFoundTeacherNames?: string;
	};

	const {
		subjectCode,
		universityId,
		teacherIds,
		periodId,
		sectionId,
		ratings,
		overallRating,
		wouldRecommend,
		comment,
		tips,
		studyStrategy,
		notFoundTeacherNames,
	} = payload;

	if (!subjectCode || !ratings || wouldRecommend === undefined) {
		return NextResponse.json(
			{ error: "Faltan campos requeridos" },
			{ status: 400 },
		);
	}

	// Escala 0.5–5 en pasos de media estrella
	const isValidRatingValue = (v: unknown): v is number =>
		typeof v === "number" &&
		Number.isFinite(v) &&
		v >= 0.5 &&
		v <= 5 &&
		Number.isInteger(v * 2);

	if (
		!Array.isArray(ratings) ||
		ratings.length === 0 ||
		ratings.some((r) => !r || !isValidRatingValue(r.value))
	) {
		return NextResponse.json(
			{
				error:
					"Cada clasificación debe estar entre 0.5 y 5 en pasos de media estrella",
			},
			{ status: 400 },
		);
	}

	if (
		hasProfanity(comment) ||
		(tips && hasProfanity(tips)) ||
		(studyStrategy && hasProfanity(studyStrategy)) ||
		(notFoundTeacherNames && hasProfanity(notFoundTeacherNames))
	) {
		return NextResponse.json(
			{ error: "El contenido contiene palabras inapropiadas o insultos." },
			{ status: 400 },
		);
	}

	// Verificar si el usuario tiene la materia aprobada (para isVerified)
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});
	if (!profile) {
		return NextResponse.json(
			{ error: "Perfil no encontrado" },
			{ status: 404 },
		);
	}

	const subject = await prisma.subject.findFirst({
		where: { code: subjectCode },
	});

	let isVerified = false;
	if (subject) {
		const approvedIds = new Set(
			(profile.approvedSubjects ?? [])
				.map((s) => (s as ApprovedSubjectItem).subjectId)
				.filter((id) => !!id),
		);
		isVerified = approvedIds.has(subject.id);
	}

	// Bloquear reviews de materias no aprobadas
	if (!isVerified) {
		return NextResponse.json(
			{ error: "Solo puedes hacer reseñas de materias que hayas aprobado" },
			{ status: 403 },
		);
	}

	const review = await prisma.review.create({
		data: {
			subjectCode,
			universityId,
			userProfileId: profile.id,
			teacherIds: teacherIds ?? [],
			periodId,
			sectionId,
			ratings,
			overallRating,
			wouldRecommend,
			comment,
			tips,
			studyStrategy,
			isVerified,
			notFoundTeacherNames,
		},
	});

	// Recalcular estadísticas de la materia si la reseña es verificada
	if (isVerified && subject) {
		await updateSubjectStats(subjectCode);
	}

	// Retornar sin userProfileId
	const { userProfileId: _upId, ...reviewPublic } = review;
	return NextResponse.json(reviewPublic, { status: 201 });
}

/**
 * Recalcula avgDifficulty, avgApprovalRate y reviewCount de una materia
 * basándose en todas las reseñas verificadas.
 */
async function updateSubjectStats(subjectCode: string) {
	const verifiedReviews = await prisma.review.findMany({
		where: { subjectCode, isVerified: true },
		select: { ratings: true, wouldRecommend: true },
	});

	if (verifiedReviews.length === 0) return;

	const count = verifiedReviews.length;
	let diffSum = 0;
	let diffCount = 0;

	for (const r of verifiedReviews) {
		const diffRating = r.ratings.find(
			(rt) => rt.category === "difficulty" || rt.category === "dificultad",
		);
		if (diffRating) {
			diffSum += diffRating.value;
			diffCount++;
		}
	}

	const avgDifficulty = diffCount > 0 ? diffSum / diffCount : 0;
	const recommendCount = verifiedReviews.filter((r) => r.wouldRecommend).length;
	const avgApprovalRate = (recommendCount / count) * 100;

	await prisma.subject.updateMany({
		where: { code: subjectCode },
		data: {
			avgDifficulty: Math.round(avgDifficulty * 100) / 100,
			avgApprovalRate: Math.round(avgApprovalRate * 100) / 100,
			reviewCount: count,
		},
	});
}
