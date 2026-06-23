# Homepage, Retomar Encuesta, Cambio de Carrera y Marca — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la homepage (CTA para retomar encuesta + enlaces a secciones), permitir retomar la encuesta con materias aún no reseñadas, permitir cambiar de carrera desde la encuesta, y dar identidad de marca propia (logo + favicon).

**Architecture:** App Next.js 16 (App Router) en monorepo `apps/web`, con rutas API en `app/api/*` que usan Prisma (`@horaios/db`) y sesión better-auth. El estado de usuario vive en `auth-context` (`useAuth`). Se agrega un endpoint para listar reseñas propias, se deriva el estado "pendiente" en la encuesta, y se centraliza el reset de materias al cambiar carrera en `PUT /api/auth/me`.

**Tech Stack:** Next.js 16, React 19, TypeScript, TailwindCSS v4, Prisma (MongoDB), better-auth, lucide-react, axios. Gestor: **bun**. Monorepo: **turbo**. Lint/format: **Biome**.

## Global Constraints

- **SIN TESTING.** No se escriben pruebas automatizadas (unit/integración/e2e) ni TDD. Verificación **manual** + `check-types` + `biome`. (Instrucción explícita del usuario.)
- **Gestor de paquetes:** `bun` (no npm/yarn/pnpm). Comandos vía `bun run ...` / `bunx ...`.
- **Verificación de tipos:** `bun run check-types` (raíz, turbo) — debe pasar sin errores.
- **Lint/format:** `bunx biome check apps/web/src` — sin errores (usar `--write` para autoarreglar formato).
- **Dev server:** `bun run dev:web` → http://localhost:3000
- **Colores de marca (verbatim):** primary `#1f3653`, primary-light `#325275`, primary-dark `#122135`, accent `#e59c24`, surface `#fafafa`. Clases Tailwind: `primary`, `primary-dark`, `accent`.
- **Idioma de UI:** español (mantener el tono y estilo del código existente; comentarios en español).
- **Rutas tipadas:** el proyecto usa `typedRoutes` (`import type { Route } from "next"` + `as Route`). Seguir ese patrón al crear `Link` a rutas dinámicas/variables.
- **Commits:** trabajar en una rama de feature (no `main`). Un commit por tarea con mensaje convencional.

---

## Task 0: Rama de trabajo

**Files:** ninguno (operación git).

- [ ] **Step 1: Crear y cambiar a rama de feature**

```bash
git checkout -b feat/homepage-encuesta-marca
```

- [ ] **Step 2: Verificar estado limpio**

Run: `git status`
Expected: en rama `feat/homepage-encuesta-marca`, sin cambios sin commitear (salvo el directorio `.claude/` y los `docs/superpowers/` ya presentes).

---

## Task 1: Endpoint "mis reseñas" + cliente API

**Files:**
- Create: `apps/web/src/app/api/reviews/mine/route.ts`
- Modify: `apps/web/src/api/client.ts` (objeto `reviewsAPI`)

**Interfaces:**
- Produces: `GET /api/reviews/mine` → `{ reviewedSubjectCodes: string[] }`
- Produces: `reviewsAPI.mine()` → `Promise<AxiosResponse<{ reviewedSubjectCodes: string[] }>>`

- [ ] **Step 1: Crear el route handler**

Create `apps/web/src/app/api/reviews/mine/route.ts`:

```ts
import prisma from "@horaios/db";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-session";

/**
 * GET /api/reviews/mine
 * Retorna los códigos de materia que el usuario actual ya reseñó,
 * para poder retomar la encuesta con materias aún no reseñadas.
 */
export async function GET() {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!profile) {
		return NextResponse.json({ reviewedSubjectCodes: [] });
	}

	const reviews = await prisma.review.findMany({
		where: { userProfileId: profile.id },
		select: { subjectCode: true },
	});

	const reviewedSubjectCodes = Array.from(
		new Set(reviews.map((r) => r.subjectCode)),
	);

	return NextResponse.json({ reviewedSubjectCodes });
}
```

- [ ] **Step 2: Agregar `mine()` al cliente**

In `apps/web/src/api/client.ts`, dentro del objeto `reviewsAPI`, agregar el método `mine` después de `create` (cerrando con coma el `create` previo):

```ts
export const reviewsAPI = {
	bySubject: (subjectCode: string, universityId?: string) =>
		api.get(`/reviews/subject/${subjectCode}`, {
			params: universityId ? { university_id: universityId } : {},
		}),
	byProfessor: (teacherId: string) =>
		api.get(`/reviews/professor/${teacherId}`),
	mine: () => api.get("/reviews/mine"),
	create: (data: {
		subjectCode: string;
		universityId?: string;
		teacherIds?: string[];
		periodId?: string;
		sectionId?: string;
		ratings: { category: string; value: number }[];
		overallRating?: number;
		wouldRecommend: boolean;
		comment: string;
		tips?: string;
		studyStrategy?: string;
		notFoundTeacherNames?: string;
	}) => api.post("/reviews/", data),
};
```

- [ ] **Step 3: Type check**

Run: `bun run check-types`
Expected: sin errores.

- [ ] **Step 4: Verificación manual del endpoint**

Run: `bun run dev:web` (si no está corriendo). Con sesión iniciada, abrir en el navegador `http://localhost:3000/api/reviews/mine`.
Expected: JSON `{ "reviewedSubjectCodes": [...] }` (array vacío si el usuario no ha reseñado nada; 401 si no hay sesión).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/reviews/mine/route.ts apps/web/src/api/client.ts
git commit -m "feat(reviews): endpoint GET /api/reviews/mine para reseñas propias"
```

---

## Task 2: Encuesta — retomar con otras materias

**Files:**
- Modify: `apps/web/src/app/encuesta/page.tsx` (`EncuestaContent`)

**Interfaces:**
- Consumes: `reviewsAPI.mine()` (Task 1)
- Internal: `reviewedCodes: Set<string>`, `pendingSubjectOptions: SubjectOption[]`, `reviewedApprovedCount: number`, `allReviewed: boolean`

- [ ] **Step 1: Agregar estado `reviewedCodes`**

In `apps/web/src/app/encuesta/page.tsx`, dentro de `EncuestaContent`, justo después de la línea:

```ts
	const [allTeachers, setAllTeachers] = useState<{ id: string; name: string }[]>([]);
