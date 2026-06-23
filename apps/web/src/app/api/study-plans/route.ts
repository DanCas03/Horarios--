import prisma from "@horaios/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/study-plans?academic_program_id=...
 * Lista los planes de estudio.
 */
export async function GET(request: NextRequest) {
	const programId = request.nextUrl.searchParams.get("academic_program_id");

	const plans = await prisma.studyPlan.findMany({
		where: programId ? { academicProgramId: programId } : undefined,
		orderBy: { name: "asc" },
	});

	return NextResponse.json(plans);
}

/**
 * POST /api/study-plans
 * Crea un nuevo plan de estudio.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, academicProgramId, isActive } = body as {
			name: string;
			academicProgramId: string;
			isActive?: boolean;
		};

		if (!name || !academicProgramId) {
			return NextResponse.json(
				{ error: "name y academicProgramId son requeridos" },
				{ status: 400 },
			);
		}

		// Si se marca como activo, desactivar los demás del mismo programa
		if (isActive) {
			await prisma.studyPlan.updateMany({
				where: { academicProgramId },
				data: { isActive: false },
			});
		}

		const plan = await prisma.studyPlan.create({
			data: {
				name,
				academicProgramId,
				isActive: isActive ?? false,
			},
		});

		return NextResponse.json(plan, { status: 201 });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
