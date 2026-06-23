# Diseño: Homepage, retomar encuesta, cambio de carrera y marca (logo/favicon)

- **Fecha:** 2026-06-23
- **Autor:** Daniel (con Claude)
- **Estado:** Aprobado — listo para plan de implementación

## Restricción global del desarrollo

> **SIN TESTING.** Este desarrollo NO incluye pruebas automatizadas (unit, integración, e2e) ni TDD. El plan de implementación debe omitir cualquier fase de testing. La verificación será **manual** (correr la app y observar el comportamiento). Esta es una instrucción explícita del usuario para esta iteración.

## Objetivo

Mejorar la homepage y el flujo de encuesta de la plataforma "Guía Estudiantil" (apps/web, Next.js App Router) con cuatro capacidades nuevas y una identidad de marca propia:

1. Permitir **retomar la encuesta** para reseñar **otras** materias, recordando las ya reseñadas en sesiones previas.
2. Rediseñar la **homepage**: quitar las cartas UCAB/UNIMET y colocar un CTA contextual para (re)tomar la encuesta; enlazar las feature cards a sus secciones.
3. Permitir **cambiar de carrera desde la encuesta** (sin pasar por la configuración de usuario, hoy oculta).
4. Crear el **logo de la app y el favicon** (estilo académico moderno, colores de marca), usando las skills `/theme-factory`, `/brandkit` y `/algorithmic-art`.

## No-objetivos (fuera de alcance)

- Pruebas automatizadas de cualquier tipo (ver restricción global).
- Rediseño del flujo de autenticación o del panel admin.
- Borrado/migración de reseñas históricas.
- Reactivar/exponer la página de perfil (`/profile`) en la navegación.

## Contexto técnico (estado actual)

- **Colores de marca** (`apps/web/src/index.css`): `--color-primary #1f3653`, `--color-primary-light #325275`, `--color-primary-dark #122135`, `--color-accent #e59c24` (ámbar), `--color-surface #fafafa`. Tipografía Geist.
- **Modelo `Review`** (`packages/db/prisma/schema/domain.prisma`): tiene `subjectCode: String` y `userProfileId: String?`. Las reseñas se crean vía `POST /api/reviews` y se persisten en servidor.
- **`SurveyGuard`** NO bloquea a quien ya completó la encuesta; "retomar" es navegar de nuevo a `/encuesta`.
- **No existe** endpoint para listar las reseñas propias del usuario; por eso la encuesta hoy no sabe qué materias ya reseñó (el contador reinicia en 0 cada sesión).
- **`PUT /api/auth/me`** (`apps/web/src/app/api/auth/me/route.ts`) actualiza `universityIds`/`academicProgramIds` pero **no resetea** `approvedSubjects` al cambiar de carrera.
- **Favicon actual**: placeholder genérico (terminal `$_` morado) en `apps/web/public/favicon/` (`favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`) + `apps/web/src/app/favicon.ico`. El `metadata` del layout no referencia íconos.
- **Logo de la app**: ícono `GraduationCap` de lucide + texto "Guía Estudiantil" en `navbar.tsx` (y skeleton) y en el footer.

---

## Área 1 — Backend: endpoint "mis reseñas"

### Nuevo: `GET /api/reviews/mine`

Archivo nuevo: `apps/web/src/app/api/reviews/mine/route.ts`.

- Requiere sesión (`requireSession()`); 401 si no hay.
- Obtiene el `UserProfile` del usuario (`prisma.userProfile.findUnique({ where: { userId } })`). Si no existe, devolver lista vacía.
- Consulta `prisma.review.findMany({ where: { userProfileId: profile.id }, select: { subjectCode: true } })`.
- Devuelve los códigos distintos: `{ reviewedSubjectCodes: string[] }` (deduplicados).

### Cliente API

Archivo: `apps/web/src/api/client.ts` → agregar a `reviewsAPI`:

```ts
mine: () => api.get("/reviews/mine"),
```

---

## Área 2 — Encuesta: retomar con otras materias

Archivo: `apps/web/src/app/encuesta/page.tsx` (`EncuestaContent`).

