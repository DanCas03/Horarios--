# Feature flags

## Reseñas bloqueadas (`REVIEWS_ENABLED`)

La sección de **Reseñas** está temporalmente bloqueada para usuarios normales.
El bloqueo se controla con un único flag:

```ts
// apps/web/src/lib/feature-flags.ts
export const REVIEWS_ENABLED = false;
```

**Para reactivar Reseñas en toda la página, cambiar `REVIEWS_ENABLED` a `true`.**
No hace falta tocar ningún otro archivo.

Los **administradores** (`user.role === "admin"`) conservan acceso a Reseñas
aunque el flag esté apagado, vía el helper `canAccessReviews(role)`.

### Qué controla el flag hoy

| Punto de la app | Archivo | Comportamiento con el flag apagado |
| --- | --- | --- |
| Link "Reseñas" del navbar (desktop y móvil) | `apps/web/src/components/layout/navbar.tsx` | Oculto para usuarios normales, visible para admins |
| Ruta `/reviews` | `apps/web/src/components/auth/protected-route.tsx` | Usuarios normales son redirigidos a `/dashboard`; admins entran normal |
| Tarjeta "Reseñas Anónimas" de la landing | `apps/web/src/app/page.tsx` | Se muestra como "Próximamente" (sin link) |
| Slide de reseñas del carrusel del hero | `apps/web/src/components/landing/preview-carousel.tsx` | Se quita del carrusel |
| Link "Reseñas" del footer | `apps/web/src/components/layout/footer.tsx` | Oculto |
| Acción "Ver reseñas" del menú flotante | `apps/web/src/app/pensum/page.tsx`, `apps/web/src/app/schedule/page.tsx` | Oculta para usuarios normales, visible para admins |

> Nota: las APIs `/api/reviews/*` **no** están bloqueadas por este flag
> (decisión explícita al implementarlo). Si en el futuro se quiere un bloqueo
> duro, agregar la verificación `canAccessReviews` en esas rutas.

### Visibilidad del menú por rol (relacionado)

El menú principal del navbar se muestra cuando:

- el usuario es **admin** (siempre, sin importar la encuesta de onboarding), o
- el usuario normal **completó la encuesta** (`surveyCompleted`).

Los usuarios normales ven un menú limitado (Pensum y Horarios); los admins ven
el menú completo (incluyendo Reseñas y Admin).

## Plan a futuro

Hoy, apagar un módulo requiere que cada punto de la UI consulte el flag por su
cuenta (7 archivos para Reseñas). El plan es refactorizar hacia un registro
central de módulos, de forma que desactivar uno no requiera modificaciones
dispersas. Ideas concretas:

- Un registro único de navegación (links del navbar, footer, menús flotantes y
  tarjetas de la landing derivados de la misma lista de módulos con su flag y
  roles permitidos).
- Un guard de rutas declarativo (mapa `ruta → { flag, rolesPermitidos }`) en
  `ProtectedRoute` o en middleware, en lugar de condicionales por ruta.
- Opcionalmente, mover los flags a variables de entorno o base de datos para
  poder apagar módulos sin redeploy.
