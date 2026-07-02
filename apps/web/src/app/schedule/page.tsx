"use client";

import { motion } from "framer-motion";
import {
	BookMarked,
	BookOpen,
	Calendar,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Loader2,
	MapPin,
	MessageSquare,
	Plus,
	Save,
	Trash2,
	X,
} from "lucide-react";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";
import {
	parseApiError,
	periodsAPI,
	schedulesAPI,
	subjectsAPI,
} from "@/api/client";
import ProtectedRoute from "@/components/auth/protected-route";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import { SmoothAccordion } from "@/components/ui/smooth-accordion";
import SpotlightEffect from "@/components/ui/spotlight-effect";
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScheduleBlock {
	subject_code: string;
	subject_name?: string;
	section: string;
	professor?: string;
	day: string;
	start_time: string;
	end_time: string;
	classroom?: string;
	modality: string;
}

interface Schedule {
	_id: string;
	period: string;
	schedule_type: string;
	blocks: ScheduleBlock[];
	tentative_subjects: {
		subject_code: string;
		subject_name?: string;
		priority: number;
	}[];
	created_at: string;
}

interface AvailableSubject {
	_id: string;
	code: string;
	name: string;
	credits: number;
	semester_suggested: number;
}

interface RawCustomBlock {
	subjectCode?: string;
	subjectName?: string;
	section?: string;
	professor?: string;
	day?: string;
	startTime?: string;
	endTime?: string;
	classroom?: string;
	modality?: string;
	priority?: number;
}

interface RawSchedule {
	id: string;
	period: string;
	scheduleType: string;
	sectionIds?: string[];
	customBlocks?: RawCustomBlock[];
	populatedBlocks?: unknown[];
	createdAt: string;
}

const normalizeSchedule = (raw: RawSchedule): Schedule => ({
	_id: raw.id,
	period: raw.period,
	schedule_type: raw.scheduleType,
	blocks: (raw.scheduleType === "current" ? (raw.customBlocks ?? []) : []).map(
		(b) => ({
			subject_code: b.subjectCode ?? "",
			subject_name: b.subjectName,
			section: b.section ?? "",
			professor: b.professor,
			day: b.day ?? "",
			start_time: b.startTime ?? "",
			end_time: b.endTime ?? "",
			classroom: b.classroom,
			modality: b.modality ?? "presencial",
		}),
	),
	tentative_subjects: (raw.scheduleType === "tentative"
		? (raw.customBlocks ?? [])
		: []
	).map((s) => ({
		subject_code: s.subjectCode ?? "",
		subject_name: s.subjectName,
		priority: s.priority ?? 1,
	})),
	created_at: raw.createdAt,
});

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const DAY_LABELS: Record<string, string> = {
	lunes: "Lun",
	martes: "Mar",
	miercoles: "Mié",
	jueves: "Jue",
	viernes: "Vie",
	sabado: "Sáb",
};

const HOURS = Array.from(
	{ length: 14 },
	(_, i) => `${(7 + i).toString().padStart(2, "0")}:00`,
);

const EMPTY_BLOCK = (): ScheduleBlock => ({
	subject_code: "",
	subject_name: "",
	section: "",
	professor: "",
	day: "lunes",
	start_time: "07:00",
	end_time: "09:00",
	classroom: "",
	modality: "presencial",
});

