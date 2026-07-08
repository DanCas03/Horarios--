import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/academic-programs/[id]/mentions
 * Obtiene las menciones de un programa académico.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const mentions = await prisma.mention.findMany({
		where: { academicProgramId: id, isActive: true },
		orderBy: { name: "asc" },
	});

	return NextResponse.json(mentions);
}

/**
 * POST /api/academic-programs/[id]/mentions
 * Crea una mención para un programa académico.
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json();
	const { name, code, description } = body as {
		name: string;
		code?: string;
		description?: string;
	};

	if (!name) {
		return NextResponse.json({ error: "name es requerido" }, { status: 400 });
	}

	const mention = await prisma.mention.create({
		data: {
			name,
			code,
			description,
			academicProgramId: id,
			isActive: true,
		},
	});

	return NextResponse.json(mention, { status: 201 });
}
