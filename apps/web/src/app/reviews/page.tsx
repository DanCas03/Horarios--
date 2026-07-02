"use client";

import {
	BookOpen,
	Calendar,
	ChevronDown,
	ClipboardList,
	Loader2,
	MessageSquare,
	PlusCircle,
	Search,
	ThumbsDown,
	ThumbsUp,
	X,
} from "lucide-react";
import type { Route } from "next";
import {
	type ChangeEvent,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	parseApiError,
	periodsAPI,
	reviewsAPI,
	subjectsAPI,
	teachersAPI,
} from "@/api/client";
import ProtectedRoute from "@/components/auth/protected-route";
import {
	isTeacherPickerValid,
	TeacherPicker,
} from "@/components/reviews/teacher-picker";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import {
	formatRating,
	StarRatingDisplay,
	StarRatingInput,
} from "@/components/ui/star-rating";
import { useAuth } from "@/context/auth-context";

interface Period {
	id: string;
	code: string;
	start?: string;
	end?: string;
	termType?: string;
	isActive?: boolean;
}

const formatPeriod = (p: Period) => {
	let label = p.code;
	if (p.termType) {
		label += ` - ${p.termType}`;
	}
	if (p.start && p.end) {
		const startMonth = new Date(p.start).toLocaleDateString("es-ES", {
			month: "long",
		});
		const endMonth = new Date(p.end).toLocaleDateString("es-ES", {
			month: "long",
			year: "numeric",
		});
		const capStart = startMonth.charAt(0).toUpperCase() + startMonth.slice(1);
		const capEnd = endMonth.charAt(0).toUpperCase() + endMonth.slice(1);
		label += ` (${capStart} - ${capEnd})`;
	}
	return label;
};

interface Review {
	id: string;
	subjectCode: string;
	professorName?: string;
	period: string;
	section?: string;
	periodId?: string;
	sectionId?: string;
	teacherIds?: string[];
	ratings: { category: string; value: number }[];
	wouldRecommend: boolean;
	comment: string;
	tips?: string;
	studyStrategy?: string;
	isVerified: boolean;
	createdAt: string;
}

interface SubjectOption {
	id: string;
	code: string;
	name: string;
}

