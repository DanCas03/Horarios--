import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/subjects/[id]
 * Obtiene el detalle de una materia por su ID.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const subject = await prisma.subject.findUnique({ where: { id } });
	if (!subject) {
		return NextResponse.json(
			{ error: "Materia no encontrada" },
			{ status: 404 },
		);
	}

	return NextResponse.json(subject);
}

/**
 * PUT /api/subjects/[id]
 * Actualiza los datos de una materia.
 */
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const {
			name,
			code,
			credits,
			modality,
			subjectType,
			academicUnitId,
			description,
			isActive,
			usualAvailability,
		} = body as {
			name?: string;
			code?: string;
			credits?: number;
			modality?: string;
			subjectType?: string;
			academicUnitId?: string | null;
			description?: string | null;
			isActive?: boolean;
			usualAvailability?: string | null;
		};

		const existing = await prisma.subject.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Materia no encontrada" },
				{ status: 404 },
			);
		}

		const updated = await prisma.subject.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(code !== undefined && { code }),
				...(credits !== undefined && { credits }),
				...(modality !== undefined && { modality }),
				...(subjectType !== undefined && { subjectType }),
				...(academicUnitId !== undefined && {
					academicUnitId: academicUnitId || null,
				}),
				...(description !== undefined && { description: description || null }),
				...(isActive !== undefined && { isActive }),
				...(usualAvailability !== undefined && {
					usualAvailability: usualAvailability || null,
				}),
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
 * DELETE /api/subjects/[id]
 * Elimina una materia y sus asignaciones a planes de estudio.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// 1. Eliminar de las asignaciones de planes de estudio
		await prisma.studyPlanSubject.deleteMany({
			where: { subjectId: id },
		});

		// 2. Eliminar la materia
		await prisma.subject.delete({
			where: { id },
		});

		return NextResponse.json({ message: "Materia eliminada exitosamente" });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
