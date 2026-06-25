import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

type ApprovedSubjectPeriod = {
	code?: string;
	start?: Date;
	end?: Date;
	termType?: string;
};

type ApprovedSubjectItem = {
	subjectId?: string | null;
	grade?: number | null;
	period?: ApprovedSubjectPeriod | null;
};

/**
 * POST /api/subjects/approve
 * Marca una materia como aprobada para el usuario autenticado.
 * Body: { subjectId: string, grade?: number, period?: ApprovedSubjectPeriod }
 */
export async function POST(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const payload = body as {
		subjectId?: string;
		grade?: number;
		period?: ApprovedSubjectPeriod;
		subjectIds?: string[];
	};

	// 1. Caso de sincronización en lote (bulk sync)
	if (payload.subjectIds && Array.isArray(payload.subjectIds)) {
		const targetIds = payload.subjectIds;

		// Obtener o crear perfil
		const profile = await prisma.userProfile.findUnique({
			where: { userId: session.user.id },
		});

		const currentApproved = (profile?.approvedSubjects ??
			[]) as ApprovedSubjectItem[];

		// Mantener información preexistente (nota/periodo) de materias que siguen estando aprobadas
		const currentApprovedMap = new Map<string, ApprovedSubjectItem>();
		for (const item of currentApproved) {
			if (item.subjectId) {
				currentApprovedMap.set(item.subjectId, item);
			}
		}

		const newApprovedSubjects: ApprovedSubjectItem[] = [];
		for (const id of targetIds) {
			if (currentApprovedMap.has(id)) {
				newApprovedSubjects.push(currentApprovedMap.get(id)!);
			} else {
				newApprovedSubjects.push({
					subjectId: id,
					grade: null,
					period: null,
				});
			}
		}

		// Buscar todas las materias para sumar los créditos correctos
		const subjects = await prisma.subject.findMany({
			where: { id: { in: targetIds } },
			select: { credits: true },
		});

		const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

		const updatedProfile = await prisma.userProfile.upsert({
			where: { userId: session.user.id },
			update: {
				approvedSubjects: newApprovedSubjects,
				totalApprovedCredits: totalCredits,
			},
			create: {
				userId: session.user.id,
				approvedSubjects: newApprovedSubjects,
				totalApprovedCredits: totalCredits,
				universityIds: [],
				academicProgramIds: [],
			},
		});

		return NextResponse.json({
			message: "Materias aprobadas sincronizadas",
			totalApprovedCredits: updatedProfile.totalApprovedCredits,
		});
	}

	// 2. Caso individual
	const subjectId = payload.subjectId;
	const grade = payload.grade;
	const period = payload.period;

	if (!subjectId) {
		return NextResponse.json(
			{ error: "subjectId o subjectIds es requerido" },
			{ status: 400 },
		);
	}

	// Verificar que la materia existe
	const subject = await prisma.subject.findUnique({
		where: { id: subjectId },
	});
	if (!subject) {
		return NextResponse.json(
			{ error: "Materia no encontrada" },
			{ status: 404 },
		);
	}

	// Obtener o crear perfil
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
	});

	const approvedSubjects = (profile?.approvedSubjects ??
		[]) as ApprovedSubjectItem[];

	// Verificar que no esté ya aprobada
	if (approvedSubjects.some((s) => s.subjectId === subjectId)) {
		return NextResponse.json(
			{ error: "Esta materia ya está marcada como aprobada" },
			{ status: 400 },
		);
	}

	const newEntry: ApprovedSubjectItem = { subjectId, grade, period };
	const newApprovedSubjects = [...approvedSubjects, newEntry];

	// Calcular total de créditos de manera robusta
	const allApprovedIds = newApprovedSubjects
		.map((s) => s.subjectId)
		.filter((id): id is string => !!id);

	const subjects = await prisma.subject.findMany({
		where: { id: { in: allApprovedIds } },
		select: { credits: true },
	});
	const newTotal = subjects.reduce((sum, s) => sum + s.credits, 0);

	const updatedProfile = await prisma.userProfile.upsert({
		where: { userId: session.user.id },
		update: {
			approvedSubjects: { push: newEntry },
			totalApprovedCredits: newTotal,
		},
		create: {
			userId: session.user.id,
			approvedSubjects: [newEntry],
			totalApprovedCredits: subject.credits,
			universityIds: [],
			academicProgramIds: [],
		},
	});

	return NextResponse.json({
		message: "Materia marcada como aprobada",
		totalApprovedCredits: updatedProfile.totalApprovedCredits,
	});
}
