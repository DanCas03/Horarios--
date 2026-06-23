import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * PUT /api/academic-units/[id]
 * Actualiza una unidad académica.
 */
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { name, code, isExtracurricular, parentId } = body as {
			name?: string;
			code?: string;
			isExtracurricular?: boolean;
			parentId?: string | null;
		};

		const existing = await prisma.academicUnit.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Unidad académica no encontrada" },
				{ status: 404 },
			);
		}

		const updated = await prisma.academicUnit.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(code !== undefined && { code }),
				...(isExtracurricular !== undefined && { isExtracurricular }),
				...(parentId !== undefined && { parentId: parentId || null }),
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
 * DELETE /api/academic-units/[id]
 * Elimina una unidad académica. Desasocia materias, programas y subunidades.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// 1. Desasociar materias que pertenecen a esta unidad
		await prisma.subject.updateMany({
			where: { academicUnitId: id },
			data: { academicUnitId: null },
		});

		// 2. Desasociar programas que pertenecen a esta unidad
		await prisma.academicProgram.updateMany({
			where: { academicUnitId: id },
			data: { academicUnitId: null },
		});

		// 3. Actualizar subunidades (unidades hijas) para remover su parentId
		await prisma.academicUnit.updateMany({
			where: { parentId: id },
			data: { parentId: null },
		});

		// 4. Eliminar la unidad académica
		await prisma.academicUnit.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Unidad académica eliminada exitosamente",
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
