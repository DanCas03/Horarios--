import {
	ChevronDown,
	Loader2,
	MessageSquare,
	PlusCircle,
	Search,
	Star,
	ThumbsDown,
	ThumbsUp,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseApiError, reviewsAPI, subjectsAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Review {
	_id: string;
	subject_code: string;
	professor_name?: string;
	period: string;
	section?: string;
	difficulty_rating: number;
	professor_rating?: number;
	workload_rating: number;
	would_recommend: boolean;
	comment?: string;
	tips?: string;
	study_strategy?: string;
	is_verified: boolean;
	created_at: string;
}

interface SubjectOption {
	code: string;
	name: string;
}

// ─── Reusable star display ────────────────────────────────────────────────────
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
	return (
		<div className="flex gap-0.5">
			{Array.from({ length: max }, (_, i) => (
				<Star
					key={i}
					size={14}
					className={
						i < value ? "fill-amber-400 text-amber-400" : "text-gray-300"
					}
				/>
			))}
		</div>
	);
}

// ─── Searchable subject combobox ──────────────────────────────────────────────
function SubjectCombobox({
	value,
	onChange,
	options,
}: {
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

	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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
export default function Reviews() {
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
		professor_name: "",
		period: "",
		section: "",
		difficulty_rating: 3,
		professor_rating: 3,
		workload_rating: 3,
		would_recommend: true,
		comment: "",
		tips: "",
		study_strategy: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState("");

	// Load pensum subjects: all (for search) + approved (for form combobox)
	useEffect(() => {
		if (!user?.career_id) return;
		subjectsAPI
			.pensum(user.career_id)
			.then((res) => {
				const approvedCodes = new Set(
					user.approved_subjects?.map((s) => s.subject_code) || [],
				);
				const all: SubjectOption[] = res.data.map((s: any) => ({
					code: s.code,
					name: s.name,
				}));
				const approved: SubjectOption[] = all.filter((s) =>
					approvedCodes.has(s.code),
				);
				setAllSubjects(all);
				setSubjectOptions(approved);
			})
			.catch(() => {});
	}, [user?.career_id, user?.approved_subjects]);

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
					user?.university_id || undefined,
				);
				setReviews(res.data);
			} catch {
				setReviews([]);
			} finally {
				setLoading(false);
			}
		},
		[user?.university_id],
	);

	// Debounced auto-search as the user types
	const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError("");
		setSubmitting(true);
		try {
			await reviewsAPI.create({
				...form,
				university_id: user?.university_id || "",
			});
			setShowForm(false);
			setForm({
				subject_code: "",
				university_id: "",
				professor_name: "",
				period: "",
				section: "",
				difficulty_rating: 3,
				professor_rating: 3,
				workload_rating: 3,
				would_recommend: true,
				comment: "",
				tips: "",
				study_strategy: "",
			});
			if (activeCode) fetchReviews(activeCode);
		} catch (err: any) {
			setFormError(parseApiError(err, "Error al crear reseña"));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-3 font-extrabold text-3xl text-gray-900">
						<MessageSquare className="h-8 w-8 text-primary" />
						Reseñas
					</h1>
					<p className="mt-1 text-gray-500">
						Consulta y comparte opiniones de materias y profesores
					</p>
				</div>
				{user && (
					<button
						onClick={() => {
							setShowForm(!showForm);
							setFormError("");
						}}
						className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary-light"
					>
						{showForm ? <X size={18} /> : <PlusCircle size={18} />}
						{showForm ? "Cancelar" : "Escribir Reseña"}
					</button>
				)}
			</div>

			{/* Search */}
			<div className="mb-6 rounded-2xl bg-white p-6 shadow-md">
				<label className="mb-2 block font-medium text-gray-700 text-sm">
					Buscar reseñas por materia
				</label>
				<div className="flex gap-3">
					<div ref={searchRef} className="relative flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" />
						{loading && (
							<Loader2 className="absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
						)}
						<input
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
							className="w-full rounded-lg border border-gray-300 py-2.5 pr-9 pl-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
						/>

						{/* Suggestions dropdown */}
						{searchOpen && searchSuggestions.length > 0 && (
							<ul className="absolute right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
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
					className="mb-6 space-y-4 rounded-2xl bg-white p-6 shadow-md"
				>
					<h3 className="font-bold text-gray-900 text-lg">Nueva Reseña</h3>

					{formError && (
						<div className="rounded-lg bg-red-50 px-4 py-3 text-red-700 text-sm">
							{formError}
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="mb-1 block font-medium text-gray-700 text-sm">
								Materia *
								{subjectOptions.length > 0 && (
									<span className="ml-1 font-normal text-gray-400 text-xs">
										({subjectOptions.length} cursadas)
									</span>
								)}
							</label>
							<SubjectCombobox
								value={form.subject_code}
								onChange={(code) => setForm({ ...form, subject_code: code })}
								options={subjectOptions}
							/>
						</div>
						<div>
							<label className="mb-1 block font-medium text-gray-700 text-sm">
								Periodo *
							</label>
							<input
								required
								value={form.period}
								onChange={(e) => setForm({ ...form, period: e.target.value })}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="2025-1"
							/>
						</div>
						<div>
							<label className="mb-1 block font-medium text-gray-700 text-sm">
								Profesor
							</label>
							<input
								value={form.professor_name}
								onChange={(e) =>
									setForm({ ...form, professor_name: e.target.value })
								}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="Nombre del profesor"
							/>
						</div>
						<div>
							<label className="mb-1 block font-medium text-gray-700 text-sm">
								Sección
							</label>
							<input
								value={form.section}
								onChange={(e) => setForm({ ...form, section: e.target.value })}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="A, B, 001..."
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						{[
							{ label: "Dificultad", key: "difficulty_rating" as const },
							{ label: "Profesor", key: "professor_rating" as const },
							{ label: "Carga de trabajo", key: "workload_rating" as const },
						].map(({ label, key }) => (
							<div key={key}>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									{label} (1-5)
								</label>
								<input
									type="range"
									min="1"
									max="5"
									value={form[key]}
									onChange={(e) =>
										setForm({ ...form, [key]: Number(e.target.value) })
									}
									className="w-full accent-primary"
								/>
								<p className="text-center font-semibold text-primary text-sm">
									{form[key]}/5
								</p>
							</div>
						))}
					</div>

					<div className="flex items-center gap-3">
						<label className="font-medium text-gray-700 text-sm">
							¿Recomiendas esta materia?
						</label>
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
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Comentario
						</label>
						<textarea
							value={form.comment}
							onChange={(e) => setForm({ ...form, comment: e.target.value })}
							rows={3}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Comparte tu experiencia con la materia..."
						/>
					</div>

					<div>
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Tips / Consejos
						</label>
						<textarea
							value={form.tips}
							onChange={(e) => setForm({ ...form, tips: e.target.value })}
							rows={2}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Consejos para quien vaya a cursar esta materia..."
						/>
					</div>

					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submitting ? "Publicando..." : "Publicar Reseña (Anónima)"}
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
						<div key={r._id} className="rounded-2xl bg-white p-6 shadow-md">
							<div className="mb-3 flex items-start justify-between">
								<div>
									<div className="mb-1 flex items-center gap-2">
										<span className="font-bold text-gray-900">
											{r.subject_code}
										</span>
										{r.is_verified && (
											<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs">
												✓ Verificada
											</span>
										)}
									</div>
									{r.professor_name && (
										<p className="text-gray-500 text-sm">
											Prof. {r.professor_name}
										</p>
									)}
									<p className="text-gray-400 text-xs">
										Periodo: {r.period}
										{r.section && ` | Sección: ${r.section}`}
									</p>
								</div>
								<div className="flex items-center gap-1">
									{r.would_recommend ? (
										<ThumbsUp className="h-5 w-5 text-green-500" />
									) : (
										<ThumbsDown className="h-5 w-5 text-red-500" />
									)}
								</div>
							</div>

							<div className="mb-4 grid grid-cols-3 gap-4">
								<div>
									<p className="mb-1 text-gray-500 text-xs">Dificultad</p>
									<StarRating value={r.difficulty_rating} />
								</div>
								{r.professor_rating != null && (
									<div>
										<p className="mb-1 text-gray-500 text-xs">Profesor</p>
										<StarRating value={r.professor_rating} />
									</div>
								)}
								<div>
									<p className="mb-1 text-gray-500 text-xs">Carga</p>
									<StarRating value={r.workload_rating} />
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
							{r.study_strategy && (
								<div className="rounded-lg bg-blue-50 p-3">
									<p className="mb-1 font-semibold text-blue-700 text-xs">
										📚 Estrategia:
									</p>
									<p className="text-blue-800 text-sm">{r.study_strategy}</p>
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
		</div>
	);
}