```

agregar:

```ts
	const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(new Set());
```

- [ ] **Step 2: Cargar las reseñas previas del usuario**

In the same component, después del `useEffect` que carga `teachersAPI.list()` (el bloque que termina con `}, []);` tras `setAllTeachers`), agregar:

```ts
	// Cargar materias ya reseñadas (para retomar con otras)
	useEffect(() => {
		if (!user) return;
		reviewsAPI
			.mine()
			.then((res) => {
				const codes = (res.data as { reviewedSubjectCodes: string[] })
					.reviewedSubjectCodes;
				setReviewedCodes(new Set(codes));
			})
			.catch((err) => {
				console.error("Error al cargar reseñas previas:", err);
			});
	}, [user]);
```

- [ ] **Step 3: Derivar materias pendientes y conteo reseñado**

In the same component, después del `useMemo` de `hasUnsavedChanges` (cierra con `}, [forms]);`), agregar:

```ts
	const pendingSubjectOptions = useMemo(
		() => subjectOptions.filter((s) => !reviewedCodes.has(s.code)),
		[subjectOptions, reviewedCodes],
	);
	const reviewedApprovedCount = useMemo(
		() => subjectOptions.filter((s) => reviewedCodes.has(s.code)).length,
		[subjectOptions, reviewedCodes],
	);
	const allReviewed =
		subjectOptions.length > 0 && pendingSubjectOptions.length === 0;
```

- [ ] **Step 4: Marcar la materia como reseñada al guardar**

In `handleSave`, dentro del bloque de éxito, justo después de:

```ts
				updateForm(formId, { saved: true, saving: false });
				setSavedCount((c) => c + 1);
```

agregar:

```ts
				setReviewedCodes((prev) => {
					const next = new Set(prev);
					next.add(form.subject_code);
					return next;
				});
```

- [ ] **Step 5: Actualizar el botón "Finalizar" para que dependa del total reseñado**

In el header, reemplazar el badge de contador y la condición del botón finalizar. Reemplazar este bloque:

```tsx
					{savedCount > 0 && (
						<span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700 text-sm">
							{savedCount} resena{savedCount !== 1 ? "s" : ""} guardada
							{savedCount !== 1 ? "s" : ""}
						</span>
					)}
					<button
						type="button"
						onClick={handleFinish}
						disabled={savedCount < 1 || finishing}
						className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm transition-all active:scale-[0.98] ${
							savedCount >= 1
								? "bg-green-600 text-white shadow-[0_4px_14px_rgba(22,163,74,0.35)] hover:-translate-y-0.5 hover:bg-green-700"
								: "cursor-not-allowed bg-gray-200 text-gray-400"
						}`}
					>
```

por:

```tsx
					{reviewedApprovedCount > 0 && (
						<span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700 text-sm">
							{reviewedApprovedCount} resena{reviewedApprovedCount !== 1 ? "s" : ""}
						</span>
					)}
					<button
						type="button"
						onClick={handleFinish}
						disabled={reviewedApprovedCount < 1 || finishing}
						className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm transition-all active:scale-[0.98] ${
							reviewedApprovedCount >= 1
								? "bg-green-600 text-white shadow-[0_4px_14px_rgba(22,163,74,0.35)] hover:-translate-y-0.5 hover:bg-green-700"
								: "cursor-not-allowed bg-gray-200 text-gray-400"
						}`}
					>
```

- [ ] **Step 6: Actualizar la barra de progreso con el total reseñado**

Reemplazar el bloque del progress bar. Buscar:

```tsx
						<span className="text-gray-600">
							Has resenado{" "}
							<strong className="text-primary">{savedCount}</strong> de{" "}
							<strong>{subjectOptions.length}</strong> materias aprobadas.
```

y reemplazar `{savedCount}` por `{reviewedApprovedCount}`:

```tsx
						<span className="text-gray-600">
							Has resenado{" "}
							<strong className="text-primary">{reviewedApprovedCount}</strong> de{" "}
							<strong>{subjectOptions.length}</strong> materias aprobadas.
```

Luego, en el mismo bloque, reemplazar el cálculo del porcentaje y del ancho de barra (las dos ocurrencias de `(savedCount / subjectOptions.length)`):

```tsx
							<span className="font-mono text-primary text-xs">
								{subjectOptions.length > 0
									? Math.round((reviewedApprovedCount / subjectOptions.length) * 100)
									: 0}
								%
							</span>
```

```tsx
							<div
								className="h-full rounded-full bg-primary transition-all duration-500"
								style={{
									width: `${
										subjectOptions.length > 0
											? Math.min(100, (reviewedApprovedCount / subjectOptions.length) * 100)
											: 0
									}%`,
								}}
							/>
```

- [ ] **Step 7: Pasar las materias pendientes al combobox y manejar "ya reseñó todo"**

Reemplazar el bloque de "Review forms" + "Add another button". Buscar:

```tsx
				{/* Review forms */}
				<div className="space-y-6">
					{forms.map((form, i) => (
						<div
							key={form.id}
							ref={i === forms.length - 1 ? lastFormRef : undefined}
						>
							<SingleReviewForm
								form={form}
								index={i}
								periods={periods}
								subjectOptions={subjectOptions}
								allSubjects={allSubjects}
								allTeachers={allTeachers}
								onUpdate={updateForm}
								onSave={handleSave}
							/>
						</div>
					))}
				</div>

				{/* Add another button */}
				<div className="mt-8 flex justify-center">
					<button
						type="button"
						onClick={addForm}
						className="flex items-center gap-2 rounded-full border-2 border-gray-300 border-dashed px-6 py-3 font-medium text-gray-500 text-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
					>
						<PlusCircle size={18} />
						Agregar otra materia
					</button>
				</div>
