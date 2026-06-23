"use client";

import {
	AlertTriangle,
	Check,
	ChevronDown,
	ClipboardCheck,
	MessageSquare,
	PlusCircle,
	Star,
} from "lucide-react";
import Link from "next/link";
import {
	type ChangeEvent,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	academicProgramsAPI,
	parseApiError,
	periodsAPI,
	reviewsAPI,
	subjectsAPI,
	teachersAPI,
} from "@/api/client";
import SurveyGuard from "@/components/auth/survey-guard";
import ChangeCareerModal from "@/components/encuesta/change-career-modal";
import { useAuth } from "@/context/auth-context";
import { hasProfanity } from "@/lib/profanity";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Period {
	id: string;
	code: string;
	start?: string;
	end?: string;
	termType?: string;
	isActive?: boolean;
}

interface SubjectOption {
	id: string;
	code: string;
	name: string;
}

interface SectionOption {
	id: string;
	code: string;
	teacherIds: string[];
	teachers: string[];
}

interface ReviewFormState {
	id: string; // unique key for React
	subject_code: string;
	period: string;
	sectionId: string;
	teacherIds: string[];
	difficulty_rating: number;
	professor_rating: number;
	workload_rating: number;
	would_recommend: boolean;
	comment: string;
	tips: string;
	study_strategy: string;
	saved: boolean;
	saving: boolean;
	error: string;
	showExtras: boolean;
	fallbackTeacherId?: string;
	notFoundTeacherNames?: string;
}

const formatPeriod = (p: Period) => {
	let label = p.code;
	if (p.termType) label += ` - ${p.termType}`;
	if (p.start && p.end) {
		const startMonth = new Date(p.start).toLocaleDateString("es-ES", {
			month: "long",
		});
		const endMonth = new Date(p.end).toLocaleDateString("es-ES", {
			month: "long",
			year: "numeric",
		});
		label += ` (${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} - ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)})`;
	}
	return label;
};

const createEmptyForm = (defaultPeriodId: string): ReviewFormState => ({
	id: crypto.randomUUID(),
	subject_code: "",
	period: defaultPeriodId,
	sectionId: "",
	teacherIds: [],
	difficulty_rating: 3,
	professor_rating: 3,
	workload_rating: 3,
	would_recommend: true,
	comment: "",
	tips: "",
	study_strategy: "",
	saved: false,
	saving: false,
	error: "",
	showExtras: false,
	fallbackTeacherId: "",
	notFoundTeacherNames: "",
});

// ─── SubjectCombobox ──────────────────────────────────────────────────────────

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

	useEffect(() => {
		setQuery(value);
	}, [value]);

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

	return (
		<div ref={wrapperRef} className="relative">
			<div className="relative">
				<input
					id={id}
					required
					value={query}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						const v = e.target.value.toUpperCase();
						setQuery(v);
						onChange(v);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder={
						options.length > 0 ? "Buscar materia cursada..." : "Ej: MAT-1115"
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
								onMouseDown={() => {
									setQuery(s.code);
									onChange(s.code);
									setOpen(false);
								}}
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
		</div>
	);
}

// ─── TeacherCombobox ──────────────────────────────────────────────────────────

