import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectEntry = {
	subjectCode: string;
	grade?: number;
	period?: string;
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
		subjectCode?: string;
		subject_code?: string;
		universityId?: string;
		university_id?: string;
		professorName?: string;
		professor_name?: string;
		period?: string;
		section?: string;
		difficultyRating?: number;
		difficulty_rating?: number;
		professorRating?: number;
		professor_rating?: number;
		workloadRating?: number;
		workload_rating?: number;
		wouldRecommend?: boolean;
		would_recommend?: boolean;
		comment?: string;
		tips?: string;
		studyStrategy?: string;
		study_strategy?: string;
	};

	const subjectCode = payload.subjectCode ?? payload.subject_code;
	const universityId = payload.universityId ?? payload.university_id;
	const professorName = payload.professorName ?? payload.professor_name;
	const period = payload.period;
	const section = payload.section;
	const difficultyRating =
		payload.difficultyRating ?? payload.difficulty_rating;
	const professorRating = payload.professorRating ?? payload.professor_rating;
	const workloadRating = payload.workloadRating ?? payload.workload_rating;
	const wouldRecommend = payload.wouldRecommend ?? payload.would_recommend;
	const comment = payload.comment;
	const tips = payload.tips;
	const studyStrategy = payload.studyStrategy ?? payload.study_strategy;

	if (
		!subjectCode ||
		!universityId ||
		!period ||
		!difficultyRating ||
		!workloadRating ||
		wouldRecommend === undefined
	) {
		return NextResponse.json(
			{ error: "Faltan campos requeridos" },
			{ status: 400 },
		);
	}

	// Verificar si el usuario tiene la materia aprobada (para isVerified)
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	const approvedCodes = new Set(
		(profile?.approvedSubjects ?? []).map(
			(s) => (s as ApprovedSubjectEntry).subjectCode,
		),
	);
	const isVerified = approvedCodes.has(subjectCode);

	const review = await prisma.review.create({
		data: {
			subjectCode,
			universityId,
			userId: session.user.id,
			professorName,
			period,
			section,
			difficultyRating,
			professorRating,
			workloadRating,
			wouldRecommend,
			comment,
			tips,
			studyStrategy,
			isVerified,
		},
	});

	// Recalcular estadísticas de la materia si la reseña es verificada
	if (isVerified) {
		await updateSubjectStats(subjectCode);
	}

	// Retornar sin userId
	const { userId: _userId, ...reviewPublic } = review;
	return NextResponse.json(reviewPublic, { status: 201 });
}

/**
 * Recalcula avgDifficulty, avgApprovalRate y reviewCount de una materia
 * basándose en todas las reseñas verificadas.
 */
async function updateSubjectStats(subjectCode: string) {
	const verifiedReviews = await prisma.review.findMany({
		where: { subjectCode, isVerified: true },
		select: { difficultyRating: true, wouldRecommend: true },
	});

	if (verifiedReviews.length === 0) return;

	const count = verifiedReviews.length;
	const avgDifficulty =
		verifiedReviews.reduce((sum, r) => sum + r.difficultyRating, 0) / count;
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
