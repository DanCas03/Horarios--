/**
 * Flags de funcionalidades de la app.
 *
 * REVIEWS_ENABLED: la sección de Reseñas está temporalmente bloqueada para
 * usuarios normales. Cambiar a `true` para reactivarla en toda la página
 * (navbar, landing, footer, menús flotantes y la ruta /reviews).
 * Los administradores conservan acceso aunque el flag esté apagado.
 */
export const REVIEWS_ENABLED = false;

export function canAccessReviews(role?: string | null): boolean {
	return REVIEWS_ENABLED || role === "admin";
}