function TeacherCombobox({
	id,
	value,
	onChange,
	options,
}: {
	id?: string;
	value: string;
	onChange: (teacherId: string) => void;
	options: { id: string; name: string }[];
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Find the current selected teacher's name to display
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

	// Filter options based on query
	const filtered = options.filter((t) =>
		t.name.toLowerCase().includes(query.toLowerCase()),
	);

	// "No encuentro mi profe" option
	const specialOption = {
		id: "no-encuentro-profe",
		name: "No encuentro mi profe",
	};

	// Check if special option should be in filtered list
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

// ─── SingleReviewForm ─────────────────────────────────────────────────────────

function SingleReviewForm({
	form,
	index,
	periods,
	subjectOptions,
	allSubjects,
	allTeachers,
	onUpdate,
	onSave,
}: {
	form: ReviewFormState;
	index: number;
	periods: Period[];
	subjectOptions: SubjectOption[];
	allSubjects: SubjectOption[];
	allTeachers: { id: string; name: string }[];
	onUpdate: (id: string, updates: Partial<ReviewFormState>) => void;
	onSave: (id: string) => void;
}) {
	const [sections, setSections] = useState<SectionOption[]>([]);
	const [loadingSections, setLoadingSections] = useState(false);

	const isFallback =
		!loadingSections &&
		!!form.subject_code &&
		!!form.period &&
		sections.length === 0;

	// Load sections when subject/period changes
	useEffect(() => {
		const selectedSub = allSubjects.find((s) => s.code === form.subject_code);
		if (!selectedSub?.id || !form.period) {
			setSections([]);
			onUpdate(form.id, {
				sectionId: "",
				teacherIds: [],
				fallbackTeacherId: "",
				notFoundTeacherNames: "",
			});
			return;
		}

		setLoadingSections(true);
		subjectsAPI
			.sections(selectedSub.id, form.period)
			.then((res) => {
				setSections(res.data as SectionOption[]);
				onUpdate(form.id, {
					sectionId: "",
					teacherIds: [],
					fallbackTeacherId: "",
					notFoundTeacherNames: "",
				});
			})
			.catch((err) => {
				console.error("Error al cargar secciones de la base de datos:", err);
				setSections([]);
				onUpdate(form.id, {
					sectionId: "",
					teacherIds: [],
					fallbackTeacherId: "",
					notFoundTeacherNames: "",
				});
			})
			.finally(() => {
				setLoadingSections(false);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form.subject_code, form.period, allSubjects, onUpdate, form.id]);

	// If saved, show collapsed card
	if (form.saved) {
		return (
			<div className="panel-enter flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-4 ring-1 ring-green-200">
				<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
					<Check size={16} className="text-white" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-green-800 text-sm">
						Reseña de {form.subject_code} guardada
					</p>
				</div>
				<span className="font-mono text-green-600 text-xs">#{index + 1}</span>
			</div>
		);
	}

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSave(form.id);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="panel-enter space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
		>
			{/* Form header */}
			<div className="flex items-center justify-between">
				<h3 className="flex items-center gap-2 font-bold text-gray-900 text-lg tracking-tight">
					<span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-mono text-primary text-xs">
						{index + 1}
					</span>
					Nueva Resena
				</h3>
			</div>

			{form.error && (
				<div className="rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
					{form.error}
				</div>
			)}

			{/* Subject + Period */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label
						htmlFor={`review-subject-${form.id}`}
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
						id={`review-subject-${form.id}`}
						value={form.subject_code}
						onChange={(code) => onUpdate(form.id, { subject_code: code })}
						options={subjectOptions}
					/>
				</div>
				<div>
					<label
						htmlFor={`review-period-${form.id}`}
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						Periodo *
					</label>
					<select
						id={`review-period-${form.id}`}
						required
						value={form.period}
						onChange={(e) => onUpdate(form.id, { period: e.target.value })}
						className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
					>
						{periods.map((p) => (
							<option key={p.id} value={p.id}>
								{formatPeriod(p)}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Section */}
			{isFallback ? (
				<div className="fade-in slide-in-from-top-1 animate-in space-y-4 rounded-xl border border-gray-200 border-dashed bg-gray-50/50 p-4 duration-200">
					<p className="flex items-center gap-1.5 font-semibold text-amber-700 text-xs">
						⚠️ No se encontraron secciones para esta materia en este período.
					</p>

					<div>
						<label
							htmlFor={`fallback-teacher-${form.id}`}
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Buscar Profesor *
						</label>
						<TeacherCombobox
							id={`fallback-teacher-${form.id}`}
							value={form.fallbackTeacherId || ""}
							onChange={(teacherId) => {
								onUpdate(form.id, {
									fallbackTeacherId: teacherId,
									notFoundTeacherNames:
										teacherId === "no-encuentro-profe"
											? form.notFoundTeacherNames
											: "",
								});
							}}
							options={allTeachers}
						/>
					</div>

					{form.fallbackTeacherId === "no-encuentro-profe" && (
						<div className="fade-in slide-in-from-top-1 animate-in duration-200">
							<label
								htmlFor={`not-found-teacher-${form.id}`}
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Nombre completo del profesor *
							</label>
							<input
								id={`not-found-teacher-${form.id}`}
								type="text"
								required
								value={form.notFoundTeacherNames || ""}
								onChange={(e) =>
									onUpdate(form.id, { notFoundTeacherNames: e.target.value })
								}
								placeholder="Escribe el nombre aquí..."
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					)}
				</div>
			) : (
				<div>
					<label
						htmlFor={`review-section-${form.id}`}
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						Seccion / Profesor
					</label>
					<select
						id={`review-section-${form.id}`}
						value={form.sectionId}
						onChange={(e) => {
							const secId = e.target.value;
							const selectedSec = sections.find((s) => s.id === secId);
							onUpdate(form.id, {
								sectionId: secId,
								teacherIds: selectedSec ? selectedSec.teacherIds : [],
							});
						}}
						disabled={loadingSections || !form.subject_code}
						className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
					>
						<option value="">Selecciona una seccion</option>
						{sections.map((s) => (
							<option key={s.id} value={s.id}>
								Seccion {s.code || "Sin codigo"}{" "}
								{s.teachers.length > 0 ? `(${s.teachers.join(", ")})` : ""}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Ratings */}
			<div className="grid grid-cols-3 gap-4">
				{[
					{ label: "Dificultad", key: "difficulty_rating" as const },
					{ label: "Profesor", key: "professor_rating" as const },
					{ label: "Carga", key: "workload_rating" as const },
				].map(({ label, key }) => (
					<div key={key}>
						<label
							htmlFor={`review-rating-${key}-${form.id}`}
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							{label}
						</label>
						<div className="flex items-center gap-1">
							{Array.from({ length: 5 }, (_, i) => (
								<button
									key={i}
									type="button"
									onClick={() => onUpdate(form.id, { [key]: i + 1 })}
									className="transition-transform hover:scale-110 active:scale-95"
								>
									<Star
										size={20}
										className={
											i < form[key]
												? "fill-amber-400 text-amber-400"
												: "text-gray-300"
										}
									/>
								</button>
							))}
						</div>
						<p className="mt-0.5 text-center font-semibold text-primary text-xs">
							{form[key]}/5
						</p>
					</div>
				))}
			</div>

			{/* Recommend */}
			<div className="flex items-center gap-3">
				<span className="font-medium text-gray-700 text-sm">
					Recomiendas esta materia?
				</span>
				<button
					type="button"
					onClick={() =>
						onUpdate(form.id, { would_recommend: !form.would_recommend })
					}
					className={`rounded-lg px-3 py-1 font-semibold text-sm transition-all active:scale-95 ${
						form.would_recommend
							? "bg-green-100 text-green-700 hover:bg-green-200"
							: "bg-red-100 text-red-700 hover:bg-red-200"
					}`}
				>
					{form.would_recommend ? "Si" : "No"}
				</button>
			</div>

			{/* Comment */}
			<div>
				<label
					htmlFor={`review-comment-${form.id}`}
					className="mb-1 block font-medium text-gray-700 text-sm"
				>
					Comentario *
				</label>
				<textarea
					id={`review-comment-${form.id}`}
					required
					value={form.comment}
					onChange={(e) => onUpdate(form.id, { comment: e.target.value })}
					rows={3}
					className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
					placeholder="Comparte tu experiencia con la materia..."
				/>
				<p className="mt-1.5 font-medium text-[11px] text-gray-400 leading-normal">
					🔒 Tu reseña es 100% anónima. Nos ocupamos de tu privacidad. Evita
					insultar o ser malicioso, ya que dañará la encuesta y podría conllevar
					la inhabilitación de tu perfil.
				</p>
			</div>

			{/* Collapsible extras */}
			{!form.showExtras ? (
				<button
					type="button"
					onClick={() => onUpdate(form.id, { showExtras: true })}
					className="flex items-center gap-1 font-medium text-primary text-sm hover:underline"
				>
					<PlusCircle size={14} />
					Agregar tips y estrategia de estudio
				</button>
			) : (
				<div className="space-y-4">
					<div>
						<label
							htmlFor={`review-tips-${form.id}`}
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Tips / Consejos
						</label>
						<textarea
							id={`review-tips-${form.id}`}
							value={form.tips}
							onChange={(e) => onUpdate(form.id, { tips: e.target.value })}
							rows={2}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Consejos para quien vaya a cursar esta materia..."
						/>
					</div>
					<div>
						<label
							htmlFor={`review-strategy-${form.id}`}
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Estrategia de estudio
						</label>
						<textarea
							id={`review-strategy-${form.id}`}
							value={form.study_strategy}
							onChange={(e) =>
								onUpdate(form.id, { study_strategy: e.target.value })
							}
							rows={2}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Como estudiaste para pasarla?"
						/>
					</div>
				</div>
			)}

			{/* Action buttons */}
			<div className="flex flex-col gap-3">
				<button
					type="submit"
					disabled={
						form.saving ||
						!form.subject_code ||
						!form.comment ||
						!form.period ||
						(!isFallback && !form.sectionId) ||
						(isFallback &&
							(!form.fallbackTeacherId ||
								(form.fallbackTeacherId === "no-encuentro-profe" &&
									!form.notFoundTeacherNames?.trim())))
					}
					className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-white shadow-[0_6px_20px_rgba(31,54,83,0.35)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
				>
					{form.saving ? (
						<>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
							Guardando...
						</>
					) : (
						<>Guardar reseña</>
					)}
				</button>
			</div>
		</form>
	);
}

// ─── Main Encuesta Page ───────────────────────────────────────────────────────

function EncuestaContent() {
	const { user, completeSurvey } = useAuth();
	const [forms, setForms] = useState<ReviewFormState[]>([]);
	const [periods, setPeriods] = useState<Period[]>([]);
	const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
	const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
	const [academicProgramName, setAcademicProgramName] = useState("");
	const [allTeachers, setAllTeachers] = useState<
		{ id: string; name: string }[]
	>([]);
	const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(new Set());

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

	const [savedCount, setSavedCount] = useState(0);
	const [surveyDone, setSurveyDone] = useState(false);
	const [finishingError, setFinishingError] = useState("");
	const [finishing, setFinishing] = useState(false);
	const [showUnsavedModal, setShowUnsavedModal] = useState(false);
	const [showChangeCareer, setShowChangeCareer] = useState(false);
	const lastFormRef = useRef<HTMLDivElement>(null);

	const hasUnsavedChanges = useMemo(() => {
		return forms.some(
			(f) =>
				!f.saved &&
				(f.subject_code ||
					f.sectionId ||
					f.comment.trim() ||
					f.tips.trim() ||
					f.study_strategy.trim() ||
					f.difficulty_rating !== 3 ||
					f.professor_rating !== 3 ||
					f.workload_rating !== 3 ||
					!f.would_recommend),
		);
	}, [forms]);

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

	// Load periods from database
	useEffect(() => {
		periodsAPI
			.list(user?.universityIds?.[0] || undefined)
			.then((res) => {
				const fetchedPeriods = res.data as Period[];
				setPeriods(fetchedPeriods);
				// Initialize first form with default period
				if (fetchedPeriods.length > 0) {
					setForms([createEmptyForm(fetchedPeriods[0].id)]);
				} else {
					setForms([createEmptyForm("")]);
				}
			})
			.catch((err) => {
				console.error("Error al cargar períodos de la base de datos:", err);
				setForms([createEmptyForm("")]);
			});
	}, [user?.universityIds]);

	// Load pensum subjects & program name
	useEffect(() => {
		if (!user?.academicProgramIds?.[0]) return;
		const programId = user.academicProgramIds[0];

		subjectsAPI
			.pensum(programId)
			.then((res) => {
				const approvedIds = new Set(
					user.approvedSubjects?.map((s) => s.subjectId) || [],
				);
				const all: SubjectOption[] = (
					res.data as { code: string; name: string; id: string }[]
				).map((s) => ({ id: s.id, code: s.code, name: s.name }));
				const approved = all.filter((s) => approvedIds.has(s.id));
				setAllSubjects(all);
				setSubjectOptions(approved);
			})
			.catch(() => {});

		academicProgramsAPI
			.get(programId)
			.then((res) => {
				const programData = res.data as { name: string };
				setAcademicProgramName(programData.name || "");
			})
			.catch(() => {});
	}, [user?.academicProgramIds, user?.approvedSubjects]);

	const updateForm = useCallback(
		(id: string, updates: Partial<ReviewFormState>) => {
			setForms((prev) =>
				prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
			);
		},
		[],
	);

	const handleSave = useCallback(
		async (formId: string) => {
			const form = forms.find((f) => f.id === formId);
			if (!form) return;

			updateForm(formId, { saving: true, error: "" });

			if (
				hasProfanity(form.comment) ||
				hasProfanity(form.tips) ||
				hasProfanity(form.study_strategy) ||
				hasProfanity(form.notFoundTeacherNames || "")
			) {
				updateForm(formId, {
					saving: false,
					error:
						"El contenido contiene palabras inapropiadas o insultos. Por favor, mantén un tono respetuoso.",
				});
				return;
			}

			try {
				const isFallback = !form.sectionId && !!form.fallbackTeacherId;
				let teacherIds: string[] | undefined;
				if (isFallback) {
					if (
						form.fallbackTeacherId &&
						form.fallbackTeacherId !== "no-encuentro-profe"
					) {
						teacherIds = [form.fallbackTeacherId];
					}
				} else if (form.teacherIds.length > 0) {
					teacherIds = form.teacherIds;
				}

				await reviewsAPI.create({
					subjectCode: form.subject_code,
					universityId: user?.universityIds?.[0] || undefined,
					teacherIds,
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
						isFallback && form.fallbackTeacherId === "no-encuentro-profe"
							? form.notFoundTeacherNames || undefined
							: undefined,
				});

				updateForm(formId, { saved: true, saving: false });
				setSavedCount((c) => c + 1);
				setReviewedCodes((prev) => {
					const next = new Set(prev);
					next.add(form.subject_code);
					return next;
				});

				const defaultPeriod = periods.length > 0 ? periods[0].id : "";
				setForms((prev) => [...prev, createEmptyForm(defaultPeriod)]);
				// Scroll to new form after render
				setTimeout(() => {
					lastFormRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				}, 100);
			} catch (err: unknown) {
				updateForm(formId, {
					saving: false,
					error: parseApiError(err, "Error al crear resena"),
				});
			}
		},
		[forms, user?.universityIds, periods, updateForm],
	);

	const addForm = useCallback(() => {
		const defaultPeriod = periods.length > 0 ? periods[0].id : "";
		setForms((prev) => [...prev, createEmptyForm(defaultPeriod)]);
		setTimeout(() => {
			lastFormRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 100);
	}, [periods]);

	const executeFinish = async () => {
		setFinishingError("");
		setFinishing(true);
		try {
			await completeSurvey();
			setSurveyDone(true);
		} catch (err: unknown) {
			setFinishingError(parseApiError(err, "Error al finalizar la encuesta"));
		} finally {
			setFinishing(false);
		}
	};

	const handleFinish = async () => {
		if (hasUnsavedChanges) {
			setShowUnsavedModal(true);
		} else {
			await executeFinish();
		}
	};

	// Thank you screen
	if (surveyDone) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
				<div className="panel-enter">
					<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100">
						<ClipboardCheck className="h-10 w-10 text-green-600" />
					</div>
					<h1 className="font-extrabold text-2xl text-gray-900 tracking-tight sm:text-3xl">
						Gracias por tu contribucion!
					</h1>
					<p className="mx-auto mt-4 max-w-md text-gray-500">
						Tus resenas ayudaran a otros estudiantes a tomar mejores decisiones.
						Guardaste {savedCount} resena{savedCount !== 1 ? "s" : ""} en esta
						sesion.
					</p>
					<a
						href="/"
						className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]"
					>
						Volver al inicio
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
			{/* Page header */}
			<div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-3 font-extrabold text-2xl text-gray-900 tracking-tight">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<MessageSquare className="h-5 w-5 text-primary" />
						</div>
						Encuesta de Materias
					</h1>
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
				</div>

				{/* Saved counter + finish button */}
				<div className="flex items-center gap-3">
					{reviewedApprovedCount > 0 && (
						<span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700 text-sm">
							{reviewedApprovedCount} resena
							{reviewedApprovedCount !== 1 ? "s" : ""}
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
						{finishing ? (
							<>
								<span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
								Finalizando...
							</>
						) : (
							<>
								<ClipboardCheck size={16} />
								Finalizar encuesta
							</>
						)}
					</button>
				</div>
			</div>

			{finishingError && (
				<div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
					{finishingError}
				</div>
			)}

			{/* Warning when no approved subjects in this program */}
			{subjectOptions.length === 0 && (
				<div className="panel-enter mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-900 shadow-sm backdrop-blur-sm">
					<div className="flex items-start gap-4">
						<div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-800">
							<AlertTriangle size={20} />
						</div>
						<div className="space-y-2">
							<h3 className="font-bold text-amber-900 text-base">
								No tienes materias aprobadas registradas para tu carrera actual
							</h3>
							<p className="text-amber-800/95 text-sm leading-relaxed">
								Para poder realizar la encuesta, necesitas registrar las
								materias que has cursado y aprobado en tu plan de estudios de{" "}
								<strong>{academicProgramName || "tu carrera"}</strong>.
							</p>
							<div className="pt-2">
								<Link
									href="/encuesta/onboarding?edit=true"
									className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-5 py-2 font-semibold text-white text-xs shadow-[0_4px_12px_rgba(217,119,6,0.3)] transition-all hover:bg-amber-700 active:scale-[0.98]"
								>
									+ Modificar materias cursadas
								</Link>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Progress bar */}
			{subjectOptions.length > 0 && (
				<div className="mb-8 rounded-xl bg-primary/5 px-4 py-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-gray-600">
							Has resenado{" "}
							<strong className="text-primary">{reviewedApprovedCount}</strong>{" "}
							de <strong>{subjectOptions.length}</strong> materias aprobadas.
							<Link
								href="/encuesta/onboarding?edit=true"
								className="ml-2.5 font-semibold text-primary text-xs hover:underline"
							>
								+ Modificar materias cursadas
							</Link>
						</span>
						<span className="font-mono text-primary text-xs">
							{subjectOptions.length > 0
								? Math.round(
										(reviewedApprovedCount / subjectOptions.length) * 100,
									)
								: 0}
							%
						</span>
					</div>
					<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
						<div
							className="h-full rounded-full bg-primary transition-all duration-500"
							style={{
								width: `${
									subjectOptions.length > 0
										? Math.min(
												100,
												(reviewedApprovedCount / subjectOptions.length) * 100,
											)
										: 0
								}%`,
							}}
						/>
					</div>
				</div>
			)}

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
						className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-semibold text-sm text-white shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
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

			{/* Unsaved Changes Confirmation Modal */}
			{showUnsavedModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="fade-in zoom-in-95 w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 duration-200">
						<h3 className="font-bold text-gray-900 text-lg">
							¿Finalizar sin guardar?
						</h3>
						<p className="mt-2 text-gray-500 text-sm">
							Tienes reseñas con información sin guardar. ¿Estás seguro de que
							deseas finalizar la encuesta sin guardarlas?
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowUnsavedModal(false)}
								className="rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 text-sm transition-all hover:bg-gray-50 active:scale-95"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => {
									setShowUnsavedModal(false);
									executeFinish();
								}}
								className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white shadow-[0_4px_12px_rgba(220,38,38,0.2)] transition-all hover:bg-red-700 active:scale-95"
							>
								Finalizar sin guardar
							</button>
						</div>
					</div>
				</div>
			)}

			<ChangeCareerModal
				open={showChangeCareer}
				onClose={() => setShowChangeCareer(false)}
			/>
		</div>
	);
}

export default function EncuestaPage() {
	return (
		<SurveyGuard>
			<EncuestaContent />
		</SurveyGuard>
	);
}
