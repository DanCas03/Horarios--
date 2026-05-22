import { auth } from "@horaios/auth";
import { headers } from "next/headers";

/**
 * Obtiene la sesión del usuario actual desde las cookies de better-auth.
 * Retorna null si no hay sesión activa.
 */
export async function getSession() {
	return auth.api.getSession({ headers: await headers() });
}

/**
 * Lanza una respuesta 401 si no hay sesión.
 * Usar en rutas protegidas:
 *   const { session, errorResponse } = await requireSession();
 *   if (errorResponse) return errorResponse;
 */
export async function requireSession() {
	const session = await getSession();
	if (!session) {
		return {
			session: null,
			errorResponse: new Response(JSON.stringify({ error: "No autorizado" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			}),
		} as const;
	}
	return { session, errorResponse: null } as const;
}
