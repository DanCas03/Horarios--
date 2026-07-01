# Diseño: Selector de profesor "abierto" en reseñas y encuesta

- **Fecha:** 2026-07-01
- **Autor:** Daniel (con Claude)
- **Estado:** Aprobado — listo para plan de implementación

## Objetivo

Hoy, cuando una materia ya tiene secciones registradas para un periodo, el usuario solo puede elegir entre los profesores que ya están asociados a esa materia en la base de datos (vía un `<select>` de "Sección"). Si su profesor no aparece ahí, no tiene forma de indicarlo — a diferencia de las materias sin secciones registradas, donde sí existe un buscador completo de profesores + opción de escribir el nombre a mano.

Se quiere unificar y "abrir" el flujo: primero mostrar los profesores ya asociados a la materia+periodo, con una opción **"No encuentro mi profesor"** que despliega el buscador completo de todos los profesores de la base de datos, y si tampoco aparece ahí, permitir escribir el nombre libremente. Este comportamiento debe aplicar tanto en `/encuesta` como en `/reviews` (ambas duplican hoy una versión parcial de esta lógica).

## No-objetivos (fuera de alcance)

- Cambios a `SubjectCombobox`, carga de materias/periodos, o cualquier otro campo del formulario de reseña.
- Pruebas automatizadas (no existe suite de tests en `apps/web` hoy; no se agrega infraestructura nueva).
- Cambiar el alcance de "profesores asociados a la materia" — se mantiene acotado al periodo seleccionado, igual que hoy.
- Filtrar el buscador completo de profesores por universidad (hoy `GET /api/teachers` devuelve todos, sin cambios).

## Contexto técnico (estado actual)

- **`encuesta/page.tsx`**: tiene `TeacherCombobox` (buscador completo de profesores + opción fija "No encuentro mi profe" + input de texto libre) pero **solo se muestra cuando `sections.length === 0`** (`isFallback`). Cuando sí hay secciones, se usa un `<select>` con opciones `"Sección X (Profesor1, Profesor2)"` — cerrado a lo que ya existe.
- **`reviews/page.tsx`**: tiene el mismo `<select>` de secciones, pero **no tiene ningún fallback** — ni buscador completo ni texto libre. Tampoco envía `notFoundTeacherNames` al backend aunque el modelo y el cliente API ya lo soportan.
- **`GET /api/sections?subjectId&periodId`** (`apps/web/src/app/api/sections/route.ts`): devuelve `sections: { id, code, teacherIds: string[], teachers: string[] }[]`. El array `teachers` son solo nombres (ya deduplicados/filtrados de nulos), lo que puede desalinear posicionalmente con `teacherIds` si algún profesor no se resuelve en la consulta.
- **`GET /api/teachers`**: devuelve todos los profesores de la BD (`{ id, name }[]`), sin filtro de universidad.
- **Modelo `Review`** (`packages/db/prisma/schema/domain.prisma`): `teacherIds: String[]` y `sectionId: String?` son independientes y ambos opcionales — ya soporta guardar una reseña con profesor(es) sin sección asociada. `notFoundTeacherNames: String?` ya existe.
- **`POST /api/reviews`**: ya acepta `teacherIds`, `sectionId` y `notFoundTeacherNames` de forma independiente; no requiere cambios.
- **`reviewsAPI.create`** (`apps/web/src/api/client.ts`): ya tiene `notFoundTeacherNames?: string` en su firma — solo `reviews/page.tsx` no lo está usando.

---

## Área 1 — Backend: `GET /api/sections`

Agregar un nuevo campo `teacherOptions: { id: string; name: string }[]` a cada sección devuelta, con el mismo contenido que hoy se computa para `teachers` pero preservando el par `(id, name)` de forma confiable (sin depender de alineación posicional). El campo `teachers: string[]` existente **no se modifica** — se sigue usando para el label "Sección A (Juan Pérez)" en el select opcional de sección.

```ts
const populatedSections = sections.map((s) => ({
  id: s.id,
  code: s.code,
  teacherIds: s.teacherIds,
  teachers: s.teacherIds.map((id) => teacherNameById.get(id)).filter(Boolean),
  teacherOptions: s.teacherIds
    .filter((id) => teacherNameById.has(id))
    .map((id) => ({ id, name: teacherNameById.get(id)! })),
}));
```