```

y reemplazar por:

```tsx
				{allReviewed ? (
					/* Ya reseñó todas sus materias aprobadas */
					<div className="panel-enter rounded-2xl bg-green-50 p-8 text-center ring-1 ring-green-200">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
							<ClipboardCheck className="h-7 w-7 text-green-600" />
						</div>
						<h3 className="font-bold text-green-900 text-lg">
							¡Ya reseñaste todas tus materias aprobadas!
						</h3>
						<p className="mx-auto mt-2 max-w-md text-green-800/90 text-sm">
							Si cursaste materias nuevas, agrégalas a tus materias cursadas para
							poder reseñarlas.
						</p>
						<Link
							href="/encuesta/onboarding?edit=true"
							className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-semibold text-white text-sm shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
						>
							+ Modificar materias cursadas
						</Link>
					</div>
				) : (
					<>
						{/* Review forms */}
						<div className="space-y-6">
							{forms.map((form, i) => (
								<div
									key={form.id}
									ref={i === forms.length - 1 ? lastFormRef : undefined}
								>
									<SingleReviewForm
										form={form}
										index={i}
										periods={periods}
										subjectOptions={pendingSubjectOptions}
										allSubjects={allSubjects}
										allTeachers={allTeachers}
										onUpdate={updateForm}
										onSave={handleSave}
									/>
								</div>
							))}
						</div>

						{/* Add another button */}
						<div className="mt-8 flex justify-center">
							<button
								type="button"
								onClick={addForm}
								className="flex items-center gap-2 rounded-full border-2 border-gray-300 border-dashed px-6 py-3 font-medium text-gray-500 text-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
							>
								<PlusCircle size={18} />
								Agregar otra materia
							</button>
						</div>
					</>
				)}
```

- [ ] **Step 8: Ajustar copy de la pantalla de agradecimiento (esta sesión)**

En la pantalla de "Gracias", reemplazar:

```tsx
						Tus resenas ayudaran a otros estudiantes a tomar mejores decisiones.
						Guardaste {savedCount} resena{savedCount !== 1 ? "s" : ""} en total.
```

por:

```tsx
						Tus resenas ayudaran a otros estudiantes a tomar mejores decisiones.
						Guardaste {savedCount} resena{savedCount !== 1 ? "s" : ""} en esta sesion.
```

- [ ] **Step 9: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/app/encuesta/page.tsx`
Expected: sin errores (correr con `--write` si hay diferencias de formato).

- [ ] **Step 10: Verificación manual**

Con un usuario que ya tenga al menos una reseña: abrir `http://localhost:3000/encuesta`.
Expected: la barra de progreso muestra N reseñadas (incluyendo las previas); el combobox de materia NO ofrece materias ya reseñadas; al guardar una, desaparece del combobox de un formulario nuevo; si se reseñan todas, aparece el panel "¡Ya reseñaste todas tus materias aprobadas!". El botón "Finalizar encuesta" está habilitado si hay ≥1 reseñada.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/app/encuesta/page.tsx
git commit -m "feat(encuesta): retomar encuesta excluyendo materias ya resenadas"
```

---

## Task 3: Backend — resetear materias al cambiar de carrera

**Files:**
- Modify: `apps/web/src/app/api/auth/me/route.ts` (`PUT`)

**Interfaces:**
- Produces: `PUT /api/auth/me` con `{ universityIds?, academicProgramIds? }` que, si `academicProgramIds` cambia, resetea `approvedSubjects: []` y `totalApprovedCredits: 0`.

- [ ] **Step 1: Reescribir el handler `PUT`**

Reemplazar completamente la función `PUT` en `apps/web/src/app/api/auth/me/route.ts` por:

```ts
export async function PUT(request: Request) {
	const { session, errorResponse } = await requireSession();
	if (errorResponse) return errorResponse;

	const body = await request.json();
	const { universityIds, academicProgramIds } = body as {
		universityIds?: string[];
		academicProgramIds?: string[];
	};

	// Detectar cambio de carrera para invalidar las materias aprobadas del
	// pensum anterior (las reseñas se conservan, están atadas a subjectCode).
	const existing = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
		select: { academicProgramIds: true },
	});

	const programChanged =
		academicProgramIds !== undefined &&
		JSON.stringify([...academicProgramIds].sort()) !==
			JSON.stringify([...(existing?.academicProgramIds ?? [])].sort());

	const profile = await prisma.userProfile.upsert({
		where: { userId: session.user.id },
		update: {
			...(universityIds !== undefined && { universityIds }),
			...(academicProgramIds !== undefined && { academicProgramIds }),
			...(programChanged && {
				approvedSubjects: [],
				totalApprovedCredits: 0,
			}),
		},
		create: {
			userId: session.user.id,
			universityIds: universityIds ?? [],
			academicProgramIds: academicProgramIds ?? [],
			approvedSubjects: [],
			totalApprovedCredits: 0,
		},
	});

	return NextResponse.json({
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		role: session.user.role,
		universityIds: profile.universityIds,
		academicProgramIds: profile.academicProgramIds,
		approvedSubjects: profile.approvedSubjects,
		totalApprovedCredits: profile.totalApprovedCredits,
	});
}
```

- [ ] **Step 2: Type check**

Run: `bun run check-types`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Se verifica de forma integrada en la Task 5 (al cambiar de carrera desde la encuesta, las materias aprobadas deben quedar en 0 y redirigir a onboarding). No requiere verificación aislada aquí.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/auth/me/route.ts
git commit -m "feat(profile): resetear materias aprobadas al cambiar de carrera"
```

