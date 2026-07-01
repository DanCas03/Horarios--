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

Archivo: `apps/web/src/app/api/sections/route.ts`. Reemplazar el bloque final (líneas 49-56 actuales) por:

```ts
const populatedSections = sections.map((s: any) => ({
	id: s.id,
	code: s.code,
	teacherIds: s.teacherIds,
	teachers: s.teacherIds
		.map((id: string) => teacherNameById.get(id))
		.filter(Boolean),
	teacherOptions: s.teacherIds
		.filter((id: string) => teacherNameById.has(id))
		.map((id: string) => ({ id, name: teacherNameById.get(id) })),
}));
```

Es el único cambio de este archivo. El campo `teachers: string[]` existente no se toca (se sigue usando para el label "Sección A (Juan Pérez)").

---

## Área 2 — Componente compartido `TeacherPicker`

Nuevo archivo: `apps/web/src/components/reviews/teacher-picker.tsx`. Reemplaza en ambas páginas el bloque que hoy hace fetch de secciones + renderiza el `<select>` de "Sección/Profesor" (y, en `encuesta`, también el bloque `isFallback` con `TeacherCombobox`).

Código completo del archivo:

```tsx
"use client";

import { ChevronDown } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { subjectsAPI } from "@/api/client";

export interface TeacherOption {
	id: string;
	name: string;
}

interface SectionWithTeachers {
	id: string;
	code: string;
	teacherIds: string[];
	teachers: string[];
	teacherOptions: TeacherOption[];
}

export interface TeacherPickerValue {
	sectionId: string;
	teacherIds: string[];
	fallbackTeacherId: string; // '' | teacherId | 'no-encuentro-profe'
	notFoundTeacherNames: string;
}

const EMPTY_VALUE: TeacherPickerValue = {
	sectionId: "",
	teacherIds: [],
	fallbackTeacherId: "",
	notFoundTeacherNames: "",
};

export function isTeacherPickerValid(value: TeacherPickerValue): boolean {
	if (value.teacherIds.length > 0) return true;
	if (value.fallbackTeacherId === "no-encuentro-profe") {
		return !!value.notFoundTeacherNames.trim();
	}
	return false;
}

// ─── Buscador completo de profesores (todos los de la BD) ─────────────────
// Copiado tal cual del TeacherCombobox que hoy vive en encuesta/page.tsx.
function TeacherCombobox({
	id,
	value,
	onChange,
	options,
}: {
	id?: string;
	value: string;
	onChange: (teacherId: string) => void;
	options: TeacherOption[];
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const selectedTeacher = options.find((t) => t.id === value);
	const displayName =
		value === "no-encuentro-profe"
			? "No encuentro mi profe"
			: selectedTeacher
				? selectedTeacher.name
				: "";

	useEffect(() => {
		setQuery(displayName);
	}, [displayName]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = options.filter((t) =>
		t.name.toLowerCase().includes(query.toLowerCase()),
	);
	const specialOption = { id: "no-encuentro-profe", name: "No encuentro mi profe" };
	const showSpecial =
		"no encuentro mi profe".includes(query.toLowerCase()) || query === "";

	return (
		<div ref={wrapperRef} className="relative">
			<div className="relative">
				<input
					id={id}
					required
					value={query}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder="Buscar profesor..."
					className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				<ChevronDown
					size={15}
					className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400"
				/>
			</div>
			{open && (showSpecial || filtered.length > 0) && (
				<ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
					{showSpecial && (
						<li key={specialOption.id}>
							<button
								type="button"
								onMouseDown={() => {
									onChange(specialOption.id);
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 border-gray-100 border-b px-3 py-2 text-left font-semibold text-primary text-sm hover:bg-primary/5"
							>
								{specialOption.name}
							</button>
						</li>
					)}
					{filtered.map((t) => (
						<li key={t.id}>
							<button
								type="button"
								onMouseDown={() => {
									onChange(t.id);
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
							>
								<span className="truncate text-gray-700">{t.name}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ─── Combobox de profesores de la materia+periodo, con salida a full-search ─
function SubjectTeacherCombobox({
	id,
	value,
	onChange,
	onNotFound,
	options,
}: {
	id?: string;
	value: string; // teacherId seleccionado, o ""
	onChange: (teacherId: string) => void;
	onNotFound: () => void;
	options: TeacherOption[];
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const selected = options.find((t) => t.id === value);
	const displayName = selected ? selected.name : "";

	useEffect(() => {
		setQuery(displayName);
	}, [displayName]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = options.filter((t) =>
		t.name.toLowerCase().includes(query.toLowerCase()),
	);
	const showSpecial =
		"no encuentro mi profesor".includes(query.toLowerCase()) || query === "";

	return (
		<div ref={wrapperRef} className="relative">
			<div className="relative">
				<input
					id={id}
					required
					value={query}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder="Buscar profesor de esta materia..."
					className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				<ChevronDown
					size={15}
					className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400"
				/>
			</div>
			{open && (showSpecial || filtered.length > 0) && (
				<ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
					{showSpecial && (
						<li key="no-encuentro-profesor">
							<button
								type="button"
								onMouseDown={() => {
									onNotFound();
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 border-gray-100 border-b px-3 py-2 text-left font-semibold text-primary text-sm hover:bg-primary/5"
							>
								No encuentro mi profesor
							</button>
						</li>
					)}
					{filtered.map((t) => (
						<li key={t.id}>
							<button
								type="button"
								onMouseDown={() => {
									onChange(t.id);
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
							>
								<span className="truncate text-gray-700">{t.name}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ─── TeacherPicker principal ────────────────────────────────────────────────
export function TeacherPicker({
	id,
	subjectId,
	periodId,
	allTeachers,
	value,
	onChange,
}: {
	id?: string;
	subjectId: string | undefined;
	periodId: string;
	allTeachers: TeacherOption[];
	value: TeacherPickerValue;
	onChange: (updates: Partial<TeacherPickerValue>) => void;
}) {
	const [sections, setSections] = useState<SectionWithTeachers[]>([]);
	const [loadingSections, setLoadingSections] = useState(false);
	const [mode, setMode] = useState<"subject-teachers" | "full-search">(
		"subject-teachers",
	);
	// Solo para mostrar el nombre elegido en el combobox de materia;
	// no se expone al padre (teacherIds puede traer co-profesores en otro orden).
	const [selectedSubjectTeacherId, setSelectedSubjectTeacherId] = useState("");

	useEffect(() => {
		if (!subjectId || !periodId) {
			setSections([]);
			setMode("subject-teachers");
			setSelectedSubjectTeacherId("");
			onChange({ ...EMPTY_VALUE });
			return;
		}
		setLoadingSections(true);
		subjectsAPI
			.sections(subjectId, periodId)
			.then((res) => {
				setSections(res.data as SectionWithTeachers[]);
				setMode("subject-teachers");
				setSelectedSubjectTeacherId("");
				onChange({ ...EMPTY_VALUE });
			})
			.catch(() => {
				setSections([]);
				setMode("subject-teachers");
				setSelectedSubjectTeacherId("");
				onChange({ ...EMPTY_VALUE });
			})
			.finally(() => setLoadingSections(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subjectId, periodId]);

	const subjectTeachers: TeacherOption[] = Array.from(
		new Map(
			sections.flatMap((s) => s.teacherOptions).map((t) => [t.id, t]),
		).values(),
	);

	const noSections =
		!loadingSections && !!subjectId && !!periodId && sections.length === 0;
	const effectiveMode = noSections ? "full-search" : mode;

	const teacherSections = selectedSubjectTeacherId
		? sections.filter((s) => s.teacherIds.includes(selectedSubjectTeacherId))
		: [];

	const handlePickSubjectTeacher = (teacherId: string) => {
		setSelectedSubjectTeacherId(teacherId);
		const matchingSections = sections.filter((s) =>
			s.teacherIds.includes(teacherId),
		);
		if (matchingSections.length === 1) {
			const s = matchingSections[0];
			onChange({
				sectionId: s.id,
				teacherIds: s.teacherIds,
				fallbackTeacherId: "",
				notFoundTeacherNames: "",
			});
		} else {
			onChange({
				sectionId: "",
				teacherIds: [teacherId],
				fallbackTeacherId: "",
				notFoundTeacherNames: "",
			});
		}
	};

	const handleGoFullSearch = () => {
		setMode("full-search");
		setSelectedSubjectTeacherId("");
		onChange({ ...EMPTY_VALUE });
	};

	const handleBackToSubjectTeachers = () => {
		setMode("subject-teachers");
		onChange({ ...EMPTY_VALUE });
	};

	if (loadingSections) {
		return <p className="text-gray-400 text-sm">Cargando profesores...</p>;
	}

	if (effectiveMode === "full-search") {
		return (
			<div className="space-y-2">
				{noSections && (
					<p className="flex items-center gap-1.5 font-semibold text-amber-700 text-xs">
						⚠️ No se encontraron secciones para esta materia en este período.
					</p>
				)}
				<TeacherCombobox
					id={id}
					value={value.fallbackTeacherId}
					onChange={(teacherId) =>
						onChange({
							fallbackTeacherId: teacherId,
							teacherIds: teacherId === "no-encuentro-profe" ? [] : [teacherId],
							notFoundTeacherNames:
								teacherId === "no-encuentro-profe"
									? value.notFoundTeacherNames
									: "",
						})
					}
					options={allTeachers}
				/>
				{value.fallbackTeacherId === "no-encuentro-profe" && (
					<input
						type="text"
						required
						value={value.notFoundTeacherNames}
						onChange={(e) =>
							onChange({ notFoundTeacherNames: e.target.value })
						}
						placeholder="Escribe el nombre completo aquí..."
						className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
					/>
				)}
				{!noSections && (
					<button
						type="button"
						onClick={handleBackToSubjectTeachers}
						className="text-primary text-xs hover:underline"
					>
						← Volver a profesores de la materia
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<SubjectTeacherCombobox
				id={id}
				value={selectedSubjectTeacherId}
				onChange={handlePickSubjectTeacher}
				onNotFound={handleGoFullSearch}
				options={subjectTeachers}
			/>
			{teacherSections.length > 1 && (
				<select
					value={value.sectionId}
					onChange={(e) => {
						const s = teacherSections.find((sec) => sec.id === e.target.value);
						if (s) onChange({ sectionId: s.id, teacherIds: s.teacherIds });
					}}
					className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				>
					<option value="">¿En qué sección? (opcional)</option>
					{teacherSections.map((s) => (
						<option key={s.id} value={s.id}>
							Sección {s.code || "Sin código"}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
```

