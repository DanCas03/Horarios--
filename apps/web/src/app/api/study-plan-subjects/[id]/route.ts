import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * PUT /api/study-plan-subjects/[id]
 * Modifica la asignación de una materia (término/semestre sugerido o prerrequisitos).
 */
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const {
			suggestedTerm,
			prerequisiteIds,
			corequisiteIds,
			prerequisiteCredits,
			subjectRole,
			mentionIds,
		} = body as {
			suggestedTerm?: number;
			prerequisiteIds?: string[];
			corequisiteIds?: string[];
			prerequisiteCredits?: number;
			subjectRole?: string | null;
			mentionIds?: string[];
		};

		if (
			prerequisiteCredits !== undefined &&
			(!Number.isFinite(prerequisiteCredits) ||
				!Number.isInteger(prerequisiteCredits) ||
				prerequisiteCredits < 0)
		) {
			return NextResponse.json(
				{ error: "prerequisiteCredits debe ser un entero ≥ 0" },
				{ status: 400 },
			);
		}

		const updated = await prisma.studyPlanSubject.update({
			where: { id },
			data: {
				...(suggestedTerm !== undefined && { suggestedTerm }),
				...(prerequisiteIds !== undefined && { prerequisiteIds }),
				...(corequisiteIds !== undefined && { corequisiteIds }),
				...(prerequisiteCredits !== undefined && { prerequisiteCredits }),
				...(subjectRole !== undefined && { subjectRole }),
				...(mentionIds !== undefined && { mentionIds }),
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

/**
 * DELETE /api/study-plan-subjects/[id]
 * Remueve la materia de un plan de estudio.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		await prisma.studyPlanSubject.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Materia desasignada del plan exitosamente",
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