---

## Task 4: Componente `<ChangeCareerModal/>`

**Files:**
- Create: `apps/web/src/components/encuesta/change-career-modal.tsx`

**Interfaces:**
- Produces: `export default function ChangeCareerModal({ open, onClose }: { open: boolean; onClose: () => void })`
- Consumes: `PUT /api/auth/me` (Task 3), `universitiesAPI.list()`, `academicProgramsAPI.list(uni)`, `useAuth()`

- [ ] **Step 1: Crear el componente**

Create `apps/web/src/components/encuesta/change-career-modal.tsx`:

```tsx
"use client";

import { AlertTriangle, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import api, { academicProgramsAPI, universitiesAPI } from "@/api/client";
import { useAuth } from "@/context/auth-context";

interface University {
	id: string;
	name: string;
	shortName: string;
}

interface AcademicProgram {
	id: string;
	name: string;
}

export default function ChangeCareerModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const { user, refreshUser } = useAuth();
	const router = useRouter();
	const [universities, setUniversities] = useState<University[]>([]);
	const [programs, setPrograms] = useState<AcademicProgram[]>([]);
	const [selectedUni, setSelectedUni] = useState(
		user?.universityIds?.[0] || "",
	);
	const [selectedProgram, setSelectedProgram] = useState(
		user?.academicProgramIds?.[0] || "",
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	// Precargar selección actual cada vez que se abre
	useEffect(() => {
		if (!open) return;
		setSelectedUni(user?.universityIds?.[0] || "");
		setSelectedProgram(user?.academicProgramIds?.[0] || "");
		setError("");
	}, [open, user?.universityIds, user?.academicProgramIds]);

	useEffect(() => {
		if (!open) return;
		universitiesAPI
			.list()
			.then((res) => setUniversities(res.data))
			.catch(() => {});
	}, [open]);

	useEffect(() => {
		if (!selectedUni) {
			setPrograms([]);
			return;
		}
		academicProgramsAPI
			.list(selectedUni)
			.then((res) => setPrograms(res.data))
			.catch(() => {});
	}, [selectedUni]);

	if (!open) return null;

	const programChanged =
		selectedProgram !== (user?.academicProgramIds?.[0] || "");

	const handleConfirm = async () => {
		if (!selectedUni || !selectedProgram) {
			setError("Selecciona universidad y carrera.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await api.put("/auth/me", {
				universityIds: [selectedUni],
				academicProgramIds: [selectedProgram],
			});
			await refreshUser();
			router.push("/encuesta/onboarding");
		} catch {
			setError("No se pudo cambiar la carrera. Intenta de nuevo.");
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div className="fade-in zoom-in-95 w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 duration-200">
				<h3 className="flex items-center gap-2 font-bold text-gray-900 text-lg">
					<GraduationCap size={20} className="text-primary" />
					Cambiar carrera
				</h3>
				<p className="mt-2 text-gray-500 text-sm">
					Selecciona tu universidad y carrera correctas.
				</p>

				{programChanged && (
					<div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-amber-800 text-xs ring-1 ring-amber-200">
						<AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
						<span>
							Cambiar de carrera reiniciará tus materias cursadas (las volverás
							a seleccionar). Tus reseñas se conservan.
						</span>
					</div>
				)}

				{error && (
					<div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
						{error}
					</div>
				)}

				<div className="mt-4 space-y-4">
					<div>
						<label
							htmlFor="cc-uni"
							className="mb-1.5 block font-medium text-gray-700 text-sm"
						>
							Universidad
						</label>
						<select
							id="cc-uni"
							value={selectedUni}
							onChange={(e) => {
								setSelectedUni(e.target.value);
								setSelectedProgram("");
							}}
							className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
						>
							<option value="">Selecciona tu universidad</option>
							{universities.map((u) => (
								<option key={u.id} value={u.id}>
									{u.shortName} - {u.name}
								</option>
							))}
						</select>
					</div>
					{selectedUni && (
						<div>
							<label
								htmlFor="cc-prog"
								className="mb-1.5 block font-medium text-gray-700 text-sm"
							>
								Carrera
							</label>
							<select
								id="cc-prog"
								value={selectedProgram}
								onChange={(e) => setSelectedProgram(e.target.value)}
								className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							>
								<option value="">Selecciona tu carrera</option>
								{programs.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={saving}
						className="rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 text-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={saving || !selectedUni || !selectedProgram}
						className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-white text-sm shadow-[0_4px_12px_rgba(31,54,83,0.25)] transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? (
							<>
								<Loader2 size={15} className="animate-spin" /> Guardando...
							</>
						) : (
							"Confirmar y reseleccionar materias"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/components/encuesta/change-career-modal.tsx`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/encuesta/change-career-modal.tsx
git commit -m "feat(encuesta): componente ChangeCareerModal"
```

---

## Task 5: Integrar cambio de carrera en encuesta y onboarding

**Files:**
- Modify: `apps/web/src/app/encuesta/page.tsx`
- Modify: `apps/web/src/app/encuesta/onboarding/page.tsx`

**Interfaces:**
- Consumes: `ChangeCareerModal` (Task 4), `PUT /api/auth/me` (Task 3)

- [ ] **Step 1: Importar el modal en la encuesta**

In `apps/web/src/app/encuesta/page.tsx`, agregar el import junto a los demás imports de componentes (después de `import SurveyGuard from "@/components/auth/survey-guard";`):

```ts
import ChangeCareerModal from "@/components/encuesta/change-career-modal";
```

- [ ] **Step 2: Agregar estado para abrir el modal**

In `EncuestaContent`, después de `const [showUnsavedModal, setShowUnsavedModal] = useState(false);` agregar:

```ts
	const [showChangeCareer, setShowChangeCareer] = useState(false);
