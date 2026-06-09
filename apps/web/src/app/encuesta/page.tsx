"use client";

import {
	Check,
	ChevronDown,
	ChevronUp,
	ClipboardCheck,
	Loader2,
	MessageSquare,
	PlusCircle,
	Star,
} from "lucide-react";
import {
	type ChangeEvent,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import Link from "next/link";
import { parseApiError, periodsAPI, reviewsAPI, subjectsAPI } from "@/api/client";
import SurveyGuard from "@/components/auth/survey-guard";
import { useAuth } from "@/context/auth-context";

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
}

const formatPeriod = (p: Period) => {
	let label = p.code;
	if (p.termType) label += ` - ${p.termType}`;
	if (p.start && p.end) {
		const startMonth = new Date(p.start).toLocaleDateString("es-ES", { month: "long" });
		const endMonth = new Date(p.end).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
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
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
					placeholder={options.length > 0 ? "Buscar materia cursada..." : "Ej: MAT-1115"}
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

// WARNING: Mockup temporales de períodos y profesores
const MOCK_PERIODS: Period[] = [
	{ id: "6666fa07e67b5720f68eaa01", code: "2025-2026/1", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa02", code: "2025-2026/2", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa03", code: "2025-2026/3", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa04", code: "2024-2025/1", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa05", code: "2024-2025/2", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa06", code: "2024-2025/3", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa07", code: "2023-2024/1", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa08", code: "2023-2024/2", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa09", code: "2023-2024/3", termType: "Semestre" },
	{ id: "6666fa07e67b5720f68eaa0a", code: "2022-2023/1", termType: "Semestre" },
];

const MOCK_PROFESSORS = [
	{ id: "6666fa08e67b5720f68eaa11", name: "Prof. Alejandro Silva" },
	{ id: "6666fa08e67b5720f68eaa12", name: "Prof. Beatriz Mendoza" },
	{ id: "6666fa08e67b5720f68eaa13", name: "Prof. Carlos Gutierrez" },
	{ id: "6666fa08e67b5720f68eaa14", name: "Prof. Diana Martinez" },
	{ id: "6666fa08e67b5720f68eaa15", name: "Prof. Eduardo Gomez" },
	{ id: "6666fa08e67b5720f68eaa16", name: "Prof. Fernanda Ruiz" },
	{ id: "6666fa08e67b5720f68eaa17", name: "Prof. Gerardo Ponce" },
	{ id: "6666fa08e67b5720f68eaa18", name: "Prof. Helena Castro" },
	{ id: "6666fa08e67b5720f68eaa19", name: "Prof. Ignacio Ortiz" },
	{ id: "6666fa08e67b5720f68eaa1a", name: "Prof. Julia Delgado" },
	{ id: "6666fa08e67b5720f68eaa1b", name: "Prof. Kevin Salazar" },
	{ id: "6666fa08e67b5720f68eaa1c", name: "Prof. Laura Benitez" },
	{ id: "6666fa08e67b5720f68eaa1d", name: "Prof. Manuel Cardenas" },
	{ id: "6666fa08e67b5720f68eaa1e", name: "Prof. Natalia Flores" },
	{ id: "6666fa08e67b5720f68eaa1f", name: "Prof. Oscar Medina" },
	{ id: "6666fa08e67b5720f68eaa20", name: "Prof. Patricia Herrera" },
	{ id: "6666fa08e67b5720f68eaa21", name: "Prof. Ricardo Soto" },
	{ id: "6666fa08e67b5720f68eaa22", name: "Prof. Sandra Pardo" },
	{ id: "6666fa08e67b5720f68eaa23", name: "Prof. Tomas Aguilar" },
	{ id: "6666fa08e67b5720f68eaa24", name: "Prof. Valeria Mendez" },
];

const hashSubjectCodeToHex = (code: string) => {
	let hash = 0;
	for (let i = 0; i < code.length; i++) {
		hash = code.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash).toString(16).padEnd(14, "0").slice(0, 14);
};

const generateMockSectionId = (subjectCode: string, secNumber: string) => {
	const subjectHex = hashSubjectCodeToHex(subjectCode);
	return `6666fa09${subjectHex}${secNumber.padStart(2, "0")}`;
};

// Generar secciones mock estáticas utilizando los profesores mock
const generateMockSections = (subjectCode: string): SectionOption[] => {
	if (!subjectCode) return [];
	return [
		{
			id: generateMockSectionId(subjectCode, "1"),
			code: "1",
			teacherIds: [MOCK_PROFESSORS[0].id, MOCK_PROFESSORS[1].id],
			teachers: [MOCK_PROFESSORS[0].name, MOCK_PROFESSORS[1].name],
		},
		{
			id: generateMockSectionId(subjectCode, "2"),
			code: "2",
			teacherIds: [MOCK_PROFESSORS[2].id],
			teachers: [MOCK_PROFESSORS[2].name],
		},
		{
			id: generateMockSectionId(subjectCode, "3"),
			code: "3",
			teacherIds: [MOCK_PROFESSORS[3].id, MOCK_PROFESSORS[4].id],
			teachers: [MOCK_PROFESSORS[3].name, MOCK_PROFESSORS[4].name],
		},
		{
			id: generateMockSectionId(subjectCode, "4"),
			code: "4",
			teacherIds: [MOCK_PROFESSORS[5].id],
			teachers: [MOCK_PROFESSORS[5].name],
		},
		{
			id: generateMockSectionId(subjectCode, "5"),
			code: "5",
			teacherIds: [MOCK_PROFESSORS[6].id, MOCK_PROFESSORS[7].id],
			teachers: [MOCK_PROFESSORS[6].name, MOCK_PROFESSORS[7].name],
		},
		{
			id: generateMockSectionId(subjectCode, "6"),
			code: "6",
			teacherIds: [MOCK_PROFESSORS[8].id],
			teachers: [MOCK_PROFESSORS[8].name],
		},
	];
};

// ─── SingleReviewForm ─────────────────────────────────────────────────────────

function SingleReviewForm({
	form,
	index,
	periods,
	subjectOptions,
	allSubjects,
	onUpdate,
	onSave,
}: {
	form: ReviewFormState;
	index: number;
	periods: Period[];
	subjectOptions: SubjectOption[];
	allSubjects: SubjectOption[];
	onUpdate: (id: string, updates: Partial<ReviewFormState>) => void;
	onSave: (id: string) => void;
}) {
	const [sections, setSections] = useState<SectionOption[]>([]);
	const [loadingSections, setLoadingSections] = useState(false);

	// Load sections when subject/period changes (WARNING: Secciones estáticas mock)
	useEffect(() => {
		const selectedSub = allSubjects.find((s) => s.code === form.subject_code);
		if (!selectedSub?.id || !form.period) {
			setSections([]);
			onUpdate(form.id, { sectionId: "", teacherIds: [] });
			return;
		}

		setLoadingSections(true);
		// TODO: Reemplazar por llamada real a base de datos en el futuro.
		// subjectsAPI.sections(selectedSub.id, form.period)
		const mockSec = generateMockSections(form.subject_code);
		setSections(mockSec);
		onUpdate(form.id, { sectionId: "", teacherIds: [] });
		setLoadingSections(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form.subject_code, form.period, allSubjects]);

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
				<label className="font-medium text-gray-700 text-sm">
					Recomiendas esta materia?
				</label>
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
					🔒 Tu reseña es 100% anónima. Nos ocupamos de tu privacidad. Evita insultar o ser malicioso, ya que dañará la encuesta y podría conllevar la inhabilitación de tu perfil.
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
					disabled={form.saving || !form.subject_code || !form.comment || !form.period || !form.sectionId}
					className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-white shadow-[0_6px_20px_rgba(31,54,83,0.35)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
				>
					{form.saving ? (
						<>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
							Guardando...
						</>
					) : (
						<>
							Guardar reseña
						</>
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
	const [savedCount, setSavedCount] = useState(0);
	const [surveyDone, setSurveyDone] = useState(false);
	const [finishingError, setFinishingError] = useState("");
	const [finishing, setFinishing] = useState(false);
	const [showUnsavedModal, setShowUnsavedModal] = useState(false);
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

	// Load periods (WARNING: Períodos estáticos mock)
	useEffect(() => {
		// TODO: Reemplazar por consulta real a la base de datos (periodsAPI.list()) en el futuro
		const fetchedPeriods = MOCK_PERIODS;
		setPeriods(fetchedPeriods);
		// Initialize first form with default period
		if (fetchedPeriods.length > 0) {
			setForms([createEmptyForm(fetchedPeriods[0].id)]);
		} else {
			setForms([createEmptyForm("")]);
		}
	}, []);

	// Load pensum subjects
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
				).map((s) => ({ id: s.id, code: s.code, name: s.name }));
				const approved = all.filter((s) => approvedIds.has(s.id));
				setAllSubjects(all);
				setSubjectOptions(approved);
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
				});

				updateForm(formId, { saved: true, saving: false });
				setSavedCount((c) => c + 1);

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
			setFinishingError(
				parseApiError(err, "Error al finalizar la encuesta"),
			);
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
						Guardaste {savedCount} resena{savedCount !== 1 ? "s" : ""} en total.
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
				</div>

				{/* Saved counter + finish button */}
				<div className="flex items-center gap-3">
					{savedCount > 0 && (
						<span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700 text-sm">
							{savedCount} resena{savedCount !== 1 ? "s" : ""} guardada{savedCount !== 1 ? "s" : ""}
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

			{/* Progress bar */}
			{subjectOptions.length > 0 && (
				<div className="mb-8 rounded-xl bg-primary/5 px-4 py-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-gray-600">
							Has resenado <strong className="text-primary">{savedCount}</strong> de{" "}
							<strong>{subjectOptions.length}</strong> materias aprobadas.
							<Link
								href="/encuesta/onboarding?edit=true"
								className="ml-2.5 font-semibold text-primary text-xs hover:underline"
							>
								+ Modificar materias cursadas
							</Link>
						</span>
						<span className="font-mono text-primary text-xs">
							{subjectOptions.length > 0
								? Math.round((savedCount / subjectOptions.length) * 100)
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
										? Math.min(100, (savedCount / subjectOptions.length) * 100)
										: 0
								}%`,
							}}
						/>
					</div>
				</div>
			)}

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
					className="flex items-center gap-2 rounded-full border-2 border-dashed border-gray-300 px-6 py-3 font-medium text-gray-500 text-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
				>
					<PlusCircle size={18} />
					Agregar otra materia
				</button>
			</div>

			{/* Unsaved Changes Confirmation Modal */}
			{showUnsavedModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
						<h3 className="font-bold text-gray-900 text-lg">
							¿Finalizar sin guardar?
						</h3>
						<p className="mt-2 text-gray-500 text-sm">
							Tienes reseñas con información sin guardar. ¿Estás seguro de que deseas finalizar la encuesta sin guardarlas?
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowUnsavedModal(false)}
								className="rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 text-sm hover:bg-gray-50 active:scale-95 transition-all"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => {
									setShowUnsavedModal(false);
									executeFinish();
								}}
								className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 active:scale-95 transition-all shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
							>
								Finalizar sin guardar
							</button>
						</div>
					</div>
				</div>
			)}
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
