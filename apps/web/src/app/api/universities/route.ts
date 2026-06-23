import prisma from "@horaios/db";
import { NextResponse } from "next/server";

/**
 * GET /api/universities
 * Lista todas las universidades disponibles.
 */
export async function GET() {
	const universities = await prisma.university.findMany({
		orderBy: { name: "asc" },
	});
	return NextResponse.json(universities);
}

/**
 * POST /api/universities
 * Crea una nueva universidad.
 */
export async function POST(request: Request) {
	const body = await request.json();
	const { name, shortName, logoUrl, website, location } = body as {
		name: string;
		shortName: string;
		logoUrl?: string;
		website?: string;
		location?: string;
	};

	if (!name || !shortName) {
		return NextResponse.json(
			{ error: "name y shortName son requeridos" },
			{ status: 400 },
		);
	}

	const university = await prisma.university.create({
		data: {
			name,
			shortName,
			logoUrl: logoUrl ?? "",
			website: website ?? "",
			location: location ?? "",
		},
	});

	return NextResponse.json(university, { status: 201 });
}