```

- [ ] **Step 3: Mostrar el control "Cambiar carrera" en el header**

In el header de la encuesta, reemplazar:

```tsx
						<p className="mt-2 text-gray-500 text-sm">
							Comparte tu experiencia con las materias que cursaste
						</p>
```

por:

```tsx
						<p className="mt-2 text-gray-500 text-sm">
							Comparte tu experiencia con las materias que cursaste
						</p>
						{academicProgramName && (
							<button
								type="button"
								onClick={() => setShowChangeCareer(true)}
								className="mt-1.5 text-gray-400 text-xs transition-colors hover:text-primary"
							>
								Carrera:{" "}
								<span className="font-medium text-gray-600">
									{academicProgramName}
								</span>{" "}
								·{" "}
								<span className="font-semibold text-primary underline">
									Cambiar
								</span>
							</button>
						)}
```

- [ ] **Step 4: Renderizar el modal**

In el JSX de la encuesta, justo antes del cierre `</div>` del contenedor raíz (después del bloque `{showUnsavedModal && ( ... )}`), agregar:

```tsx
				<ChangeCareerModal
					open={showChangeCareer}
					onClose={() => setShowChangeCareer(false)}
				/>
```

- [ ] **Step 5: Importar el modal en onboarding**

In `apps/web/src/app/encuesta/onboarding/page.tsx`, agregar el import después de `import SurveyGuard from "@/components/auth/survey-guard";`:

```ts
import ChangeCareerModal from "@/components/encuesta/change-career-modal";
```

- [ ] **Step 6: Agregar estado en onboarding**

In `OnboardingContent`, después de `const [collapsedSemesters, setCollapsedSemesters] = useState<Set<number>>(new Set());` agregar:

```ts
	const [showChangeCareer, setShowChangeCareer] = useState(false);
```

- [ ] **Step 7: Mostrar el control y el modal en onboarding**

In el header de onboarding, reemplazar:

```tsx
					<p className="mt-3 text-gray-500 text-sm">
						Marca las materias que ya aprobaste. Solo podras hacer resenas de
						estas materias.
					</p>
```

por:

```tsx
					<p className="mt-3 text-gray-500 text-sm">
						Marca las materias que ya aprobaste. Solo podras hacer resenas de
						estas materias.
					</p>
					<button
						type="button"
						onClick={() => setShowChangeCareer(true)}
						className="mt-3 text-gray-400 text-xs transition-colors hover:text-primary"
					>
						¿Carrera equivocada?{" "}
						<span className="font-semibold text-primary underline">
							Cambiar carrera
						</span>
					</button>
```

Y antes del cierre `</div>` del contenedor raíz del `return` (después del bloque del botón "Submit"), agregar:

```tsx
			<ChangeCareerModal
				open={showChangeCareer}
				onClose={() => setShowChangeCareer(false)}
			/>
```

- [ ] **Step 8: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/app/encuesta/page.tsx apps/web/src/app/encuesta/onboarding/page.tsx`
Expected: sin errores.

- [ ] **Step 9: Verificación manual**

Abrir `http://localhost:3000/encuesta` → click en "Cambiar" junto a la carrera → seleccionar otra carrera → ver el aviso de reinicio → "Confirmar y reseleccionar materias".
Expected: redirige a `/encuesta/onboarding` con el pensum de la nueva carrera y 0 materias seleccionadas (materias aprobadas reiniciadas). Las reseñas previas siguen existiendo (verificable en `/api/reviews/mine`). Repetir el flujo desde la propia página de onboarding con el link "Cambiar carrera".

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/app/encuesta/page.tsx apps/web/src/app/encuesta/onboarding/page.tsx
git commit -m "feat(encuesta): cambiar carrera desde encuesta y onboarding"
```

---

## Task 6: Homepage — reemplazar cartas UCAB/UNIMET por CTA contextual

**Files:**
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `useAuth()` (`user`, `user.surveyCompleted`)

- [ ] **Step 1: Reemplazar la sección de universidades**

In `apps/web/src/app/page.tsx`, reemplazar TODA la sección comentada `{/* ─── UNIVERSITIES (Asymmetric Z-Axis cards) ... */}` (desde `<section className="relative z-10 mx-auto -mt-12 ...">` hasta su `</section>` de cierre, incluyendo las dos cartas UCAB y UNIMET) por:

```tsx
				{/* ─── SURVEY CTA (reemplaza cartas de universidades) ──────────── */}
				<section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="reveal rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
						<div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] sm:p-10">
							<div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary to-accent" />
							<div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
								<div className="max-w-xl">
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
										<MessageSquare className="h-6 w-6 text-primary" />
									</div>
									<h3 className="font-extrabold text-2xl text-gray-900 tracking-tight">
										{user
											? user.surveyCompleted
												? "Retoma la encuesta"
												: "Continúa tu encuesta"
											: "Comparte tus reseñas"}
									</h3>
									<p className="mt-2 text-gray-500 text-sm leading-relaxed">
										{user
											? user.surveyCompleted
												? "¿Cursaste otras materias? Vuelve a la encuesta y reseña las que te faltan. Las que ya reseñaste quedan guardadas."
												: "Termina de reseñar tus materias cursadas para ayudar a la comunidad estudiantil."
											: "Regístrate para reseñar tus materias y ayudar a otros estudiantes a decidir."}
									</p>
								</div>
								<Link
									href={user ? "/encuesta" : "/register"}
									className="group flex flex-shrink-0 items-center gap-3 rounded-full bg-primary px-7 py-4 font-bold text-white shadow-[0_8px_24px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(31,54,83,0.45)] active:scale-[0.98]"
								>
									{user
										? user.surveyCompleted
											? "Retomar encuesta"
											: "Continuar encuesta"
										: "Comenzar ahora"}
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
										<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
											<title>Icono flecha encuesta</title>
											<path
												d="M2 10L10 2M10 2H4M10 2V8"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</span>
								</Link>
							</div>
						</div>
					</div>
				</section>