- Al montar, llamar `reviewsAPI.mine()` y guardar `reviewedCodes: Set<string>` en estado.
- **Combobox de materias** (prop `subjectOptions` de `SingleReviewForm`): ofrecer solo las **aprobadas pendientes** = `approved.filter(s => !reviewedCodes.has(s.code))`. Mantener `allSubjects` completo (necesario para cargar secciones).
- **Progreso real**: el numerador pasa a ser `reviewedAntes + savedCount` (donde `reviewedAntes` = número de materias aprobadas que ya están en `reviewedCodes`); el denominador sigue siendo el total de materias aprobadas. Actualizar el texto ("Has reseñado N de M materias aprobadas") y la barra.
- Al guardar una reseña en la sesión (`handleSave` éxito): agregar `form.subject_code` a `reviewedCodes` para que la materia desaparezca del combobox de los formularios nuevos.
- **Caso "ya reseñó todo"**: si no quedan materias pendientes (`pending.length === 0` y hay aprobadas), mostrar un panel "¡Ya reseñaste todas tus materias aprobadas!" con el link existente a `/encuesta/onboarding?edit=true` ("Modificar materias cursadas") y el botón de finalizar. No renderizar formularios vacíos en este caso.
- Mantener el resto del flujo (finalizar, modal de cambios sin guardar, pantalla de agradecimiento) sin cambios funcionales.

---

## Área 3 — Homepage

Archivo: `apps/web/src/app/page.tsx`.

### 3.1 Reemplazar cartas UCAB/UNIMET por CTA contextual

Eliminar la sección "UNIVERSITIES (Asymmetric Z-Axis cards)" (las 2 cartas). En su lugar, un bloque CTA con comportamiento según estado:

- `user?.surveyCompleted === true` → botón **"Retomar encuesta"** → `/encuesta`. Copy: invita a reseñar otras materias que cursaste.
- `user && !user.surveyCompleted` → botón **"Continuar encuesta"** → `/encuesta`.
- `!user` (sin sesión) → tarjeta "Comparte tus reseñas" con CTA → `/register`.

Reutilizar el estilo visual existente (double-bezel, pill button con flecha, colores de marca) para mantener coherencia. Conservar el `-mt-12` para el solape con el hero si encaja visualmente.

### 3.2 Enlazar feature cards

La sección "FEATURES" mapea 4 cards. Envolver en `Link` (Next.js) las primeras tres:

- "Seguimiento de Pensum" → `/pensum`
- "Planificación de Horarios" → `/schedule`
- "Reseñas Anónimas" → `/reviews`
- "Análisis Inteligente" → **sin enlace**; en su lugar un **tooltip que sigue al cursor** mostrando **"Próximamente"** mientras el cursor está sobre la card.

Implementación del tooltip: estado local con la posición del cursor (`onMouseMove`/`onMouseEnter`/`onMouseLeave`) y un elemento flotante `fixed` posicionado en `(x, y)` con el texto "Próximamente". Solo aplica a la card "Análisis Inteligente". Las cards enlazadas conservan sus animaciones de hover actuales.

Para asociar destino/tooltip por card, extender el arreglo `features` con un campo `href?: Route` y un flag `comingSoon?: boolean` (o equivalente), y renderizar `Link` vs `div` según corresponda.

---

## Área 4 — Cambiar carrera desde la encuesta

### 4.1 Backend — reset al cambiar de carrera

Archivo: `apps/web/src/app/api/auth/me/route.ts` (`PUT`).

- Antes del `upsert`, leer el perfil existente.
- Calcular `programChanged` = `academicProgramIds` viene en el body **y** difiere del `academicProgramIds` actual del perfil.
- Si `programChanged`, en el `update` incluir además `approvedSubjects: []` y `totalApprovedCredits: 0`.
- Si la carrera no cambia, comportamiento idéntico al actual (no se tocan materias). Esto deja intacta a la página de perfil cuando no hay cambio de carrera.
- Las reseñas **no** se borran (atadas a `subjectCode`).

### 4.2 Frontend — componente reutilizable

Archivo nuevo: `apps/web/src/components/encuesta/change-career-modal.tsx` (o ubicación equivalente coherente con el repo).

- Modal con selects de Universidad y Programa Académico (patrón de `profile/page.tsx`: `universitiesAPI.list()` + `academicProgramsAPI.list(selectedUni)`), precargados con los valores actuales del usuario.
- Aviso visible: "Cambiar de carrera reiniciará tus materias cursadas (las volverás a seleccionar); tus reseñas se conservan."
- Al confirmar: `PUT /api/auth/me` con la nueva `{ universityIds, academicProgramIds }` → `refreshUser()` → `router.push("/encuesta/onboarding")` para reseleccionar materias del nuevo pensum.
- Estados de carga/error y cierre (cancelar) consistentes con los modales existentes (ej. el modal de "Finalizar sin guardar").

### 4.3 Puntos de entrada (sin pasar por /profile)