---

## Área 2 — Componente compartido `TeacherPicker`

Nuevo archivo: `apps/web/src/components/reviews/teacher-picker.tsx`.

Reemplaza, en ambas páginas, el bloque que hoy hace fetch de secciones + renderiza el `<select>` de "Sección/Profesor" (y, en `encuesta`, también el bloque `isFallback` con `TeacherCombobox`). El `TeacherCombobox` actual (buscador completo + opción fija + texto libre) se mueve a este mismo archivo tal cual, sin cambios de comportamiento, para que ambas páginas lo compartan.

### Props

```ts
interface TeacherPickerValue {
  sectionId: string;
  teacherIds: string[];
  fallbackTeacherId: string; // '' | id de profesor | 'no-encuentro-profe'
  notFoundTeacherNames: string;
}

function TeacherPicker({
  subjectId,      // id de la materia seleccionada (o undefined)
  periodId,       // periodo seleccionado
  allTeachers,    // { id, name }[] — lista completa de la BD (ya cargada por la página padre)
  value,          // TeacherPickerValue actual
  onChange,       // (updates: Partial<TeacherPickerValue>) => void
}: TeacherPickerProps)
```

El componente hace su propio fetch de `subjectsAPI.sections(subjectId, periodId)` internamente (igual que hoy lo hacen las páginas), y expone únicamente el valor final vía `onChange`. Las páginas padre siguen siendo dueñas del estado (`sectionId`, `teacherIds`, `fallbackTeacherId`, `notFoundTeacherNames`) dentro de su propio form state, igual que `encuesta/page.tsx` ya hace hoy.

### Estado interno: `mode: "subject-teachers" | "full-search"`

- **Sin secciones** para la materia+periodo (`sections.length === 0` tras cargar): `mode` fuerza `"full-search"` automáticamente. Se muestra el aviso ⚠️ "No se encontraron secciones para esta materia en este período" (idéntico al texto actual) y el `TeacherCombobox` completo — sin cambios de comportamiento respecto a hoy.
- **Con secciones**: `mode` arranca en `"subject-teachers"`.
  - Se deriva `subjectTeachers: {id, name}[]` deduplicando por `id` sobre `sections.flatMap(s => s.teacherOptions)`.
  - Se renderiza un combobox (mismo patrón visual que `TeacherCombobox`: input con búsqueda + dropdown) con `subjectTeachers` como opciones, más la opción fija al tope **"No encuentro mi profesor"**.
  - **Seleccionar un profesor de la lista:**
    - Buscar en `sections` (ya cargadas) cuáles tienen ese `teacherId` en `teacherIds`.
    - Si hay **1 sola sección** → `onChange({ sectionId: section.id, teacherIds: section.teacherIds, fallbackTeacherId: "", notFoundTeacherNames: "" })`. No se muestra nada más.
    - Si hay **2+ secciones** → `onChange({ sectionId: "", teacherIds: [teacherId], fallbackTeacherId: "", notFoundTeacherNames: "" })` inmediatamente (ya queda válido para guardar), y además se muestra un `<select>` compacto y **opcional** "¿En qué sección? (opcional)" limitado a esas secciones del profesor. Si el usuario elige una, se actualiza a `onChange({ sectionId: section.id, teacherIds: section.teacherIds })`.
  - **Seleccionar "No encuentro mi profesor"** → `mode = "full-search"`, limpiando `sectionId`/`teacherIds` previos. Se muestra el `TeacherCombobox` completo (todos los profesores de la BD), con su propia opción fija "No encuentro mi profe" + input de texto libre, igual que el fallback actual. Se agrega un enlace "← Volver a profesores de la materia" que regresa a `mode = "subject-teachers"` (limpiando `fallbackTeacherId`/`notFoundTeacherNames`), por si fue un clic accidental.

### Validación (expuesta a las páginas padre)