### Validación (expuesta a las páginas padre)

Usar `isTeacherPickerValid(value)` (exportada del mismo archivo) en la condición `disabled` de los botones de guardar/enviar, en vez de la lógica actual basada en `isFallback`/`sectionId`.

---

## Área 3 — Cambios en `encuesta/page.tsx`

1. Importar `TeacherPicker`, `type TeacherPickerValue`, `isTeacherPickerValid` desde `@/components/reviews/teacher-picker`.
2. Eliminar del archivo la función `TeacherCombobox` completa (líneas 208-321) — ahora vive en `teacher-picker.tsx`.
3. En `ReviewFormState` (líneas 59-78): no hace falta cambiar los nombres de campo — `sectionId`, `teacherIds`, `fallbackTeacherId`, `notFoundTeacherNames` ya existen tal cual los espera `TeacherPickerValue`.
4. En `SingleReviewForm` (líneas 325-393): eliminar `const [sections, setSections] = useState...`, `loadingSections`, la constante `isFallback`, y el `useEffect` que llama a `subjectsAPI.sections` (líneas 344-393) — todo ese fetch ahora vive dentro de `TeacherPicker`.
5. Reemplazar el bloque JSX `{isFallback ? (...) : (...)}` (líneas 483-565) por:
   ```tsx
   <div>
   	<label
   		htmlFor={`review-teacher-${form.id}`}
   		className="mb-1 block font-medium text-gray-700 text-sm"
   	>
   		Profesor *
   	</label>
   	<TeacherPicker
   		id={`review-teacher-${form.id}`}
   		subjectId={allSubjects.find((s) => s.code === form.subject_code)?.id}
   		periodId={form.period}
   		allTeachers={allTeachers}
   		value={{
   			sectionId: form.sectionId,
   			teacherIds: form.teacherIds,
   			fallbackTeacherId: form.fallbackTeacherId || "",
   			notFoundTeacherNames: form.notFoundTeacherNames || "",
   		}}
   		onChange={(updates) => onUpdate(form.id, updates)}
   	/>
   </div>
   ```