```

(`MessageSquare` y `Link` ya están importados en este archivo.)

- [ ] **Step 2: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/app/page.tsx`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Abrir `http://localhost:3000/`:
- Sin sesión → bloque "Comparte tus reseñas" con botón "Comenzar ahora" → `/register`.
- Con sesión y encuesta completada → "Retoma la encuesta" / botón "Retomar encuesta" → `/encuesta`.
- Con sesión sin completar encuesta → "Continúa tu encuesta" / "Continuar encuesta" → `/encuesta`.
- Ya NO aparecen las cartas UCAB/UNIMET.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(home): reemplazar cartas UCAB/UNIMET por CTA de encuesta contextual"
```

---

## Task 7: Homepage — enlazar feature cards + tooltip "Próximamente"

**Files:**
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Internal: `features` con campos `href?: Route` y `comingSoon?: boolean`; estado `tooltip: { x: number; y: number } | null`

- [ ] **Step 1: Importar tipos necesarios**

In `apps/web/src/app/page.tsx`, agregar imports al inicio (junto a los existentes). Después de `import { BookOpen, Calendar, MessageSquare, TrendingUp } from "lucide-react";` agregar:

```ts
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
```

Y agregar `useState` al import de React (el archivo hoy no importa hooks de React explícitamente; agregar la línea):

```ts
import { useState } from "react";
```

- [ ] **Step 2: Tipar y extender el arreglo `features`**

Reemplazar la definición de `features` por:

```ts
type Feature = {
	icon: LucideIcon;
	title: string;
	desc: string;
	href?: Route;
	comingSoon?: boolean;
};

const features: Feature[] = [
	{
		icon: BookOpen,
		title: "Seguimiento de Pensum",
		desc: "Visualiza tu avance académico, marca materias aprobadas y conoce tus prelaciones automáticamente.",
		href: "/pensum",
	},
	{
		icon: Calendar,
		title: "Planificación de Horarios",
		desc: "Organiza tus próximos semestres con materias tentativas y genera horarios óptimos.",
		href: "/schedule",
	},
	{
		icon: MessageSquare,
		title: "Reseñas Anónimas",
		desc: "Comparte y consulta opiniones sobre materias y profesores de forma completamente anónima.",
		href: "/reviews",
	},
	{
		icon: TrendingUp,
		title: "Análisis Inteligente",
		desc: "Recibe sugerencias basadas en tu progreso, dificultad y objetivos académicos.",
		comingSoon: true,
	},
];
```

- [ ] **Step 3: Agregar estado del tooltip**

In el componente `Home`, después de `const { user } = useAuth();` agregar:

```ts
	const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
```

- [ ] **Step 4: Renderizar cards como Link o como div con tooltip**

Reemplazar el bloque del map de features:

```tsx
					{features.map((f, i) => (
						<div
							key={f.title}
							className={`reveal reveal-delay-${i + 1} rounded-[2rem] bg-black/[0.02] p-2 ring-1 ring-black/5 ${i === 0 ? "lg:col-span-2" : ""}`}
						>
							<div className="group h-full rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgb(0,0,0,0.06)]">
								<div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-black/5 transition-all duration-500 group-hover:scale-105 group-hover:bg-primary group-hover:ring-primary">
									<f.icon className="h-6 w-6 text-gray-500 transition-colors duration-300 group-hover:text-white" />
								</div>
								<h3 className="mb-4 font-extrabold text-gray-900 text-xl tracking-tight">
									{f.title}
								</h3>
								<p className="text-gray-500 text-sm leading-relaxed">
									{f.desc}
								</p>
							</div>
						</div>
					))}
```

por:

```tsx
					{features.map((f, i) => {
						const wrapperClass = `reveal reveal-delay-${i + 1} block rounded-[2rem] bg-black/[0.02] p-2 ring-1 ring-black/5 ${i === 0 ? "lg:col-span-2" : ""}`;
						const inner = (
							<div className="group h-full rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgb(0,0,0,0.06)]">
								<div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-black/5 transition-all duration-500 group-hover:scale-105 group-hover:bg-primary group-hover:ring-primary">
									<f.icon className="h-6 w-6 text-gray-500 transition-colors duration-300 group-hover:text-white" />
								</div>
								<h3 className="mb-4 font-extrabold text-gray-900 text-xl tracking-tight">
									{f.title}
								</h3>
								<p className="text-gray-500 text-sm leading-relaxed">
									{f.desc}
								</p>
							</div>
						);

						if (f.comingSoon) {
							return (
								<div
									key={f.title}
									className={`${wrapperClass} cursor-default`}
									onMouseEnter={(e) =>
										setTooltip({ x: e.clientX, y: e.clientY })
									}
									onMouseMove={(e) =>
										setTooltip({ x: e.clientX, y: e.clientY })
									}
									onMouseLeave={() => setTooltip(null)}
								>
									{inner}
								</div>
							);
						}

						return (
							<Link key={f.title} href={f.href as Route} className={wrapperClass}>
								{inner}
							</Link>
						);
					})}
```

- [ ] **Step 5: Renderizar el tooltip flotante**

Justo antes del cierre del `</div>` raíz del componente `Home` (el `</div>` final antes de `);`), agregar:

```tsx
			{tooltip && (
				<div
					className="pointer-events-none fixed z-50 rounded-full bg-primary-dark px-3 py-1.5 font-semibold text-white text-xs shadow-lg"
					style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
				>
					Próximamente
				</div>
			)}
```

- [ ] **Step 6: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/app/page.tsx`
Expected: sin errores.