- **`encuesta/page.tsx`**: junto al nombre de la carrera mostrar un control "Carrera: *{academicProgramName}* · **Cambiar**" que abre el modal. (`academicProgramName` ya existe en estado.)
- **`encuesta/onboarding/page.tsx`**: añadir el mismo control (ahí se nota más un pensum equivocado).

Ambos consumen el mismo `<ChangeCareerModal/>`.

---

## Área 5 — Logo de la app y favicon

Estilo: **académico moderno** — marca geométrica y limpia (birrete/libro estilizado) en `primary-dark #122135` + `accent #e59c24`. Skills a invocar durante la implementación (instrucción explícita del usuario): `/theme-factory` (formalizar paleta/tema de marca), `/brandkit` (sistema de logo/identidad), `/algorithmic-art` (exploración generativa del símbolo si aporta).

### Entregables

- **SVG fuente** del logo (vectorial, colores de marca). Para el favicon del buscador, elegir **un solo** mecanismo de cableado para evitar `<link>` duplicados:
  - **Opción preferida:** colocar el SVG como `apps/web/src/app/icon.svg` (convención de Next.js App Router → inyecta el `<link rel="icon">` automáticamente) y reemplazar también `apps/web/public/favicon/favicon.svg` como copia de marca. En este caso, NO declarar `icon` en `metadata.icons` para el SVG (evita duplicado); `metadata` puede declarar solo `apple` y `manifest`.
  - El `apps/web/src/app/favicon.ico` existente seguirá sirviendo el `.ico` de respaldo (regenerarlo desde el nuevo logo si hay rasterizador).
- **Componente `<Logo/>`** (SVG inline, React) en `apps/web/src/components/` → reemplaza el `GraduationCap` en **navbar** (`navbar.tsx`, incluyendo `NavbarSkeleton`) y en el **footer**. Acepta `className`/tamaño para reutilizarse.
- **Set de PNG** (`favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`): regenerar desde el SVG **si hay un rasterizador disponible** en el entorno (p. ej. `sharp`/ImageMagick); si no lo hay, dejar documentado el comando para regenerarlos y conservar el SVG/ico como fuente.
- **`apps/web/src/app/layout.tsx`**: definir `metadata.icons` apuntando al set (icon, shortcut, apple) y, si aplica, `manifest`. Actualizar `title` si se decide un nombre de marca consistente ("Guía Estudiantil").
- Revisar `site.webmanifest` (hoy nombra "horaios" y referencia rutas en raíz `/web-app-manifest-*`) y dejarlo coherente con la ubicación real de los assets y el nombre de la app.

---

## Resumen de archivos afectados

**Nuevos**
- `apps/web/src/app/api/reviews/mine/route.ts`
- `apps/web/src/components/encuesta/change-career-modal.tsx`
- `apps/web/src/components/logo.tsx` (componente `<Logo/>`)
- `apps/web/src/app/icon.svg`

**Modificados**
- `apps/web/src/api/client.ts` (reviewsAPI.mine)
- `apps/web/src/app/encuesta/page.tsx` (retomar + entrada cambio de carrera)
- `apps/web/src/app/encuesta/onboarding/page.tsx` (entrada cambio de carrera)
- `apps/web/src/app/page.tsx` (CTA contextual + links feature cards + tooltip)
- `apps/web/src/app/api/auth/me/route.ts` (reset approvedSubjects al cambiar carrera)
- `apps/web/src/app/layout.tsx` (metadata.icons)
- `apps/web/src/components/layout/navbar.tsx` (logo)
- `apps/web/src/components/layout/footer.tsx` (logo)
- `apps/web/public/favicon/favicon.svg` (+ set PNG si hay rasterizador)
- `apps/web/public/favicon/site.webmanifest`

## Criterios de aceptación (verificación manual)

1. Un usuario que finalizó la encuesta entra desde la homepage con "Retomar encuesta", y el combobox NO ofrece materias ya reseñadas; el progreso muestra el total real (previas + nuevas).
2. La homepage no muestra las cartas UCAB/UNIMET; el CTA cambia según sesión/estado de encuesta.
3. Las feature cards de Pensum/Horarios/Reseñas navegan a sus páginas; "Análisis Inteligente" muestra el tooltip "Próximamente" siguiendo al cursor y no navega.
4. Desde la encuesta (y desde onboarding) se puede cambiar de carrera; al confirmar, las materias aprobadas se reinician, se va a onboarding a reseleccionar, y las reseñas previas se conservan.
5. El navegador muestra el nuevo logo como favicon; la navbar/footer muestran el nuevo logo de la app.
6. No se añadió ninguna prueba automatizada.