6. Condición `disabled` del botón "Guardar reseña" (línea 703-713): reemplazar
   ```ts
   (!isFallback && !form.sectionId) ||
   (isFallback &&
   	(!form.fallbackTeacherId ||
   		(form.fallbackTeacherId === "no-encuentro-profe" &&
   			!form.notFoundTeacherNames?.trim())))
   ```
   por
   ```ts
   !isTeacherPickerValid({
   	sectionId: form.sectionId,
   	teacherIds: form.teacherIds,
   	fallbackTeacherId: form.fallbackTeacherId || "",
   	notFoundTeacherNames: form.notFoundTeacherNames || "",
   })
   ```
7. `handleSave` (líneas 864-945): el bloque que arma `isFallback`/`teacherIds` (líneas 886-897) se simplifica a `const teacherIds = form.teacherIds.length > 0 ? form.teacherIds : undefined;`, y `notFoundTeacherNames` en el payload pasa a `form.fallbackTeacherId === "no-encuentro-profe" ? form.notFoundTeacherNames || undefined : undefined`.

## Área 4 — Cambios en `reviews/page.tsx`

1. Importar `teachersAPI` en el bloque de imports de `@/api/client` (línea 22-27) y `TeacherPicker`, `isTeacherPickerValid` desde `@/components/reviews/teacher-picker`.
2. Agregar estado `const [allTeachers, setAllTeachers] = useState<{ id: string; name: string }[]>([]);` y un `useEffect` que llama a `teachersAPI.list()` al montar (igual que en `encuesta/page.tsx`, líneas 745-754).
3. En el form state (líneas 225-238): agregar `fallbackTeacherId: ""` y `study_strategy: ""... notFoundTeacherNames: ""`.
4. Eliminar `const [sections, setSections] = useState...`, `loadingSections`, y el `useEffect` de carga de secciones (líneas 289-312).
5. Reemplazar el `<select id="review-section">` (líneas 610-640) por el mismo bloque `<TeacherPicker .../>` de Área 3 (label "Profesor *"), usando `allSubjects.find((s) => s.code === form.subject_code)?.id` como `subjectId`.
6. En `handleSubmitReview` (líneas 384-419): agregar `notFoundTeacherNames: form.fallbackTeacherId === "no-encuentro-profe" ? form.notFoundTeacherNames || undefined : undefined,` a la llamada `reviewsAPI.create(...)`, y limpiar los campos nuevos al resetear el form tras guardar.
7. El botón de envío (línea 747-750) hoy solo deshabilita con `disabled={submitting}` — no valida profesor en absoluto. Cambiar a:
   ```ts
   disabled={
   	submitting ||
   	!isTeacherPickerValid({
   		sectionId: form.sectionId,
   		teacherIds: form.teacherIds,
   		fallbackTeacherId: form.fallbackTeacherId || "",
   		notFoundTeacherNames: form.notFoundTeacherNames || "",
   	})
   }
   ```
   Esto es una mejora de consistencia: antes se podía enviar una reseña sin profesor identificado; con `TeacherPicker` ya no debería ser posible, igual que en `/encuesta`.

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