- [ ] **Step 7: Verificación manual**

Abrir `http://localhost:3000/` y bajar a "Características":
- Click en "Seguimiento de Pensum" → `/pensum`; "Planificación de Horarios" → `/schedule`; "Reseñas Anónimas" → `/reviews`.
- Pasar el cursor sobre "Análisis Inteligente" → aparece un tooltip "Próximamente" que sigue al cursor; no navega al hacer click.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(home): enlazar feature cards y tooltip Proximamente"
```

---

## Task 8: Marca — logo, favicon y app icon (skills de marca)

**Files:**
- Create: `apps/web/src/components/logo.tsx`
- Modify: `apps/web/public/favicon/favicon.svg`
- Create: `apps/web/src/app/icon.svg`

**Interfaces:**
- Produces: `export default function Logo({ className }: { className?: string })`

- [ ] **Step 1: Explorar identidad con las skills de marca**

Invocar (instrucción explícita del usuario) en este orden, para definir/afinar el símbolo "académico moderno" en colores de marca (primary-dark `#122135` + accent `#e59c24`):
1. `/theme-factory` — formalizar la paleta/tema de marca.
2. `/brandkit` — sistema de logo/identidad (mortarboard/birrete geométrico).
3. `/algorithmic-art` — exploración generativa del símbolo (opcional, si aporta una variante distintiva).

Usar el resultado para validar/ajustar los SVG de los pasos siguientes (los SVG de abajo son la línea base lista para usar si las skills no proponen algo mejor). **No** introducir dependencias nuevas de runtime por esto.

- [ ] **Step 2: Crear el componente `<Logo/>` (glifo monocolor, `currentColor`)**

Create `apps/web/src/components/logo.tsx`:

```tsx
/**
 * Logo de marca "Guía Estudiantil" — birrete (mortarboard) geométrico.
 * El cuerpo usa `currentColor` (controlable por className: ej. `text-accent`),
 * la borla usa el color de acento de marca.
 */
export default function Logo({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			role="img"
			aria-label="Guía Estudiantil"
		>
			<title>Guía Estudiantil</title>
			{/* Tablero del birrete */}
			<path d="M24 7 L45 17 L24 27 L3 17 Z" fill="currentColor" />
			{/* Base del birrete */}
			<path
				d="M14 22.3 L24 27 L34 22.3 L34 32 C34 35.3 29.5 37.5 24 37.5 C18.5 37.5 14 35.3 14 32 Z"
				fill="currentColor"
				opacity="0.55"
			/>
			{/* Borla (acento) */}
			<path
				d="M43 17.5 L43 28"
				stroke="#e59c24"
				strokeWidth="2.2"
				strokeLinecap="round"
			/>
			<circle cx="43" cy="30.5" r="2.6" fill="#e59c24" />
		</svg>
	);
}
```

- [ ] **Step 3: Reemplazar el favicon SVG (app icon a todo color)**

Reemplazar el contenido completo de `apps/web/public/favicon/favicon.svg` por:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect x="4" y="4" width="88" height="88" rx="22" fill="#122135"/>
  <path d="M48 24 L78 39 L48 54 L18 39 Z" fill="#ffffff"/>
  <path d="M34 47 L48 54 L62 47 L62 61 C62 65.5 56 68.5 48 68.5 C40 68.5 34 65.5 34 61 Z" fill="#ffffff" opacity="0.85"/>
  <path d="M75 39.5 L75 58" stroke="#e59c24" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="75" cy="61" r="3.6" fill="#e59c24"/>
</svg>
```

- [ ] **Step 4: Crear `app/icon.svg` (favicon automático de Next.js)**

Create `apps/web/src/app/icon.svg` con el MISMO contenido del paso 3 (Next.js App Router lo sirve automáticamente como `<link rel="icon" type="image/svg+xml">`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect x="4" y="4" width="88" height="88" rx="22" fill="#122135"/>
  <path d="M48 24 L78 39 L48 54 L18 39 Z" fill="#ffffff"/>
  <path d="M34 47 L48 54 L62 47 L62 61 C62 65.5 56 68.5 48 68.5 C40 68.5 34 65.5 34 61 Z" fill="#ffffff" opacity="0.85"/>
  <path d="M75 39.5 L75 58" stroke="#e59c24" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="75" cy="61" r="3.6" fill="#e59c24"/>
</svg>
```

- [ ] **Step 5: (Opcional) Regenerar los PNG del set desde el SVG**

Los PNG actuales (`favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`) y `favicon.ico` son placeholders. El favicon SVG (pasos 3-4) ya cubre los navegadores modernos. Para regenerar los PNG (recomendado pero no bloqueante), si hay un rasterizador disponible:

```bash
# Requiere tener instalado rsvg-convert (librsvg) o ImageMagick.
# Desde apps/web/public/favicon:
rsvg-convert -w 96 -h 96 favicon.svg -o favicon-96x96.png
rsvg-convert -w 180 -h 180 favicon.svg -o apple-touch-icon.png
rsvg-convert -w 192 -h 192 favicon.svg -o web-app-manifest-192x192.png
rsvg-convert -w 512 -h 512 favicon.svg -o web-app-manifest-512x512.png
```

Si NO hay rasterizador disponible en el entorno, dejar los PNG como están (el SVG cubre el favicon) y registrar en el commit que los PNG quedan pendientes de regenerar. NO instalar dependencias pesadas solo para esto.

- [ ] **Step 6: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/components/logo.tsx`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/logo.tsx apps/web/public/favicon/favicon.svg apps/web/src/app/icon.svg
# incluir los PNG si se regeneraron en el paso 5
git commit -m "feat(brand): nuevo logo y favicon (birrete academico moderno)"
```

---

## Task 9: Integrar el logo en navbar, footer y metadata