Un profesor queda "identificado" (formulario puede guardar) cuando se cumple una de:
- `teacherIds.length > 0` (profesor elegido de la lista de materia o de la búsqueda completa), o
- `fallbackTeacherId === "no-encuentro-profe"` y `notFoundTeacherNames.trim() !== ""`.

Ya **no** se exige tener `sectionId` para poder guardar — es siempre un dato opcional/informativo.

---

## Área 3 — Cambios en `encuesta/page.tsx`

- Eliminar de `SingleReviewForm` el `useState<SectionOption[]>`, el `useEffect` que llama a `subjectsAPI.sections`, y el bloque JSX `isFallback ? (...) : (...)` completo.
- Reemplazar por `<TeacherPicker subjectId={...} periodId={form.period} allTeachers={allTeachers} value={{ sectionId: form.sectionId, teacherIds: form.teacherIds, fallbackTeacherId: form.fallbackTeacherId ?? "", notFoundTeacherNames: form.notFoundTeacherNames ?? "" }} onChange={(u) => onUpdate(form.id, u)} />`.
- `TeacherCombobox` local a este archivo se elimina (queda solo en `teacher-picker.tsx`).
- La lógica de `handleSave` que arma `teacherIds`/`notFoundTeacherNames` para el payload de `reviewsAPI.create` se simplifica: ya no depende de `isFallback` calculado a mano, sino directamente de `form.teacherIds` / `form.notFoundTeacherNames` (que `TeacherPicker` ya deja consistentes vía `onChange`).
- El botón "Guardar reseña" cambia su condición de `disabled` para usar la validación de Área 2 en vez de `(!isFallback && !form.sectionId) || (...)`.

## Área 4 — Cambios en `reviews/page.tsx`

- Agregar `fallbackTeacherId: ""` y `notFoundTeacherNames: ""` al form state.
- Eliminar el `useState<sections>`, el `useEffect` de carga de secciones, y el `<select>` de "Sección / Profesor".
- Cargar `allTeachers` (hoy esta página no lo hace) con `teachersAPI.list()`, igual que `encuesta/page.tsx`.
- Reemplazar el bloque eliminado por el mismo `<TeacherPicker ... />` de Área 3.
- Agregar `notFoundTeacherNames: form.notFoundTeacherNames || undefined` a la llamada `reviewsAPI.create(...)` en `handleSubmitReview` (hoy falta).
- Ajustar la condición de habilitado/deshabilitado del submit igual que en Área 3.

---

## Casos borde

- **Cambio de materia o periodo:** `TeacherPicker` resetea `sectionId`, `teacherIds`, `fallbackTeacherId`, `notFoundTeacherNames` y vuelve a `mode: "subject-teachers"` — mismo comportamiento de reseteo que ya existe hoy al cambiar materia/periodo.
- **Profesor con varias secciones, sin elegir sección:** válido para guardar; se guarda `teacherIds: [profesorElegido]` sin `sectionId`.
- **Sección co-dictada por 2+ profesores:** ambos aparecen como opciones separadas en `subjectTeachers`; elegir cualquiera resuelve la misma sección única y guarda `teacherIds` con ambos co-profesores (igual que el comportamiento actual al elegir esa sección desde el `<select>`).
- **Volver de `full-search` a `subject-teachers`:** limpia `fallbackTeacherId` y `notFoundTeacherNames`; no afecta `sectionId`/`teacherIds` si ya se había completado el otro modo (edge case poco probable, se prioriza simplicidad).

## Plan de pruebas

- Verificación manual en `/encuesta` y `/reviews` contra datos reales/seed:
  1. Materia con 1 profesor en el periodo → autocompleta sección sin pasos extra.
  2. Materia con varios profesores/secciones → aparece el select opcional de sección.
  3. Materia sin secciones registradas para el periodo → fallback directo a búsqueda completa (sin regresión).
  4. "No encuentro mi profesor" → búsqueda completa → profesor sí existe en la BD pero no en esta materia.
  5. "No encuentro mi profesor" → búsqueda completa → tampoco existe → escribir nombre a mano.
  6. Confirmar en devtools/network que el payload de `POST /api/reviews` es correcto en cada caso.
- No se agregan pruebas automatizadas (no existen hoy en `apps/web`; fuera de alcance).