// ─── Main component ───────────────────────────────────────────────────────────
function ScheduleContent() {
	const { user } = useAuth();
	const [schedules, setSchedules] = useState<Schedule[]>([]);
	const [available, setAvailable] = useState<AvailableSubject[]>([]);
	const [periods, setPeriods] = useState<Period[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"current" | "tentative">(
		"tentative",
	);

	// Tentative state
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [tentativePeriod, setTentativePeriod] = useState("");
	const [savingTentative, setSavingTentative] = useState(false);
	const [tentativeError, setTentativeError] = useState("");

	// Current schedule form state
	const [showCurrentForm, setShowCurrentForm] = useState(false);
	const [currentPeriod, setCurrentPeriod] = useState("");
	const [blocks, setBlocks] = useState<ScheduleBlock[]>([EMPTY_BLOCK()]);
	const [savingCurrent, setSavingCurrent] = useState(false);
	const [currentError, setCurrentError] = useState("");

	// Delete state
	const [deletingId, setDeletingId] = useState<string | null>(null);

	// Expand/collapse for existing schedules
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const schedRes = await schedulesAPI.my();
			setSchedules((schedRes.data as RawSchedule[]).map(normalizeSchedule));

			const periodsRes = await periodsAPI.list();
			const fetchedPeriods = periodsRes.data as Period[];
			setPeriods(fetchedPeriods);
			if (fetchedPeriods.length > 0) {
				setTentativePeriod(fetchedPeriods[0].id);
				setCurrentPeriod(fetchedPeriods[0].id);
			}

			const programId = user?.academicProgramIds?.at(0);
			if (programId) {
				const availRes = await subjectsAPI.available(programId);
				setAvailable(
					(
						availRes.data as {
							id: string;
							code: string;
							name: string;
							credits: number;
							semesterSuggested?: number;
						}[]
					).map((s) => ({
						_id: s.id,
						code: s.code,
						name: s.name,
						credits: s.credits,
						semester_suggested: s.semesterSuggested ?? 0,
					})),
				);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [user?.academicProgramIds]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// ── Tentative handlers ──────────────────────────────────────────────────────
	const toggleSubject = (code: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(code) ? next.delete(code) : next.add(code);
			return next;
		});
	};

	const saveTentative = async () => {
		if (!tentativePeriod.trim()) {
			setTentativeError("Ingresa el período (ej: 2025-1)");
			return;
		}
		if (selected.size === 0) {
			setTentativeError("Selecciona al menos una materia");
			return;
		}
		setTentativeError("");
		setSavingTentative(true);
		try {
			const subjects = [...selected].map((code) => {
				const s = available.find((a) => a.code === code);
				return {
					subjectCode: code,
					subjectName: s?.name ?? code,
					priority: 1,
				};
			});
			await schedulesAPI.createTentative(tentativePeriod.trim(), {
				customBlocks: subjects,
			});
			setSelected(new Set());
			setTentativePeriod("");
			await loadData();
		} catch (err: unknown) {
			setTentativeError(
				parseApiError(err, "Error al guardar la planificación"),
			);
		} finally {
			setSavingTentative(false);
		}
	};

	// ── Current schedule handlers ───────────────────────────────────────────────
	const addBlock = () => setBlocks((b) => [...b, EMPTY_BLOCK()]);
	const removeBlock = (i: number) =>
		setBlocks((b) => b.filter((_, idx) => idx !== i));
	const updateBlock = (i: number, field: keyof ScheduleBlock, value: string) =>
		setBlocks((b) =>
			b.map((bl, idx) => (idx === i ? { ...bl, [field]: value } : bl)),
		);

	const saveCurrentSchedule = async () => {
		if (!currentPeriod.trim()) {
			setCurrentError("Ingresa el período");
			return;
		}
		const validBlocks = blocks.filter(
			(b) => b.subject_code && b.section && b.day && b.start_time && b.end_time,
		);
		if (validBlocks.length === 0) {
			setCurrentError("Agrega al menos un bloque válido");
			return;
		}
		setCurrentError("");
		setSavingCurrent(true);
		try {
			const universityId = user?.universityIds?.[0];
			if (!universityId) {
				setCurrentError(
					"Configura tu universidad en el perfil antes de guardar",
				);
				setSavingCurrent(false);
				return;
			}
			await schedulesAPI.create({
				universityId,
				periodId: currentPeriod.trim(),
				scheduleType: "current",
				customBlocks: validBlocks.map((b) => ({
					subjectCode: b.subject_code,
					subjectName: b.subject_name,
					section: b.section,
					professor: b.professor,
					day: b.day,
					startTime: b.start_time,
					endTime: b.end_time,
					classroom: b.classroom,
					modality: b.modality,
				})),
			});
			setShowCurrentForm(false);
			setBlocks([EMPTY_BLOCK()]);
			setCurrentPeriod("");
			await loadData();
		} catch (err: unknown) {
			setCurrentError(parseApiError(err, "Error al guardar el horario"));
		} finally {
			setSavingCurrent(false);
		}
	};

	const deleteSchedule = async (id: string) => {
		if (!window.confirm("¿Eliminar esta planificación?")) return;
		setDeletingId(id);
		try {
			await schedulesAPI.delete(id);
			setSchedules((s) => s.filter((x) => x._id !== id));
		} catch (err: unknown) {
			alert(parseApiError(err, "Error al eliminar"));
		} finally {
			setDeletingId(null);
		}
	};

	const currentSchedules = schedules.filter(
		(s) => s.schedule_type === "current",
	);
	const tentativeSchedules = schedules.filter(
		(s) => s.schedule_type === "tentative",
	);

	// Group available subjects by semester
	const bySemester = available.reduce(
		(acc, s) => {
			const sem = s.semester_suggested || 0;
			if (!acc[sem]) acc[sem] = [];
			acc[sem].push(s);
			return acc;
		},
		{} as Record<number, AvailableSubject[]>,
	);

	if (loading) {
		return (
			<div className="flex justify-center py-20">
				<div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-12">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm ring-1 ring-black/5">
					<span className="font-semibold text-[10px] text-gray-400 uppercase tracking-[0.2em]">
						Planificación
					</span>
				</div>
				<h1 className="mb-2 font-extrabold text-5xl text-gray-900 tracking-tighter">
					Horarios
				</h1>
				<p className="font-medium text-gray-400">
					Gestiona tu horario actual y planifica los próximos períodos
				</p>
			</div>

			{/* Tabs con píldora deslizante */}
			<div className="mb-8 flex w-fit gap-3 rounded-2xl border border-white/60 bg-white/50 p-1.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-md">
				{(["tentative", "current"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={`relative flex items-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-sm transition-colors duration-300 ${
							activeTab === tab
								? "text-primary"
								: "text-gray-500 hover:bg-white/50 hover:text-gray-900"
						}`}
					>
						{activeTab === tab && (
							<motion.span
								layoutId="schedule-tab-pill"
								className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-none"
								transition={{
									type: "tween",
									duration: 0.4,
									ease: [0.32, 0.72, 0, 1],
								}}
							/>
						)}
						<span className="relative z-10 flex items-center gap-2">
							{tab === "tentative" ? (
								<ClipboardList size={15} />
							) : (
								<Calendar size={15} />
							)}
							{tab === "tentative"
								? "Planificación Tentativa"
								: "Horario Actual"}
						</span>
					</button>
				))}
			</div>

			{/* ═══════════════════════════════════════════════════════════════════════
          TENTATIVE TAB
      ════════════════════════════════════════════════════════════════════════ */}
			{activeTab === "tentative" && (
				<div key="tentative-tab" className="tab-content space-y-6">
					{/* Subject selection panel */}
					{available.length > 0 ? (
						<div className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
							<SpotlightEffect />
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h3 className="font-bold text-gray-900">
										Materias Disponibles
									</h3>
									<p className="mt-0.5 text-gray-400 text-xs">
										{available.length} materia
										{available.length !== 1 ? "s" : ""} con prelaciones
										cumplidas
										{selected.size > 0 && (
											<span className="ml-2 font-semibold text-primary">
												· {selected.size} seleccionada
												{selected.size !== 1 ? "s" : ""}
											</span>
										)}
									</p>
								</div>
								{selected.size > 0 && (
									<button
										type="button"
										onClick={() => setSelected(new Set())}
										className="flex items-center gap-1 text-gray-400 text-xs hover:text-red-500"
									>
										<X size={12} /> Limpiar selección
									</button>
								)}
							</div>

							{Object.entries(bySemester)
								.sort(([a], [b]) => Number(a) - Number(b))
								.map(([sem, semSubjects]) => (
									<div key={sem} className="mb-5">
										<p className="mb-2 font-semibold text-gray-400 text-xs uppercase tracking-wide">
											Semestre {sem}
										</p>
										<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
											{semSubjects.map((s) => {
												const isSelected = selected.has(s.code);
												return (
													<button
														key={s._id}
														type="button"
														onClick={() => toggleSubject(s.code)}
														className={`rounded-xl border-2 p-3 text-left transition-all ${
															isSelected
																? "border-primary bg-primary/5 shadow-sm"
																: "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
														}`}
													>
														<div className="flex items-start justify-between gap-1">
															<p
																className={`font-medium text-sm leading-snug ${
																	isSelected ? "text-primary" : "text-gray-900"
																}`}
															>
																{s.name}
															</p>
															{isSelected && (
																<CheckCircle2
																	size={16}
																	className="mt-0.5 flex-shrink-0 text-primary"
																/>
															)}
														</div>
														<p
															className={`mt-1 text-xs ${isSelected ? "text-primary/70" : "text-gray-400"}`}
														>
															{s.code} · {s.credits} cr.
														</p>
													</button>
												);
											})}
										</div>
									</div>
								))}

							{/* Save panel */}
							<div className="mt-4 border-gray-100 border-t pt-4">
								{tentativeError && (
									<p className="mb-3 text-red-600 text-sm">{tentativeError}</p>
								)}
								<div className="flex flex-wrap items-center gap-3">
									<div className="flex items-center gap-2">
										<label
											htmlFor="tentative-period"
											className="whitespace-nowrap font-medium text-gray-700 text-sm"
										>
											Período:
										</label>
										<select
											id="tentative-period"
											value={tentativePeriod}
											onChange={(e) => setTentativePeriod(e.target.value)}
											className="w-52 appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gray-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08]"
										>
											{periods.map((p) => (
												<option key={p.id} value={p.id}>
													{formatPeriod(p)}
												</option>
											))}
											{periods.length === 0 && (
												<option value={tentativePeriod}>
													{tentativePeriod || "Sin periodos"}
												</option>
											)}
										</select>
									</div>
									<button
										type="button"
										onClick={saveTentative}
										disabled={savingTentative || selected.size === 0}
										className="group flex items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 font-semibold text-sm text-white shadow-[0_4px_14px_rgba(31,54,83,0.35)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
									>
										{savingTentative ? (
											<Loader2 size={14} className="animate-spin" />
										) : (
											<Save size={14} />
										)}
										{savingTentative
											? "Guardando..."
											: `Guardar planificación${selected.size > 0 ? ` (${selected.size})` : ""}`}
									</button>
								</div>
							</div>
						</div>
					) : user?.academicProgramIds ? (
						<div className="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-sm ring-1 ring-black/5">
							<BookMarked className="mx-auto mb-3 h-12 w-12 opacity-40" />
							<p className="font-medium">No hay materias disponibles</p>
							<p className="mt-1 text-sm">
								Aprueba materias en tu pensum para desbloquear las siguientes
							</p>
						</div>
					) : (
						<div className="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-sm ring-1 ring-black/5">
							<BookMarked className="mx-auto mb-3 h-12 w-12 opacity-40" />
							<p className="font-medium">Configura tu programa primero</p>
							<p className="mt-1 text-sm">
								Ve a tu perfil y selecciona universidad y programa académico
							</p>
						</div>
					)}

					{/* Saved tentative schedules */}
					{tentativeSchedules.length > 0 && (
						<div>
							<h3 className="mb-3 font-bold text-gray-900">
								Mis Planificaciones Guardadas
							</h3>
							<div className="space-y-3">
								{tentativeSchedules.map((sched) => (
									<TentativeScheduleCard
										key={sched._id}
										schedule={sched}
										isExpanded={expandedId === sched._id}
										onToggle={() =>
											setExpandedId(expandedId === sched._id ? null : sched._id)
										}
										onDelete={() => deleteSchedule(sched._id)}
										deleting={deletingId === sched._id}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* ═══════════════════════════════════════════════════════════════════════
          CURRENT SCHEDULE TAB
      ════════════════════════════════════════════════════════════════════════ */}
			{activeTab === "current" && (
				<div key="current-tab" className="tab-content space-y-6">
					{/* Add new schedule button */}
					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => setShowCurrentForm(!showCurrentForm)}
							className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(31,54,83,0.35)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,54,83,0.45)] active:scale-95"
						>
							{showCurrentForm ? <X size={16} /> : <Plus size={16} />}
							{showCurrentForm ? "Cancelar" : "Registrar horario actual"}
						</button>
					</div>

					{/* New schedule form */}
					{showCurrentForm && (
						<div className="panel-enter rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
							<h3 className="mb-4 font-bold text-gray-900">Nuevo Horario</h3>

							{currentError && (
								<div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-red-700 text-sm">
									{currentError}
								</div>
							)}

							<div className="mb-5 flex items-center gap-3">
								<label
									htmlFor="current-period"
									className="font-medium text-gray-700 text-sm"
								>
									Período:
								</label>
								<select
									id="current-period"
									value={currentPeriod}
									onChange={(e) => setCurrentPeriod(e.target.value)}
									className="w-52 appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gray-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08]"
								>
									{periods.map((p) => (
										<option key={p.id} value={p.id}>
											{formatPeriod(p)}
										</option>
									))}
									{periods.length === 0 && (
										<option value={currentPeriod}>
											{currentPeriod || "Sin periodos"}
										</option>
									)}
								</select>
							</div>

							{/* Blocks */}
							<div className="mb-4 space-y-3">
								{blocks.map((block, i) => (
									<BlockRow
										key={i}
										index={i}
										block={block}
										onChange={updateBlock}
										onRemove={removeBlock}
										canRemove={blocks.length > 1}
									/>
								))}
							</div>

							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={addBlock}
									className="flex items-center gap-1.5 text-primary text-sm hover:underline"
								>
									<Plus size={14} /> Añadir bloque
								</button>
								<button
									type="button"
									onClick={saveCurrentSchedule}
									disabled={savingCurrent}
									className="group ml-auto flex items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 font-semibold text-sm text-white shadow-[0_4px_14px_rgba(31,54,83,0.35)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:opacity-50"
								>
									{savingCurrent ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<Save size={14} />
									)}
									{savingCurrent ? "Guardando..." : "Guardar horario"}
								</button>
							</div>
						</div>
					)}

					{/* Existing current schedules */}
					{currentSchedules.length > 0
						? currentSchedules.map((sched) => (
								<CurrentScheduleCard
									key={sched._id}
									schedule={sched}
									isExpanded={expandedId === sched._id}
									onToggle={() =>
										setExpandedId(expandedId === sched._id ? null : sched._id)
									}
									onDelete={() => deleteSchedule(sched._id)}
									deleting={deletingId === sched._id}
								/>
							))
						: !showCurrentForm && (
								<div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
									<Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
									<h3 className="mb-2 font-bold text-gray-900 text-xl tracking-tight">
										Sin horario actual
									</h3>
									<p className="mb-6 font-medium text-gray-500">
										Registra los bloques de tus clases de este período para
										verlos en la grilla.
									</p>
								</div>
							)}
				</div>
			)}

			{/* Acciones rápidas (UI_prompts/menuBotton.md) */}
			<FloatingActionMenu
				actions={[
					{ label: "Ver pensum", href: "/pensum" as Route, Icon: BookOpen },
					{
						label: "Ver reseñas",
						href: "/reviews" as Route,
						Icon: MessageSquare,
					},
					{
						label: "Actualizar encuesta",
						href: "/encuesta" as Route,
						Icon: ClipboardList,
					},
				]}
			/>
		</div>
	);
}

// ─── Tentative schedule card ──────────────────────────────────────────────────
function TentativeScheduleCard({
	schedule,
	isExpanded,
	onToggle,
	onDelete,
	deleting,
}: {
	schedule: Schedule;
	isExpanded: boolean;
	onToggle: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	return (
		<div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
			<div className="flex items-center gap-3 px-5 py-3.5">
				<button
					type="button"
					onClick={onToggle}
					className="flex flex-1 items-center gap-3 text-left"
				>
					<BookMarked size={18} className="flex-shrink-0 text-primary" />
					<div>
						<span className="font-semibold text-gray-900">
							Período {schedule.period}
						</span>
						<span className="ml-2 text-gray-400 text-sm">
							· {schedule.tentative_subjects.length} materia
							{schedule.tentative_subjects.length !== 1 ? "s" : ""}
						</span>
					</div>
					<ChevronDown
						size={16}
						className={`ml-auto text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? "rotate-180" : "rotate-0"}`}
					/>
				</button>
				<button
					type="button"
					onClick={onDelete}
					disabled={deleting}
					className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
				>
					{deleting ? (
						<Loader2 size={15} className="animate-spin" />
					) : (
						<Trash2 size={15} />
					)}
				</button>
			</div>

			<SmoothAccordion isOpen={isExpanded}>
				<div className="accordion-content border-gray-50 border-t px-5 pt-1 pb-5">
					<div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
						{schedule.tentative_subjects.map((ts, i) => (
							<div
								key={i}
								className="flex items-center gap-2 rounded-xl bg-primary/[0.04] p-3 ring-1 ring-primary/8"
							>
								<CheckCircle2
									size={14}
									className="flex-shrink-0 text-primary"
								/>
								<div>
									<p className="font-medium text-gray-900 text-sm leading-tight">
										{ts.subject_name || ts.subject_code}
									</p>
									<p className="text-gray-400 text-xs">{ts.subject_code}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</SmoothAccordion>
		</div>
	);
}

// ─── Current schedule card with weekly grid ───────────────────────────────────
const HOURS_DISPLAY = Array.from(
	{ length: 14 },
	(_, i) => `${(7 + i).toString().padStart(2, "0")}:00`,
);
const dayColorMap: Record<string, string> = {
	lunes: "bg-blue-100 border-blue-300 text-blue-800",
	martes: "bg-green-100 border-green-300 text-green-800",
	miercoles: "bg-purple-100 border-purple-300 text-purple-800",
	jueves: "bg-orange-100 border-orange-300 text-orange-800",
	viernes: "bg-pink-100 border-pink-300 text-pink-800",
	sabado: "bg-teal-100 border-teal-300 text-teal-800",
};

function CurrentScheduleCard({
	schedule,
	isExpanded,
	onToggle,
	onDelete,
	deleting,
}: {
	schedule: Schedule;
	isExpanded: boolean;
	onToggle: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	const activeDays = [
		"lunes",
		"martes",
		"miercoles",
		"jueves",
		"viernes",
		"sabado",
	].filter((d) => schedule.blocks.some((b) => b.day === d));

	return (
		<div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
			<div className="flex items-center gap-3 px-6 py-4">
				<button
					type="button"
					onClick={onToggle}
					className="flex flex-1 items-center gap-3 text-left"
				>
					<Calendar size={18} className="flex-shrink-0 text-primary" />
					<div>
						<span className="font-bold text-gray-900">
							Período {schedule.period}
						</span>
						<span className="ml-2 text-gray-400 text-sm">
							· {schedule.blocks.length} bloque
							{schedule.blocks.length !== 1 ? "s" : ""}
						</span>
					</div>
					<ChevronDown
						size={16}
						className={`ml-auto text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? "rotate-180" : "rotate-0"}`}
					/>
				</button>
				<button
					type="button"
					onClick={onDelete}
					disabled={deleting}
					className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
				>
					{deleting ? (
						<Loader2 size={15} className="animate-spin" />
					) : (
						<Trash2 size={15} />
					)}
				</button>
			</div>

			<SmoothAccordion isOpen={isExpanded && schedule.blocks.length > 0}>
				<div className="accordion-content border-gray-100 border-t px-6 pt-1 pb-5">
					<div className="mt-4 overflow-x-auto">
						<div style={{ minWidth: `${activeDays.length * 120 + 60}px` }}>
							{/* Header */}
							<div
								className={"mb-1 grid gap-1"}
								style={{
									gridTemplateColumns: `60px repeat(${activeDays.length}, 1fr)`,
								}}
							>
								<div className="py-1 text-center font-medium text-gray-400 text-xs">
									Hora
								</div>
								{activeDays.map((d) => (
									<div
										key={d}
										className="py-1 text-center font-semibold text-gray-700 text-xs capitalize"
									>
										{DAY_LABELS[d] ?? d}
									</div>
								))}
							</div>
							{/* Time rows */}
							{HOURS_DISPLAY.map((hour) => {
								const hasBlock = activeDays.some((d) =>
									schedule.blocks.some(
										(b) =>
											b.day === d && b.start_time <= hour && b.end_time > hour,
									),
								);
								if (!hasBlock) return null;
								return (
									<div
										key={hour}
										className="mb-1 grid gap-1"
										style={{
											gridTemplateColumns: `60px repeat(${activeDays.length}, 1fr)`,
										}}
									>
										<div className="pt-1 pr-2 text-right text-gray-400 text-xs">
											{hour}
										</div>
										{activeDays.map((day) => {
											const block = schedule.blocks.find(
												(b) =>
													b.day === day &&
													b.start_time <= hour &&
													b.end_time > hour,
											);
											if (block && block.start_time === hour) {
												return (
													<div
														key={day}
														className={`rounded-lg border p-1.5 text-xs ${
															dayColorMap[day] || "bg-gray-100"
														}`}
													>
														<p className="truncate font-bold">
															{block.subject_code}
														</p>
														{block.subject_name && (
															<p className="truncate opacity-80">
																{block.subject_name}
															</p>
														)}
														<p className="truncate opacity-70">
															{block.section}
														</p>
														{block.classroom && (
															<p className="mt-0.5 flex items-center gap-0.5 opacity-60">
																<MapPin size={9} /> {block.classroom}
															</p>
														)}
													</div>
												);
											}
											if (block) {
												return (
													<div
														key={day}
														className={`rounded-lg border ${dayColorMap[day] || "bg-gray-100"} opacity-20`}
													/>
												);
											}
											return (
												<div
													key={day}
													className="min-h-[2rem] rounded-lg bg-gray-50"
												/>
											);
										})}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</SmoothAccordion>
		</div>
	);
}

// ─── Block row for the current schedule form ──────────────────────────────────
function BlockRow({
	index,
	block,
	onChange,
	onRemove,
	canRemove,
}: {
	index: number;
	block: ScheduleBlock;
	onChange: (i: number, field: keyof ScheduleBlock, value: string) => void;
	onRemove: (i: number) => void;
	canRemove: boolean;
}) {
	const sel =
		"px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none bg-white transition-colors";
	const inp =
		"px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none w-full transition-colors";

	return (
		<div className="rounded-xl bg-gray-50 p-3">
			<div className="mb-2 flex items-center gap-1">
				<span className="font-semibold text-gray-500 text-xs">
					Bloque {index + 1}
				</span>
				{canRemove && (
					<button
						type="button"
						onClick={() => onRemove(index)}
						className="ml-auto text-gray-400 hover:text-red-500"
					>
						<X size={13} />
					</button>
				)}
			</div>
			<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
				<div>
					<label
						htmlFor={`current-block-subject-code-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Código *
					</label>
					<input
						id={`current-block-subject-code-${index}`}
						value={block.subject_code}
						onChange={(e) =>
							onChange(index, "subject_code", e.target.value.toUpperCase())
						}
						placeholder="MAT-1115"
						className={inp}
					/>
				</div>
				<div>
					<label
						htmlFor={`current-block-subject-name-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Nombre
					</label>
					<input
						id={`current-block-subject-name-${index}`}
						value={block.subject_name ?? ""}
						onChange={(e) => onChange(index, "subject_name", e.target.value)}
						placeholder="Matemáticas I"
						className={inp}
					/>
				</div>
				<div>
					<label
						htmlFor={`current-block-section-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Sección *
					</label>
					<input
						id={`current-block-section-${index}`}
						value={block.section}
						onChange={(e) => onChange(index, "section", e.target.value)}
						placeholder="A1"
						className={inp}
					/>
				</div>
				<div>
					<label
						htmlFor={`current-block-professor-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Profesor
					</label>
					<input
						id={`current-block-professor-${index}`}
						value={block.professor ?? ""}
						onChange={(e) => onChange(index, "professor", e.target.value)}
						placeholder="Nombre"
						className={inp}
					/>
				</div>
				<div>
					<label
						htmlFor={`current-block-day-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Día *
					</label>
					<select
						id={`current-block-day-${index}`}
						value={block.day}
						onChange={(e) => onChange(index, "day", e.target.value)}
						className={sel}
					>
						{DAYS.map((d) => (
							<option key={d} value={d}>
								{DAY_LABELS[d] ?? d}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor={`current-block-start-time-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Inicio *
					</label>
					<select
						id={`current-block-start-time-${index}`}
						value={block.start_time}
						onChange={(e) => onChange(index, "start_time", e.target.value)}
						className={sel}
					>
						{HOURS.map((h) => (
							<option key={h} value={h}>
								{h}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor={`current-block-end-time-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Fin *
					</label>
					<select
						id={`current-block-end-time-${index}`}
						value={block.end_time}
						onChange={(e) => onChange(index, "end_time", e.target.value)}
						className={sel}
					>
						{HOURS.map((h) => (
							<option key={h} value={h}>
								{h}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor={`current-block-classroom-${index}`}
						className="mb-0.5 block text-gray-500 text-xs"
					>
						Aula
					</label>
					<input
						id={`current-block-classroom-${index}`}
						value={block.classroom ?? ""}
						onChange={(e) => onChange(index, "classroom", e.target.value)}
						placeholder="Aula 305"
						className={inp}
					/>
				</div>
			</div>
		</div>
	);
}

export default function SchedulePage() {
	return (
		<ProtectedRoute>
			<ScheduleContent />
		</ProtectedRoute>
	);
}