**Files:**
- Modify: `apps/web/src/components/layout/navbar.tsx`
- Modify: `apps/web/src/components/layout/footer.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/public/favicon/site.webmanifest`

**Interfaces:**
- Consumes: `Logo` (Task 8)

- [ ] **Step 1: Usar `<Logo/>` en el navbar**

In `apps/web/src/components/layout/navbar.tsx`:

1. En el import de `lucide-react`, eliminar `GraduationCap` (queda usado en ningún otro lugar tras este cambio). El import pasa de:

```ts
import {
	BookOpen,
	Calendar,
	GraduationCap,
	LogOut,
	MessageSquare,
	Settings,
	User,
} from "lucide-react";
```

a:

```ts
import {
	BookOpen,
	Calendar,
	LogOut,
	MessageSquare,
	Settings,
	User,
} from "lucide-react";
```

2. Agregar el import del logo después de `import { useAuth } from "@/context/auth-context";`:

```ts
import Logo from "@/components/logo";
```

3. Reemplazar las TRES ocurrencias de:

```tsx
							<GraduationCap className="h-5 w-5 text-accent" />
```

por:

```tsx
							<Logo className="h-5 w-5 text-accent" />
```

(Dos están en `NavbarContent` —versión deshabilitada y versión con `Link`— y una en `NavbarSkeleton`.)

- [ ] **Step 2: Usar `<Logo/>` en el footer**

In `apps/web/src/components/layout/footer.tsx`:

1. Reemplazar el import:

```ts
import { GraduationCap } from "lucide-react";
```

por:

```ts
import Logo from "@/components/logo";
```

2. Reemplazar:

```tsx
							<GraduationCap className="h-6 w-6 text-accent" />
```

por:

```tsx
							<Logo className="h-6 w-6 text-accent" />
```

- [ ] **Step 3: Declarar iconos/manifest en `metadata`**

In `apps/web/src/app/layout.tsx`, reemplazar el objeto `metadata` por:

```ts
export const metadata: Metadata = {
	title: "Guía Estudiantil",
	description: "Planifica tu carrera, pensum, horarios y reseñas.",
	icons: {
		apple: "/favicon/apple-touch-icon.png",
	},
	manifest: "/favicon/site.webmanifest",
};
```

(No declarar `icon` aquí: `app/icon.svg` y `app/favicon.ico` son detectados automáticamente por Next.js; declararlos duplicaría los `<link>`.)

- [ ] **Step 4: Actualizar `site.webmanifest`**

Reemplazar el contenido completo de `apps/web/public/favicon/site.webmanifest` por (nombre de marca + rutas correctas bajo `/favicon/`):

```json
{
	"name": "Guía Estudiantil",
	"short_name": "Guía Estudiantil",
	"icons": [
		{
			"src": "/favicon/web-app-manifest-192x192.png",
			"sizes": "192x192",
			"type": "image/png",
			"purpose": "maskable"
		},
		{
			"src": "/favicon/web-app-manifest-512x512.png",
			"sizes": "512x512",
			"type": "image/png",
			"purpose": "maskable"
		}
	],
	"theme_color": "#122135",
	"background_color": "#122135",
	"display": "standalone"
}
```

- [ ] **Step 5: Type check + lint**

Run: `bun run check-types`
Expected: sin errores.
Run: `bunx biome check apps/web/src/components/layout/navbar.tsx apps/web/src/components/layout/footer.tsx apps/web/src/app/layout.tsx`
Expected: sin errores.

- [ ] **Step 6: Verificación manual**

Abrir `http://localhost:3000/`:
- La navbar y el footer muestran el nuevo logo (birrete) en acento, no el ícono anterior.
- La pestaña del navegador muestra el nuevo favicon (birrete sobre cuadro azul oscuro). Si el navegador cachea el favicon viejo, forzar recarga (Ctrl+F5) o abrir `http://localhost:3000/icon.svg`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/layout/navbar.tsx apps/web/src/components/layout/footer.tsx apps/web/src/app/layout.tsx apps/web/public/favicon/site.webmanifest
git commit -m "feat(brand): integrar logo en navbar/footer y declarar favicon/manifest"
```

---

## Task 10: Verificación integral y cierre

**Files:** ninguno (verificación).

- [ ] **Step 1: Type check global**

Run: `bun run check-types`
Expected: sin errores en todo el monorepo.

- [ ] **Step 2: Lint global del web**

Run: `bunx biome check apps/web/src`
Expected: sin errores.

- [ ] **Step 3: Build de producción (humo)**

Run: `bun run build`
Expected: build exitoso sin errores de tipos/compilación.

- [ ] **Step 4: Recorrido manual de aceptación**

Con `bun run dev:web`, verificar los criterios del spec:
1. Homepage sin cartas UCAB/UNIMET; CTA contextual correcto según sesión/estado.
2. Feature cards enlazan (3) y "Análisis Inteligente" muestra tooltip "Próximamente".
3. Retomar encuesta excluye materias ya reseñadas; progreso muestra total real; panel "ya reseñaste todo" cuando aplica.
4. Cambiar carrera desde encuesta y onboarding reinicia materias y va a onboarding; reseñas previas conservadas.
5. Logo nuevo en navbar/footer y favicon en la pestaña.

- [ ] **Step 5: Resumen final al usuario**

Reportar qué quedó hecho, el resultado del build, y si los PNG del favicon quedaron pendientes de regenerar (si no había rasterizador).

---

## Notas de cierre

- Las reseñas históricas nunca se borran; al cambiar de carrera solo se reinician las materias aprobadas del perfil.
- El favicon SVG (`app/icon.svg`) cubre navegadores modernos aunque los PNG queden sin regenerar.
- Este plan NO incluye pruebas automatizadas por decisión explícita del usuario; toda verificación es manual + `check-types` + `biome` + `build`.