// ─── Searchable subject combobox ──────────────────────────────────────────────
function SubjectCombobox({
	id,
	value,
	onChange,
	options,
}: {
	id?: string;
	value: string;
	onChange: (code: string) => void;
	options: SubjectOption[];
}) {
	const [query, setQuery] = useState(value);
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Sync external value
	useEffect(() => {
		setQuery(value);
	}, [value]);

	// Close on outside click
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

	const filtered = options.filter(
		(s) =>
			s.code.toLowerCase().includes(query.toLowerCase()) ||
			s.name.toLowerCase().includes(query.toLowerCase()),
	);

	const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value.toUpperCase();
		setQuery(v);
		onChange(v);
		setOpen(true);
	};

	const handleSelect = (code: string) => {
		setQuery(code);
		onChange(code);
		setOpen(false);
	};

	return (
		<div ref={wrapperRef} className="relative">
			<div className="relative">
				<input
					id={id}
					required
					value={query}
					onChange={handleInput}
					onFocus={() => setOpen(true)}
					placeholder={
						options.length > 0
							? "Buscar por código o nombre..."
							: "Ej: MAT-1115"
					}
					className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				<ChevronDown
					size={15}
					className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400"
				/>
			</div>

			{open && filtered.length > 0 && (
				<ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
					{filtered.map((s) => (
						<li key={s.code}>
							<button
								type="button"
								onMouseDown={() => handleSelect(s.code)}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
							>
								<span className="flex-shrink-0 font-mono font-semibold text-primary">
									{s.code}
								</span>
								<span className="truncate text-gray-500">{s.name}</span>
							</button>
						</li>
					))}
				</ul>
			)}

			{open && query.length > 0 && filtered.length === 0 && (
				<div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-400 text-sm shadow-lg">
					No se encontraron materias — se usará el código ingresado
				</div>
			)}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
function ReviewsContent() {
	const { user } = useAuth();

	// Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);
	const [activeCode, setActiveCode] = useState(""); // code being searched
	const searchRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Results state
	const [reviews, setReviews] = useState<Review[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	// Form state
	const [showForm, setShowForm] = useState(false);
	const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
	const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
	const [form, setForm] = useState({
		subject_code: "",
		university_id: "",
		period: "",
		sectionId: "",
		teacherIds: [] as string[],
		difficulty_rating: 3,
		professor_rating: 3,
		workload_rating: 3,
		would_recommend: true,
		comment: "",
		tips: "",
		study_strategy: "",
		fallbackTeacherId: "",
		notFoundTeacherNames: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState("");

	const [periods, setPeriods] = useState<Period[]>([]);
	const [allTeachers, setAllTeachers] = useState<
		{ id: string; name: string }[]
	>([]);

	// Load all teachers from database
	useEffect(() => {
		teachersAPI
			.list()
			.then((res) => {
				setAllTeachers(res.data as { id: string; name: string }[]);
			})
			.catch((err) => {
				console.error("Error al cargar profesores de la base de datos:", err);
			});
	}, []);

	// Load periods
	useEffect(() => {
		periodsAPI
			.list()
			.then((res) => {
				const fetchedPeriods = res.data as Period[];
				setPeriods(fetchedPeriods);
				if (fetchedPeriods.length > 0) {
					setForm((prev) => ({ ...prev, period: fetchedPeriods[0].id }));
				}
			})
			.catch(() => {});
	}, []);

	// Load pensum subjects: all (for search) + approved (for form combobox)
	useEffect(() => {
		if (!user?.academicProgramIds?.[0]) return;
		subjectsAPI
			.pensum(user.academicProgramIds[0])
			.then((res) => {
				const approvedIds = new Set(
					user.approvedSubjects?.map((s) => s.subjectId) || [],
				);
				const all: SubjectOption[] = (
					res.data as { code: string; name: string; id: string }[]
				).map((s) => ({
					id: s.id,
					code: s.code,
					name: s.name,
				}));
				const approved: SubjectOption[] = (
					res.data as { code: string; name: string; id: string }[]
				)
					.filter((s) => approvedIds.has(s.id))
					.map((s) => ({ id: s.id, code: s.code, name: s.name }));
				setAllSubjects(all);
				setSubjectOptions(approved);
			})
			.catch(() => {});
	}, [user?.academicProgramIds, user?.approvedSubjects]);

	// Close search dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setSearchOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// Subjects matching the current search query
	const searchSuggestions =
		searchQuery.trim().length > 0
			? allSubjects.filter(
					(s) =>
						s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
						s.name.toLowerCase().includes(searchQuery.toLowerCase()),
				)
			: [];

	const fetchReviews = useCallback(
		async (code: string) => {
			if (!code.trim()) return;
			setLoading(true);
			setHasSearched(true);
			setActiveCode(code.trim().toUpperCase());
			try {
				const res = await reviewsAPI.bySubject(
					code.trim(),
					user?.universityIds?.[0] || undefined,
				);
				setReviews(res.data);
			} catch {
				setReviews([]);
			} finally {
				setLoading(false);
			}
		},
		[user?.universityIds],
	);

	// Debounced auto-search as the user types
	const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.toUpperCase();
		setSearchQuery(value);
		setSearchOpen(true);

		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (value.trim().length >= 3) {
			debounceRef.current = setTimeout(() => {
				fetchReviews(value);
				setSearchOpen(false);
			}, 500);
		}
	};

	const handleSelectSuggestion = (code: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		setSearchQuery(code);
		setSearchOpen(false);
		fetchReviews(code);
	};

	const handleSearch = () => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		setSearchOpen(false);
		fetchReviews(searchQuery);
	};

	const handleSubmitReview = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormError("");
		setSubmitting(true);
		try {
			await reviewsAPI.create({
				subjectCode: form.subject_code,
				universityId: user?.universityIds?.[0] || undefined,
				teacherIds: form.teacherIds.length > 0 ? form.teacherIds : undefined,
				periodId: form.period || undefined,
				sectionId: form.sectionId || undefined,
				ratings: [
					{ category: "difficulty", value: form.difficulty_rating },
					{ category: "professor", value: form.professor_rating },
					{ category: "workload", value: form.workload_rating },
				],
				wouldRecommend: form.would_recommend,
				comment: form.comment,
				tips: form.tips || undefined,
				studyStrategy: form.study_strategy || undefined,
				notFoundTeacherNames:
					form.fallbackTeacherId === "no-encuentro-profe"
						? form.notFoundTeacherNames || undefined
						: undefined,
			});
			setShowForm(false);
			setForm({
				subject_code: "",
				university_id: "",
				period: periods.length > 0 ? periods[0].id : "",
				sectionId: "",
				teacherIds: [],
				difficulty_rating: 3,
				professor_rating: 3,
				workload_rating: 3,
				would_recommend: true,
				comment: "",
				tips: "",
				study_strategy: "",
				fallbackTeacherId: "",
				notFoundTeacherNames: "",
			});
			if (activeCode) fetchReviews(activeCode);
		} catch (err: unknown) {
			setFormError(parseApiError(err, "Error al crear reseña"));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-10 flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-4 font-extrabold text-4xl text-gray-900 tracking-tight">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
							<MessageSquare className="h-6 w-6 text-primary" />
						</div>
						Reseñas
					</h1>
					<p className="mt-3 font-medium text-gray-500">
						Consulta y comparte opiniones de materias y profesores
					</p>
				</div>
				{user && (
					<button
						type="button"
						onClick={() => {
							setShowForm(!showForm);
							setFormError("");
						}}
						className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-[0_4px_14px_0_rgba(31,54,83,0.39)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(31,54,83,0.23)] active:scale-95"
					>
						{showForm ? <X size={18} /> : <PlusCircle size={18} />}
						{showForm ? "Cancelar" : "Escribir Reseña"}
					</button>
				)}
			</div>

			{/* Search */}
			<div className="mb-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
				<label
					htmlFor="search-reviews"
					className="mb-3 block font-semibold text-gray-900 text-sm tracking-tight"
				>
					Buscar reseñas por materia
				</label>
				<div className="flex gap-3">
					<div ref={searchRef} className="relative flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" />
						{loading && (
							<Loader2 className="absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
						)}
						<input
							id="search-reviews"
							type="text"
							value={searchQuery}
							onChange={handleSearchInput}
							onFocus={() => setSearchOpen(true)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder={
								allSubjects.length > 0
									? "Buscar por código o nombre de materia..."
									: "Ej: MAT-1115"
							}
							className="w-full rounded-xl border border-gray-200 bg-white/50 py-3 pr-9 pl-11 outline-none transition-all duration-300 hover:border-gray-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
						/>

						{/* Suggestions dropdown */}
						{searchOpen && searchSuggestions.length > 0 && (
							<ul className="absolute right-0 left-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
								{searchSuggestions.map((s) => (
									<li key={s.code}>
										<button
											type="button"
											onMouseDown={() => handleSelectSuggestion(s.code)}
											className="flex w-full items-center gap-3 border-gray-50 border-b px-4 py-2.5 text-left text-sm last:border-0 hover:bg-primary/5"
										>
											<span className="flex-shrink-0 rounded bg-primary/10 px-2 py-0.5 font-bold font-mono text-primary text-xs">
												{s.code}
											</span>
											<span className="truncate text-gray-600">{s.name}</span>
										</button>
									</li>
								))}
							</ul>
						)}

						{/* No results hint */}
						{searchOpen &&
							searchQuery.trim().length >= 2 &&
							searchSuggestions.length === 0 &&
							allSubjects.length > 0 && (
								<div className="absolute right-0 left-0 z-30 mt-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-400 text-sm shadow-xl">
									Sin coincidencias en tu pensum — puedes buscar igual
									presionando Buscar
								</div>
							)}
					</div>

					<button
						type="button"
						onClick={handleSearch}
						disabled={loading || !searchQuery.trim()}
						className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
					>
						Buscar
					</button>
				</div>

				{/* Active search label */}
				{activeCode && !loading && (
					<p className="mt-3 flex items-center gap-1.5 text-gray-400 text-xs">
						Mostrando resultados para
						<span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary">
							{activeCode}
						</span>
						<button
							type="button"
							aria-label="Limpiar búsqueda"
							onClick={() => {
								setSearchQuery("");
								setActiveCode("");
								setReviews([]);
								setHasSearched(false);
							}}
							className="ml-1 text-gray-400 hover:text-red-500"
						>
							<X size={12} />
						</button>
					</p>
				)}
			</div>

			{/* Review Form */}
			{showForm && (
				<form
					onSubmit={handleSubmitReview}
					className="panel-enter mb-8 space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5"
				>
					<h3 className="font-bold text-gray-900 text-xl tracking-tight">
						Nueva Reseña
					</h3>

					{formError && (
						<div className="rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
							{formError}
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label
								htmlFor="review-subject"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Materia *
								{subjectOptions.length > 0 && (
									<span className="ml-1 font-normal text-gray-400 text-xs">
										({subjectOptions.length} cursadas)
									</span>
								)}
							</label>
							<SubjectCombobox
								id="review-subject"
								value={form.subject_code}
								onChange={(code) => setForm({ ...form, subject_code: code })}
								options={subjectOptions}
							/>
						</div>
						<div>
							<label
								htmlFor="review-period"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Periodo *
							</label>
							<select
								id="review-period"
								required
								value={form.period}
								onChange={(e) => setForm({ ...form, period: e.target.value })}
								className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							>
								{periods.map((p) => (
									<option key={p.id} value={p.id}>
										{formatPeriod(p)}
									</option>
								))}
								{periods.length === 0 && (
									<option value={form.period}>
										{form.period || "Sin periodos"}
									</option>
								)}
							</select>
						</div>
						<div>
							<label
								htmlFor="review-teacher"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Profesor *
							</label>
							<TeacherPicker
								id="review-teacher"
								subjectId={
									allSubjects.find((s) => s.code === form.subject_code)?.id
								}
								periodId={form.period}
								allTeachers={allTeachers}
								value={{
									sectionId: form.sectionId,
									teacherIds: form.teacherIds,
									fallbackTeacherId: form.fallbackTeacherId || "",
									notFoundTeacherNames: form.notFoundTeacherNames || "",
								}}
								onChange={(updates) =>
									setForm((prev) => ({ ...prev, ...updates }))
								}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
						{[
							{ label: "Dificultad", key: "difficulty_rating" as const },
							{ label: "Profesor", key: "professor_rating" as const },
							{ label: "Carga de trabajo", key: "workload_rating" as const },
						].map(({ label, key }) => (
							<div
								key={key}
								className="flex items-center justify-between gap-3 sm:block"
							>
								<span className="block font-medium text-gray-700 text-sm sm:mb-1.5">
									{label}
								</span>
								<div className="flex items-center gap-2">
									<StarRatingInput
										value={form[key]}
										onChange={(v) => setForm({ ...form, [key]: v })}
										label={label}
									/>
									<span className="min-w-9 text-right font-semibold text-primary text-xs tabular-nums">
										{formatRating(form[key])}/5
									</span>
								</div>
							</div>
						))}
					</div>

					<div className="flex items-center gap-3">
						<span className="font-medium text-gray-700 text-sm">
							¿Recomiendas esta materia?
						</span>
						<button
							type="button"
							onClick={() =>
								setForm({ ...form, would_recommend: !form.would_recommend })
							}
							className={`rounded-lg px-3 py-1 font-semibold text-sm ${
								form.would_recommend
									? "bg-green-100 text-green-700 hover:bg-green-200"
									: "bg-red-100 text-red-700 hover:bg-red-200"
							}`}
						>
							{form.would_recommend ? "👍 Sí" : "👎 No"}
						</button>
					</div>

					<div>
						<label
							htmlFor="review-comment"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Comentario *
						</label>
						<textarea
							id="review-comment"
							required
							value={form.comment}
							onChange={(e) => setForm({ ...form, comment: e.target.value })}
							rows={3}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Comparte tu experiencia con la materia..."
						/>
					</div>

					<div>
						<label
							htmlFor="review-tips"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Tips / Consejos
						</label>
						<textarea
							id="review-tips"
							value={form.tips}
							onChange={(e) => setForm({ ...form, tips: e.target.value })}
							rows={2}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Consejos para quien vaya a cursar esta materia..."
						/>
					</div>

					<div>
						<label
							htmlFor="review-study-strategy"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Estrategia de estudio
						</label>
						<textarea
							id="review-study-strategy"
							value={form.study_strategy}
							onChange={(e) =>
								setForm({ ...form, study_strategy: e.target.value })
							}
							rows={2}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="¿Cómo estudiaste para pasarla?"
						/>
					</div>

					<button
						type="submit"
						disabled={
							submitting ||
							!isTeacherPickerValid({
								sectionId: form.sectionId,
								teacherIds: form.teacherIds,
								fallbackTeacherId: form.fallbackTeacherId || "",
								notFoundTeacherNames: form.notFoundTeacherNames || "",
							})
						}
						className="group flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 font-semibold text-white shadow-[0_6px_20px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
					>
						{submitting ? (
							<>
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
								Publicando...
							</>
						) : (
							<>
								Publicar Reseña (Anónima)
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-white/15">
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
										<title>Flecha de publicación</title>
										<path
											d="M2 10L10 2M10 2H4M10 2V8"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</span>
							</>
						)}
					</button>
				</form>
			)}

			{/* Results */}
			{loading ? (
				<div className="flex justify-center py-10">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			) : reviews.length > 0 ? (
				<div className="space-y-4">
					<p className="text-gray-500 text-sm">
						{reviews.length} reseña(s) para <strong>{activeCode}</strong>
					</p>
					{reviews.map((r) => (
						<div key={r.id} className="rounded-2xl bg-white p-6 shadow-md">
							<div className="mb-3 flex items-start justify-between">
								<div>
									<div className="mb-1 flex items-center gap-2">
										<span className="font-bold text-gray-900">
											{r.subjectCode}
										</span>
										{r.isVerified && (
											<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs">
												✓ Verificada
											</span>
										)}
									</div>
									{r.professorName && (
										<p className="text-gray-500 text-sm">
											Prof. {r.professorName}
										</p>
									)}
									<p className="mt-1 text-gray-400 text-xs">
										Periodo: {r.period}
										{r.section && ` • Sección: ${r.section}`}
									</p>
								</div>
								<div className="flex items-center gap-1">
									{r.wouldRecommend ? (
										<ThumbsUp className="h-5 w-5 text-green-500" />
									) : (
										<ThumbsDown className="h-5 w-5 text-red-500" />
									)}
								</div>
							</div>

							<div className="mb-4 grid grid-cols-3 gap-4">
								<div>
									<p className="mb-1 text-gray-500 text-xs">Dificultad</p>
									<StarRatingDisplay
										value={
											r.ratings?.find((rt) => rt.category === "difficulty")
												?.value || 0
										}
									/>
								</div>
								{r.ratings?.some((rt) => rt.category === "professor") && (
									<div>
										<p className="mb-1 text-gray-500 text-xs">Profesor</p>
										<StarRatingDisplay
											value={
												r.ratings?.find((rt) => rt.category === "professor")
													?.value || 0
											}
										/>
									</div>
								)}
								<div>
									<p className="mb-1 text-gray-500 text-xs">Carga</p>
									<StarRatingDisplay
										value={
											r.ratings?.find((rt) => rt.category === "workload")
												?.value || 0
										}
									/>
								</div>
							</div>

							{r.comment && (
								<p className="mb-3 text-gray-700 text-sm">{r.comment}</p>
							)}
							{r.tips && (
								<div className="mb-2 rounded-lg bg-amber-50 p-3">
									<p className="mb-1 font-semibold text-amber-700 text-xs">
										💡 Tips:
									</p>
									<p className="text-amber-800 text-sm">{r.tips}</p>
								</div>
							)}
							{r.studyStrategy && (
								<div className="rounded-lg bg-blue-50 p-3">
									<p className="mb-1 font-semibold text-blue-700 text-xs">
										📚 Estrategia:
									</p>
									<p className="text-blue-800 text-sm">{r.studyStrategy}</p>
								</div>
							)}
						</div>
					))}
				</div>
			) : hasSearched && !loading ? (
				<div className="py-10 text-center text-gray-400">
					<MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
					<p>
						No se encontraron reseñas para <strong>{activeCode}</strong>
					</p>
					<p className="mt-1 text-sm">Sé el primero en dejar una reseña</p>
				</div>
			) : null}

			{/* Acciones rápidas (UI_prompts/menuBotton.md) */}
			<FloatingActionMenu
				actions={[
					{
						label: "Reseñar en la encuesta",
						href: "/encuesta" as Route,
						Icon: ClipboardList,
					},
					{ label: "Ver pensum", href: "/pensum" as Route, Icon: BookOpen },
					{
						label: "Armar horario",
						href: "/schedule" as Route,
						Icon: Calendar,
					},
				]}
			/>
		</div>
	);
}

export default function ReviewsPage() {
	return (
		<ProtectedRoute>
			<ReviewsContent />
		</ProtectedRoute>
	);
}
