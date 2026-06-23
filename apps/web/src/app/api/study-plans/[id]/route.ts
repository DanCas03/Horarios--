import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * PUT /api/study-plans/[id]
 * Actualiza un plan de estudio (su nombre o estado activo).
 */
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { name, isActive } = body as {
			name?: string;
			isActive?: boolean;
		};

		const existingPlan = await prisma.studyPlan.findUnique({
			where: { id },
		});

		if (!existingPlan) {
			return NextResponse.json(
				{ error: "Plan de estudio no encontrado" },
				{ status: 404 },
			);
		}

		// Si se marca como activo, desactivar todos los otros planes del mismo programa
		if (isActive === true && existingPlan.academicProgramId) {
			await prisma.studyPlan.updateMany({
				where: { academicProgramId: existingPlan.academicProgramId },
				data: { isActive: false },
			});
		}

		const updatedPlan = await prisma.studyPlan.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(isActive !== undefined && { isActive }),
			},
		});

		return NextResponse.json(updatedPlan);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

/**
 * DELETE /api/study-plans/[id]
 * Elimina un plan de estudio y sus asociaciones.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// Eliminar primero las materias del plan de estudios asociadas
		await prisma.studyPlanSubject.deleteMany({
			where: { studyPlanId: id },
		});

		// Eliminar el plan de estudio
		await prisma.studyPlan.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Plan de estudio eliminado exitosamente",
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
