"use client";

import {
	BookOpen,
	Check,
	CheckCircle,
	Edit,
	Layers,
	Loader2,
	Plus,
	Search,
	Settings,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
	academicProgramsAPI,
	academicUnitsAPI,
	parseApiError,
	studyPlanSubjectsAPI,
	studyPlansAPI,
	subjectsAPI,
	universitiesAPI,
} from "@/api/client";
import ProtectedRoute from "@/components/auth/protected-route";

interface University {
	id: string;
	name: string;
}

interface AcademicProgram {
	id: string;
	name: string;
	totalTerms?: number;
}

interface StudyPlan {
	id: string;
	name: string;
	isActive: boolean;
	academicProgramId: string;
}

interface PlanSubject {
	id: string;
	studyPlanId: string;
	subjectId: string;
	suggestedTerm: number;
	prerequisiteIds: string[];
	corequisiteIds: string[];
	code: string;
	name: string;
	credits: number;
	modality: string;
	subjectType: string;
}

interface Subject {
	id: string;
	code: string;
	name: string;
	credits: number;
	modality: string;
	subjectType: string;
	academicUnitId?: string | null;
	description?: string | null;
	isActive: boolean;
}

interface AcademicUnit {
	id: string;
	name: string;
	code?: string | null;
	isExtracurricular: boolean;
	parentId?: string | null;
	universityId: string;
}

type TabType = "plans" | "subjects" | "units";

function AdminContent() {
	// --- Navegación por pestañas ---
	const [activeTab, setActiveTab] = useState<TabType>("plans");

	// --- Estados de datos ---
	const [universities, setUniversities] = useState<University[]>([]);
	const [selectedUniId, setSelectedUniId] = useState<string>("");

	const [programs, setPrograms] = useState<AcademicProgram[]>([]);
	const [selectedProgId, setSelectedProgId] = useState<string>("");

	const [plans, setPlans] = useState<StudyPlan[]>([]);
	const [selectedPlanId, setSelectedPlanId] = useState<string>("");

	const [planSubjects, setPlanSubjects] = useState<PlanSubject[]>([]);
	const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
	const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);

	// --- Estados de carga y error ---
	const [loadingUnis, setLoadingUnis] = useState(true);
	const [loadingProgs, setLoadingProgs] = useState(false);
	const [loadingPlans, setLoadingPlans] = useState(false);
	const [loadingSubjects, setLoadingSubjects] = useState(false);
	const [loadingUnits, setLoadingUnits] = useState(false);

	// --- Filtros locales ---
	const [subjectSearchFilter, setSubjectSearchFilter] = useState("");
	const [unitSearchFilter, setUnitSearchFilter] = useState("");

	// --- Estados de Modales ---
	// 1. Modal Planes de Estudio
	const [showPlanModal, setShowPlanModal] = useState(false);
	const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
	const [planName, setPlanName] = useState("");
	const [planIsActive, setPlanIsActive] = useState(false);
	const [savingPlan, setSavingPlan] = useState(false);

	// 2. Modal Asignar Materia a Plan
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [editingAssign, setEditingAssign] = useState<PlanSubject | null>(null);
	const [searchSubjectTerm, setSearchSubjectTerm] = useState("");
	const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
	const [suggestedTerm, setSuggestedTerm] = useState<number>(1);
	const [prereqIds, setPrereqIds] = useState<string[]>([]);
	const [savingAssign, setSavingAssign] = useState(false);

	// 3. Modal CRUD de Materia (General)
	const [showSubjectModal, setShowSubjectModal] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
	const [subCode, setSubCode] = useState("");
	const [subName, setSubName] = useState("");
	const [subCredits, setSubCredits] = useState<number>(3);
	const [subModality, setSubModality] = useState("Presencial");
	const [subType, setSubType] = useState("Asignatura");
	const [subUnitId, setSubUnitId] = useState("");
	const [subDesc, setSubDesc] = useState("");
	const [subIsActive, setSubIsActive] = useState(true);
	const [savingSubject, setSavingSubject] = useState(false);

	// 4. Modal CRUD de Unidad Académica
	const [showUnitModal, setShowUnitModal] = useState(false);
	const [editingUnit, setEditingUnit] = useState<AcademicUnit | null>(null);
	const [unitName, setUnitName] = useState("");
	const [unitCode, setUnitCode] = useState("");
	const [unitParentId, setUnitParentId] = useState("");
	const [unitIsExtra, setUnitIsExtra] = useState(false);
	const [savingUnit, setSavingUnit] = useState(false);

	// --- Cargar Universidades ---
	useEffect(() => {
		universitiesAPI
			.list()
			.then((res) => {
				setUniversities(res.data);
				if (res.data.length > 0) {
					setSelectedUniId(res.data[0].id);
				}
			})
			.catch((err) =>
				alert(parseApiError(err, "Error al cargar universidades")),
			)
			.finally(() => setLoadingUnis(false));
	}, []);

	// --- Cargar Programas Académicos cuando cambia la universidad ---
	useEffect(() => {
		if (!selectedUniId) {
			setPrograms([]);
			setSelectedProgId("");
			return;
		}
		setLoadingProgs(true);
		academicProgramsAPI
			.list(selectedUniId)
			.then((res) => {
				setPrograms(res.data);
				if (res.data.length > 0) {
					setSelectedProgId(res.data[0].id);
				} else {
					setSelectedProgId("");
				}
			})
			.catch((err) => alert(parseApiError(err, "Error al cargar programas")))
			.finally(() => setLoadingProgs(false));
	}, [selectedUniId]);

	// --- Cargar Unidades Académicas cuando cambia la universidad ---
	const loadAcademicUnits = useCallback(async () => {
		if (!selectedUniId) {
			setAcademicUnits([]);
			return;
		}
		setLoadingUnits(true);
		try {
			const res = await academicUnitsAPI.list(selectedUniId);
			setAcademicUnits(res.data);
		} catch (err) {
			console.error("Error al cargar unidades académicas", err);
		} finally {
			setLoadingUnits(false);
		}
	}, [selectedUniId]);

	useEffect(() => {
		loadAcademicUnits();
	}, [loadAcademicUnits]);

	// --- Cargar Planes de Estudio cuando cambia el programa ---
	useEffect(() => {
		if (!selectedProgId) {
			setPlans([]);
			setSelectedPlanId("");
			return;
		}
		setLoadingPlans(true);
		studyPlansAPI
			.list(selectedProgId)
			.then((res) => {
				setPlans(res.data);
				if (res.data.length > 0) {
					const active = res.data.find((p: StudyPlan) => p.isActive);
					setSelectedPlanId(active ? active.id : res.data[0].id);
				} else {
					setSelectedPlanId("");
				}
			})
			.catch((err) => alert(parseApiError(err, "Error al cargar planes")))
			.finally(() => setLoadingPlans(false));
	}, [selectedProgId]);

	// --- Cargar Materias del Plan y materias generales ---
	const loadSubjectsData = useCallback(async () => {
		if (!selectedUniId) return;
		setLoadingSubjects(true);
		try {
			const allSubRes = await subjectsAPI.list({
				university_id: selectedUniId,
			});
			setAllSubjects(allSubRes.data);

			if (selectedPlanId) {
				const planSubRes = await studyPlanSubjectsAPI.list(selectedPlanId);
				setPlanSubjects(planSubRes.data);
			} else {
				setPlanSubjects([]);
			}
		} catch (err) {
			console.error("Error al cargar materias", err);
		} finally {
			setLoadingSubjects(false);
		}
	}, [selectedPlanId, selectedUniId]);

	useEffect(() => {
		loadSubjectsData();
	}, [loadSubjectsData]);

	// --- CRUD Planes de Estudio ---
	const handleSavePlan = async () => {
		if (!planName.trim()) return;
		setSavingPlan(true);
		try {
			if (editingPlan) {
				await studyPlansAPI.update(editingPlan.id, {
					name: planName,
					isActive: planIsActive,
				});
			} else {
				await studyPlansAPI.create({
					name: planName,
					academicProgramId: selectedProgId,
					isActive: planIsActive,
				});
			}
			const res = await studyPlansAPI.list(selectedProgId);
			setPlans(res.data);
			if (!editingPlan && res.data.length > 0) {
				setSelectedPlanId(res.data[res.data.length - 1].id);
			} else if (editingPlan) {
				const updated = res.data.find(
					(p: StudyPlan) => p.id === editingPlan.id,
				);
				if (updated?.isActive) {
					setSelectedPlanId(updated.id);
				}
			}
			setShowPlanModal(false);
			setEditingPlan(null);
			setPlanName("");
			setPlanIsActive(false);
		} catch (err) {
			alert(parseApiError(err, "Error al guardar plan"));
		} finally {
			setSavingPlan(false);
		}
	};

	const handleDeletePlan = async (id: string) => {
		if (
			!confirm(
				"¿Estás seguro de eliminar este plan de estudio y todas sus asignaciones?",
			)
		)
			return;
		try {
			await studyPlansAPI.delete(id);
			const res = await studyPlansAPI.list(selectedProgId);
			setPlans(res.data);
			if (selectedPlanId === id) {
				setSelectedPlanId(res.data.length > 0 ? res.data[0].id : "");
			}
		} catch (err) {
			alert(parseApiError(err, "Error al eliminar plan"));
		}
	};

	const handleToggleActivePlan = async (plan: StudyPlan) => {
		if (plan.isActive) return;
		try {
			await studyPlansAPI.update(plan.id, { isActive: true });
			const res = await studyPlansAPI.list(selectedProgId);
			setPlans(res.data);
			setSelectedPlanId(plan.id);
		} catch (err) {
			alert(parseApiError(err, "Error al activar plan"));
		}
	};

	// --- Asignación de Materias a Planes ---
	const handleOpenAssignModal = (term: number) => {
		setEditingAssign(null);
		setSelectedSubject(null);
		setSuggestedTerm(term);
		setPrereqIds([]);
		setSearchSubjectTerm("");
		setShowAssignModal(true);
	};

	const handleOpenEditAssignModal = (ps: PlanSubject) => {
		setEditingAssign(ps);
		const baseSub = allSubjects.find((s) => s.id === ps.subjectId);
		setSelectedSubject(baseSub || null);
		setSuggestedTerm(ps.suggestedTerm);
		setPrereqIds(ps.prerequisiteIds || []);
		setSearchSubjectTerm("");
		setShowAssignModal(true);
	};

	const handleSaveAssignment = async () => {
		if (!selectedSubject || suggestedTerm <= 0) return;
		setSavingAssign(true);
		try {
			if (editingAssign) {
				await studyPlanSubjectsAPI.update(editingAssign.id, {
					suggestedTerm,
					prerequisiteIds: prereqIds,
				});
			} else {
				await studyPlanSubjectsAPI.assign({
					studyPlanId: selectedPlanId,
					subjectId: selectedSubject.id,
					suggestedTerm,
					prerequisiteIds: prereqIds,
				});
			}
			const res = await studyPlanSubjectsAPI.list(selectedPlanId);
			setPlanSubjects(res.data);
			setShowAssignModal(false);
		} catch (err) {
			alert(parseApiError(err, "Error al guardar asignación"));
		} finally {
			setSavingAssign(false);
		}
	};

	const handleDeleteAssignment = async (psId: string) => {
		if (!confirm("¿Quitar esta materia del plan de estudio?")) return;
		try {
			await studyPlanSubjectsAPI.delete(psId);
			const res = await studyPlanSubjectsAPI.list(selectedPlanId);
			setPlanSubjects(res.data);
		} catch (err) {
			alert(parseApiError(err, "Error al desasignar materia"));
		}
	};

	// --- CRUD Materias (Subjects) ---
	const handleOpenCreateSubjectModal = () => {
		setEditingSubject(null);
		setSubCode("");
		setSubName("");
		setSubCredits(3);
		setSubModality("Presencial");
		setSubType("Asignatura");
		setSubUnitId(academicUnits.length > 0 ? academicUnits[0].id : "");
		setSubDesc("");
		setSubIsActive(true);
		setShowSubjectModal(true);
	};

	const handleOpenEditSubjectModal = (sub: Subject) => {
		setEditingSubject(sub);
		setSubCode(sub.code);
		setSubName(sub.name);
		setSubCredits(sub.credits);
		setSubModality(sub.modality || "Presencial");
		setSubType(sub.subjectType || "Asignatura");
		setSubUnitId(sub.academicUnitId || "");
		setSubDesc(sub.description || "");
		setSubIsActive(sub.isActive);
		setShowSubjectModal(true);
	};

	const handleSaveSubject = async () => {
		if (!subCode.trim() || !subName.trim() || subCredits < 0) return;
		setSavingSubject(true);
		try {
			if (editingSubject) {
				await subjectsAPI.update(editingSubject.id, {
					code: subCode,
					name: subName,
					credits: subCredits,
					modality: subModality,
					subjectType: subType,
					academicUnitId: subUnitId || null,
					description: subDesc || null,
					isActive: subIsActive,
				});
			} else {
				await subjectsAPI.create({
					code: subCode,
					name: subName,
					universityId: selectedUniId,
					credits: subCredits,
					modality: subModality,
					subjectType: subType,
					academicUnitId: subUnitId || undefined,
					description: subDesc || undefined,
				});
			}
			await loadSubjectsData();
			setShowSubjectModal(false);
		} catch (err) {
			alert(parseApiError(err, "Error al guardar materia"));
		} finally {
			setSavingSubject(false);
		}
	};

	const handleDeleteSubject = async (id: string) => {
		if (
			!confirm(
				"¿Estás seguro de eliminar esta materia? Se eliminará también de todos los planes de estudio en los que esté asignada.",
			)
		)
			return;
		try {
			await subjectsAPI.delete(id);
			await loadSubjectsData();
		} catch (err) {
			alert(parseApiError(err, "Error al eliminar materia"));
		}
	};

	// --- CRUD Unidades Académicas ---
	const handleOpenCreateUnitModal = () => {
		setEditingUnit(null);
		setUnitName("");
		setUnitCode("");
		setUnitParentId("");
		setUnitIsExtra(false);
		setShowUnitModal(true);
	};

	const handleOpenEditUnitModal = (unit: AcademicUnit) => {
		setEditingUnit(unit);
		setUnitName(unit.name);
		setUnitCode(unit.code || "");
		setUnitParentId(unit.parentId || "");
		setUnitIsExtra(unit.isExtracurricular);
		setShowUnitModal(true);
	};

	const handleSaveUnit = async () => {
		if (!unitName.trim()) return;
		setSavingUnit(true);
		try {
			if (editingUnit) {
				await academicUnitsAPI.update(editingUnit.id, {
					name: unitName,
					code: unitCode || null,
					parentId: unitParentId || null,
					isExtracurricular: unitIsExtra,
				});
			} else {
				await academicUnitsAPI.create({
					name: unitName,
					code: unitCode || undefined,
					universityId: selectedUniId,
					parentId: unitParentId || null,
					isExtracurricular: unitIsExtra,
				});
			}
			await loadAcademicUnits();
			setShowUnitModal(false);
		} catch (err) {
			alert(parseApiError(err, "Error al guardar unidad académica"));
		} finally {
			setSavingUnit(false);
		}
	};

	const handleDeleteUnit = async (id: string) => {
		if (
			!confirm(
				"¿Estás seguro de eliminar esta unidad académica? Se desasociarán las materias y subunidades dependientes.",
			)
		)
			return;
		try {
			await academicUnitsAPI.delete(id);
			await loadAcademicUnits();
		} catch (err) {
			alert(parseApiError(err, "Error al eliminar unidad académica"));
		}
	};

	// --- Filtros y búsquedas en pantalla ---
	const filteredSearchSubjects = allSubjects
		.filter((sub) => {
			const alreadyAssigned = planSubjects.some(
				(ps) => ps.subjectId === sub.id && ps.id !== editingAssign?.id,
			);
			if (alreadyAssigned) return false;

			const term = searchSubjectTerm.toLowerCase();
			return (
				sub.name.toLowerCase().includes(term) ||
				sub.code.toLowerCase().includes(term)
			);
		})
		.slice(0, 5);

	const subjectsFilteredList = allSubjects.filter((sub) => {
		const term = subjectSearchFilter.toLowerCase();
		return (
			sub.name.toLowerCase().includes(term) ||
			sub.code.toLowerCase().includes(term) ||
			sub.subjectType.toLowerCase().includes(term)
		);
	});

	const unitsFilteredList = academicUnits.filter((unit) => {
		const term = unitSearchFilter.toLowerCase();
		return (
			unit.name.toLowerCase().includes(term) ||
			unit.code?.toLowerCase().includes(term)
		);
	});

	// --- Estructura curricular por semestres ---
	const selectedProg = programs.find((p) => p.id === selectedProgId);
	const totalTerms = selectedProg?.totalTerms || 10;
	const termsArray = Array.from({ length: totalTerms }, (_, i) => i + 1);

	const subjectsByTerm = planSubjects.reduce(
		(acc, ps) => {
			const term = ps.suggestedTerm || 1;
			if (!acc[term]) acc[term] = [];
			acc[term].push(ps);
			return acc;
		},
		{} as Record<number, PlanSubject[]>,
	);

	return (
		<div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm ring-1 ring-black/5">
						<Settings className="h-3.5 w-3.5 animate-spin-slow text-accent" />
						<span className="font-semibold text-[10px] text-gray-400 uppercase tracking-[0.25em]">
							Administración
						</span>
					</div>
					<h1 className="font-extrabold text-4xl text-gray-900 tracking-tighter sm:text-5xl">
						Panel de Control
					</h1>
					<p className="mt-2 text-gray-500">
						Administra planes de estudio, materias y unidades académicas.
					</p>
				</div>
			</div>

			{/* Pestañas de navegación */}
			<div className="mb-8 flex gap-2 border-gray-100 border-b">
				{[
					{ id: "plans" as TabType, label: "Planes de Estudio" },
					{ id: "subjects" as TabType, label: "Materias (Subjects)" },
					{ id: "units" as TabType, label: "Unidades Académicas" },
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`border-b-2 px-4 py-2.5 font-extrabold text-sm tracking-tight transition-all ${
							activeTab === tab.id
								? "border-primary text-primary"
								: "border-transparent text-gray-400 hover:text-gray-600"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* ========================================================================= */}
			{/* PESTAÑA: Planes de Estudio (Curricular Grid)                             */}
			{/* ========================================================================= */}
			{activeTab === "plans" && (
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
					{/* Columna Izquierda: Selectores (4 Cols) */}
					<div className="space-y-6 lg:col-span-4">
						<div className="rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
							<div className="space-y-5 rounded-[calc(2rem-0.5rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
								<h3 className="flex items-center gap-2 font-bold text-gray-900 tracking-tight">
									<Layers size={18} className="text-primary" />
									Estructura
								</h3>

								{/* Universidad */}
								<div className="space-y-1.5">
									<label
										htmlFor="university-select"
										className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider"
									>
										Universidad
									</label>
									{loadingUnis ? (
										<Loader2 size={16} className="animate-spin text-gray-400" />
									) : (
										<select
											id="university-select"
											value={selectedUniId}
											onChange={(e) => setSelectedUniId(e.target.value)}
											className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-semibold text-gray-700 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
										>
											{universities.map((uni) => (
												<option key={uni.id} value={uni.id}>
													{uni.name}
												</option>
											))}
										</select>
									)}
								</div>

								{/* Programa Académico */}
								<div className="space-y-1.5">
									<label
										htmlFor="program-select"
										className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider"
									>
										Carrera / Programa
									</label>
									{loadingProgs ? (
										<div className="flex items-center gap-2 py-2 text-gray-400 text-sm">
											<Loader2 size={14} className="animate-spin" />
											Cargando programas...
										</div>
									) : (
										<select
											id="program-select"
											value={selectedProgId}
											onChange={(e) => setSelectedProgId(e.target.value)}
											disabled={programs.length === 0}
											className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-semibold text-gray-700 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
										>
											{programs.length === 0 ? (
												<option value="">No hay programas disponibles</option>
											) : (
												programs.map((prog) => (
													<option key={prog.id} value={prog.id}>
														{prog.name}
													</option>
												))
											)}
										</select>
									)}
								</div>
							</div>
						</div>

						{/* Planes de Estudio */}
						{selectedProgId && (
							<div className="rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
								<div className="rounded-[calc(2rem-0.5rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
									<div className="mb-4 flex items-center justify-between">
										<h3 className="flex items-center gap-2 font-bold text-gray-900 tracking-tight">
											<BookOpen size={18} className="text-accent" />
											Planes de Estudio
										</h3>
										<button
											type="button"
											onClick={() => {
												setEditingPlan(null);
												setPlanName("");
												setPlanIsActive(false);
												setShowPlanModal(true);
											}}
											className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all hover:scale-105 active:scale-95"
											title="Crear nuevo plan"
										>
											<Plus size={16} />
										</button>
									</div>

									{loadingPlans ? (
										<div className="flex justify-center py-6">
											<Loader2
												size={24}
												className="animate-spin text-primary"
											/>
										</div>
									) : plans.length === 0 ? (
										<div className="rounded-2xl border border-gray-200 border-dashed p-8 text-center text-gray-400 text-sm">
											No hay planes de estudio creados para este programa.
										</div>
									) : (
										<div className="space-y-2.5">
											{plans.map((plan) => {
												return (
													// biome-ignore lint/a11y/useSemanticElements: contains nested action buttons
													<div
														key={plan.id}
														role="button"
														tabIndex={0}
														onClick={() => setSelectedPlanId(plan.id)}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																setSelectedPlanId(plan.id);
															}
														}}
														className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all active:scale-[0.98] ${
															selectedPlanId === plan.id
																? "border-primary/20 bg-primary/[0.03] ring-1 ring-primary/10"
																: "border-gray-100 bg-white hover:bg-gray-50"
														}`}
													>
														<div className="min-w-0 pr-12">
															<p className="truncate font-bold text-gray-900 text-sm tracking-tight">
																{plan.name}
															</p>
															<div className="mt-1 flex items-center gap-2">
																{plan.isActive ? (
																	<span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 font-bold text-[10px] text-green-700 ring-1 ring-green-600/10">
																		<Check size={8} /> Activo
																	</span>
																) : (
																	<button
																		type="button"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleToggleActivePlan(plan);
																		}}
																		className="font-bold text-[10px] text-gray-400 underline hover:text-primary"
																	>
																		Marcar activo
																	</button>
																)}
															</div>
														</div>

														<div className="absolute top-3.5 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	setEditingPlan(plan);
																	setPlanName(plan.name);
																	setPlanIsActive(plan.isActive);
																	setShowPlanModal(true);
																}}
																className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
																title="Editar nombre"
															>
																<Edit size={12} />
															</button>
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDeletePlan(plan.id);
																}}
																className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600"
																title="Eliminar"
															>
																<Trash2 size={12} />
															</button>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Columna Derecha: Grilla del Plan Curricular (8 Cols) */}
					<div className="lg:col-span-8">
						{!selectedPlanId ? (
							<div className="flex h-full min-h-[350px] items-center justify-center rounded-[2.5rem] bg-black/[0.02] p-2 ring-1 ring-black/5">
								<div className="p-8 text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
										<BookOpen className="h-7 w-7 text-gray-300" />
									</div>
									<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
										Selecciona un plan de estudios
									</h3>
									<p className="mt-2 max-w-sm text-gray-400 text-sm">
										Elige un programa académico y haz clic en uno de sus planes
										en el panel lateral para administrar su pensum.
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-6">
								<div className="flex items-center justify-between border-gray-100 border-b pb-4">
									<div>
										<h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
											Estructura del Plan
										</h2>
										<p className="mt-1 text-gray-400 text-sm">
											Asignaciones de materias y prelaciones.
										</p>
									</div>
									{loadingSubjects && (
										<Loader2 size={20} className="animate-spin text-primary" />
									)}
								</div>

								<div className="space-y-4">
									{termsArray.map((term) => {
										const termSubjects = subjectsByTerm[term] || [];
										return (
											<div
												key={term}
												className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
											>
												<div className="flex items-center justify-between border-gray-100 border-b bg-gray-50/50 px-6 py-3.5">
													<span className="font-extrabold text-gray-900 text-sm tracking-tight">
														Semestre {term}
													</span>
													<button
														type="button"
														onClick={() => handleOpenAssignModal(term)}
														className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1 font-bold text-[11px] text-primary transition-all hover:scale-105 active:scale-95"
													>
														<Plus size={12} />
														Asignar Materia
													</button>
												</div>

												<div className="px-6 py-4">
													{termSubjects.length === 0 ? (
														<p className="py-2 text-center text-gray-400 text-xs italic">
															No hay materias asignadas en este semestre.
														</p>
													) : (
														<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
															{termSubjects.map((ps) => (
																<div
																	key={ps.id}
																	className="relative flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200"
																>
																	<div>
																		<div className="flex items-center justify-between gap-2">
																			<span className="inline-flex rounded bg-gray-50 px-1.5 py-0.5 font-bold text-[10px] text-gray-600 ring-1 ring-black/5">
																				{ps.code}
																			</span>
																			<span className="font-bold text-[10px] text-gray-400 uppercase">
																				{ps.credits} crédito
																				{ps.credits !== 1 ? "s" : ""}
																			</span>
																		</div>
																		<p className="mt-2 font-bold text-gray-900 text-sm leading-snug tracking-tight">
																			{ps.name}
																		</p>

																		{ps.prerequisiteIds.length > 0 && (
																			<div className="mt-3 flex flex-wrap items-center gap-1">
																				<span className="font-bold text-[9px] text-gray-400 uppercase">
																					Prereq:
																				</span>
																				{ps.prerequisiteIds.map((pId) => {
																					const reqSub = planSubjects.find(
																						(x) => x.subjectId === pId,
																					);
																					return (
																						<span
																							key={pId}
																							className="rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-[9px] text-amber-700 ring-1 ring-amber-600/10"
																							title={reqSub?.name || pId}
																						>
																							{reqSub?.code || pId}
																						</span>
																					);
																				})}
																			</div>
																		)}
																	</div>

																	<div className="mt-4 flex items-center justify-end gap-1.5 border-gray-50 border-t pt-2.5">
																		<button
																			type="button"
																			onClick={() =>
																				handleOpenEditAssignModal(ps)
																			}
																			className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
																			title="Editar prelaciones"
																		>
																			<Edit size={12} />
																		</button>
																		<button
																			type="button"
																			onClick={() =>
																				handleDeleteAssignment(ps.id)
																			}
																			className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600"
																			title="Desasignar"
																		>
																			<Trash2 size={12} />
																		</button>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* PESTAÑA: Materias (Subjects)                                              */}
			{/* ========================================================================= */}
			{activeTab === "subjects" && (
				<div className="rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
					<div className="rounded-[calc(2rem-0.5rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
						<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							{/* Búsqueda */}
							<div className="relative w-full max-w-md">
								<Search
									size={18}
									className="absolute top-3.5 left-3.5 text-gray-400"
								/>
								<input
									type="text"
									value={subjectSearchFilter}
									onChange={(e) => setSubjectSearchFilter(e.target.value)}
									placeholder="Buscar materia por nombre o código..."
									className="w-full rounded-2xl border border-gray-200 py-3 pr-4 pl-11 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<button
								type="button"
								onClick={handleOpenCreateSubjectModal}
								className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 font-extrabold text-sm text-white shadow-[0_2px_8px_rgba(31,54,83,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark active:scale-95"
							>
								<Plus size={16} />
								Crear Materia
							</button>
						</div>

						{loadingSubjects ? (
							<div className="flex justify-center py-20">
								<Loader2 size={36} className="animate-spin text-primary" />
							</div>
						) : subjectsFilteredList.length === 0 ? (
							<div className="rounded-3xl border border-gray-100 border-dashed py-20 text-center text-gray-400">
								No hay materias creadas.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left text-sm">
									<thead>
										<tr className="border-gray-100 border-b font-bold text-[11px] text-gray-400 uppercase tracking-wider">
											<th className="px-4 py-3">Código</th>
											<th className="px-4 py-3">Nombre</th>
											<th className="px-4 py-3">Créditos</th>
											<th className="px-4 py-3">Modalidad</th>
											<th className="px-4 py-3">Unidad Académica</th>
											<th className="px-4 py-3">Estado</th>
											<th className="px-4 py-3 text-right">Acciones</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-50">
										{subjectsFilteredList.map((sub) => {
											const uniUnit = academicUnits.find(
												(u) => u.id === sub.academicUnitId,
											);
											return (
												<tr
													key={sub.id}
													className="transition-colors hover:bg-gray-50/50"
												>
													<td className="px-4 py-3.5 font-bold text-gray-900">
														{sub.code}
													</td>
													<td className="px-4 py-3.5 font-semibold text-gray-700">
														{sub.name}
													</td>
													<td className="px-4 py-3.5 font-semibold text-gray-600">
														{sub.credits}
													</td>
													<td className="px-4 py-3.5 text-gray-500">
														{sub.modality}
													</td>
													<td className="px-4 py-3.5 text-gray-500">
														{uniUnit ? (
															uniUnit.name
														) : (
															<span className="text-gray-300 italic">
																No asignada
															</span>
														)}
													</td>
													<td className="px-4 py-3.5">
														<span
															className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold text-[10px] ring-1 ${
																sub.isActive
																	? "bg-green-50 text-green-700 ring-green-600/10"
																	: "bg-red-50 text-red-700 ring-red-600/10"
															}`}
														>
															{sub.isActive ? "Activa" : "Inactiva"}
														</span>
													</td>
													<td className="px-4 py-3.5 text-right">
														<div className="flex items-center justify-end gap-1.5">
															<button
																type="button"
																onClick={() => handleOpenEditSubjectModal(sub)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
																title="Editar materia"
															>
																<Edit size={14} />
															</button>
															<button
																type="button"
																onClick={() => handleDeleteSubject(sub.id)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600"
																title="Eliminar materia"
															>
																<Trash2 size={14} />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* PESTAÑA: Unidades Académicas (Academic Units)                             */}
			{/* ========================================================================= */}
			{activeTab === "units" && (
				<div className="rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
					<div className="rounded-[calc(2rem-0.5rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
						<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							{/* Búsqueda */}
							<div className="relative w-full max-w-md">
								<Search
									size={18}
									className="absolute top-3.5 left-3.5 text-gray-400"
								/>
								<input
									type="text"
									value={unitSearchFilter}
									onChange={(e) => setUnitSearchFilter(e.target.value)}
									placeholder="Buscar unidad académica..."
									className="w-full rounded-2xl border border-gray-200 py-3 pr-4 pl-11 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<button
								type="button"
								onClick={handleOpenCreateUnitModal}
								className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 font-extrabold text-sm text-white shadow-[0_2px_8px_rgba(31,54,83,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark active:scale-95"
							>
								<Plus size={16} />
								Crear Unidad
							</button>
						</div>

						{loadingUnits ? (
							<div className="flex justify-center py-20">
								<Loader2 size={36} className="animate-spin text-primary" />
							</div>
						) : unitsFilteredList.length === 0 ? (
							<div className="rounded-3xl border border-gray-100 border-dashed py-20 text-center text-gray-400">
								No hay unidades académicas registradas.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left text-sm">
									<thead>
										<tr className="border-gray-100 border-b font-bold text-[11px] text-gray-400 uppercase tracking-wider">
											<th className="px-4 py-3">Código</th>
											<th className="px-4 py-3">Nombre</th>
											<th className="px-4 py-3">Unidad Padre</th>
											<th className="px-4 py-3">Tipo</th>
											<th className="px-4 py-3 text-right">Acciones</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-50">
										{unitsFilteredList.map((unit) => {
											const parent = academicUnits.find(
												(u) => u.id === unit.parentId,
											);
											return (
												<tr
													key={unit.id}
													className="transition-colors hover:bg-gray-50/50"
												>
													<td className="px-4 py-3.5 font-bold text-gray-900">
														{unit.code || (
															<span className="text-gray-300">-</span>
														)}
													</td>
													<td className="px-4 py-3.5 font-semibold text-gray-700">
														{unit.name}
													</td>
													<td className="px-4 py-3.5 text-gray-500">
														{parent ? (
															parent.name
														) : (
															<span className="text-gray-300 italic">
																Ninguno
															</span>
														)}
													</td>
													<td className="px-4 py-3.5">
														<span
															className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold text-[10px] ring-1 ${
																unit.isExtracurricular
																	? "bg-purple-50 text-purple-700 ring-purple-600/10"
																	: "bg-blue-50 text-blue-700 ring-blue-600/10"
															}`}
														>
															{unit.isExtracurricular
																? "Extracurricular"
																: "Académica"}
														</span>
													</td>
													<td className="px-4 py-3.5 text-right">
														<div className="flex items-center justify-end gap-1.5">
															<button
																type="button"
																onClick={() => handleOpenEditUnitModal(unit)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
																title="Editar unidad"
															>
																<Edit size={14} />
															</button>
															<button
																type="button"
																onClick={() => handleDeleteUnit(unit.id)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600"
																title="Eliminar unidad"
															>
																<Trash2 size={14} />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* DIÁLOGOS DE MODAL (PLANS, ASSIGN, SUBJECTS, UNITS)                       */}
			{/* ========================================================================= */}

			{/* 1. MODAL: Crear/Editar Plan de Estudio */}
			{showPlanModal && (
				<div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md animate-scale-up rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
						<div className="mb-5 flex items-center justify-between">
							<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
								{editingPlan
									? "Editar Plan de Estudios"
									: "Nuevo Plan de Estudios"}
							</h3>
							<button
								type="button"
								onClick={() => setShowPlanModal(false)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4">
							<div className="space-y-1.5">
								<label
									htmlFor="plan-name-input"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Nombre del Plan
								</label>
								<input
									id="plan-name-input"
									type="text"
									value={planName}
									onChange={(e) => setPlanName(e.target.value)}
									placeholder="Ej. Plan 2026, Reestructuración 2025"
									className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<label className="flex cursor-pointer items-center gap-2.5 py-1">
								<input
									type="checkbox"
									checked={planIsActive}
									onChange={(e) => setPlanIsActive(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
								/>
								<span className="select-none font-semibold text-gray-700 text-sm">
									Establecer como plan activo
								</span>
							</label>
						</div>

						<div className="mt-8 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowPlanModal(false)}
								className="rounded-xl px-4 py-2 font-bold text-gray-500 text-sm hover:bg-gray-100"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSavePlan}
								disabled={savingPlan || !planName.trim()}
								className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-bold text-sm text-white transition-all hover:bg-primary-dark disabled:opacity-50"
							>
								{savingPlan && <Loader2 size={14} className="animate-spin" />}
								{savingPlan ? "Guardando..." : "Guardar Plan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 2. MODAL: Asignar/Editar Materia en Plan */}
			{showAssignModal && (
				<div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
					<div className="w-full max-w-lg animate-scale-up rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
						<div className="mb-5 flex items-center justify-between">
							<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
								{editingAssign
									? "Editar Asignación"
									: `Asignar Materia a Semestre ${suggestedTerm}`}
							</h3>
							<button
								type="button"
								onClick={() => setShowAssignModal(false)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4">
							{!editingAssign && (
								<div className="space-y-1.5">
									<label
										htmlFor="search-subject-input"
										className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
									>
										Buscar Materia en la Universidad
									</label>
									<div className="relative">
										<Search
											size={16}
											className="absolute top-3 left-3.5 text-gray-400"
										/>
										<input
											id="search-subject-input"
											type="text"
											value={searchSubjectTerm}
											onChange={(e) => setSearchSubjectTerm(e.target.value)}
											placeholder="Ej. Contabilidad, Matemática, FBT..."
											className="w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-10 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
										/>
									</div>

									{searchSubjectTerm.trim() && (
										<div className="mt-2.5 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
											{filteredSearchSubjects.length === 0 ? (
												<p className="px-4 py-3 text-center text-gray-400 text-xs">
													No se encontraron materias disponibles.
												</p>
											) : (
												<div className="divide-y divide-gray-50">
													{filteredSearchSubjects.map((sub) => (
														<button
															key={sub.id}
															type="button"
															onClick={() => {
																setSelectedSubject(sub);
																setSearchSubjectTerm("");
															}}
															className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-all hover:bg-primary/[0.04]"
														>
															<div className="min-w-0 pr-4">
																<p className="truncate font-bold text-gray-900">
																	{sub.name}
																</p>
																<p className="mt-0.5 text-gray-500 text-xs">
																	{sub.code} • {sub.credits} créditos
																</p>
															</div>
															{selectedSubject?.id === sub.id && (
																<CheckCircle
																	size={16}
																	className="text-primary"
																/>
															)}
														</button>
													))}
												</div>
											)}
										</div>
									)}
								</div>
							)}

							{selectedSubject && (
								<div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-primary/[0.02] p-4">
									<div>
										<p className="font-extrabold text-gray-900 text-sm tracking-tight">
											{selectedSubject.name}
										</p>
										<p className="mt-0.5 text-gray-500 text-xs">
											{selectedSubject.code} • {selectedSubject.credits}{" "}
											créditos
										</p>
									</div>
									{!editingAssign && (
										<button
											type="button"
											onClick={() => setSelectedSubject(null)}
											className="font-bold text-red-500 text-xs hover:underline"
										>
											Cambiar
										</button>
									)}
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label
										htmlFor="suggested-term-input"
										className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
									>
										Semestre/Trimestre Sugerido
									</label>
									<input
										id="suggested-term-input"
										type="number"
										min={1}
										max={totalTerms}
										value={suggestedTerm}
										onChange={(e) => setSuggestedTerm(Number(e.target.value))}
										className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<span className="block font-bold text-gray-400 text-xs uppercase tracking-wider">
									Prelaciones (Materias Prerrequisito)
								</span>
								<div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-3.5">
									{planSubjects
										.filter((ps) => ps.subjectId !== selectedSubject?.id)
										.map((ps) => {
											const checked = prereqIds.includes(ps.subjectId);
											return (
												<label
													key={ps.id}
													className="flex cursor-pointer select-none items-center gap-2.5 font-semibold text-gray-700 text-sm hover:text-gray-900"
												>
													<input
														type="checkbox"
														checked={checked}
														onChange={() => {
															if (checked) {
																setPrereqIds(
																	prereqIds.filter((id) => id !== ps.subjectId),
																);
															} else {
																setPrereqIds([...prereqIds, ps.subjectId]);
															}
														}}
														className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
													/>
													<span>
														{ps.name}{" "}
														<span className="text-gray-400">({ps.code})</span>
													</span>
												</label>
											);
										})}
									{planSubjects.filter(
										(ps) => ps.subjectId !== selectedSubject?.id,
									).length === 0 && (
										<p className="py-2 text-center text-gray-400 text-xs italic">
											No hay otras materias en el plan de estudios para
											establecer prelaciones.
										</p>
									)}
								</div>
							</div>
						</div>

						<div className="mt-8 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowAssignModal(false)}
								className="rounded-xl px-4 py-2 font-bold text-gray-500 text-sm hover:bg-gray-100"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSaveAssignment}
								disabled={savingAssign || !selectedSubject}
								className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-bold text-sm text-white transition-all hover:bg-primary-dark disabled:opacity-50"
							>
								{savingAssign && <Loader2 size={14} className="animate-spin" />}
								{savingAssign
									? "Asignando..."
									: editingAssign
										? "Actualizar"
										: "Asignar Materia"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 3. MODAL: Crear/Editar Materia (General) */}
			{showSubjectModal && (
				<div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
					<div className="max-h-[90vh] w-full max-w-lg animate-scale-up overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
						<div className="mb-5 flex items-center justify-between">
							<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
								{editingSubject ? "Editar Materia" : "Nueva Materia"}
							</h3>
							<button
								type="button"
								onClick={() => setShowSubjectModal(false)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<label
										htmlFor="sub-code-input"
										className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
									>
										Código de Materia
									</label>
									<input
										id="sub-code-input"
										type="text"
										value={subCode}
										onChange={(e) => setSubCode(e.target.value)}
										placeholder="Ej. FBTMA01"
										className="w-full rounded-xl border border-gray-200 px-3.5 py-2 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
									/>
								</div>
								<div className="space-y-1.5">
									<label
										htmlFor="sub-credits-input"
										className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
									>
										Créditos
									</label>
									<input
										id="sub-credits-input"
										type="number"
										min={0}
										value={subCredits}
										onChange={(e) => setSubCredits(Number(e.target.value))}
										className="w-full rounded-xl border border-gray-200 px-3.5 py-2 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="sub-name-input"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Nombre de Materia
								</label>
								<input
									id="sub-name-input"
									type="text"
									value={subName}
									onChange={(e) => setSubName(e.target.value)}
									placeholder="Ej. Matemática I"
									className="w-full rounded-xl border border-gray-200 px-3.5 py-2 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<label
										htmlFor="sub-modality-select"
										className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
									>
										Modalidad
									</label>
									<select
										id="sub-modality-select"
										value={subModality}
										onChange={(e) => setSubModality(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 font-semibold text-gray-700 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
									>
										<option value="Presencial">Presencial</option>
										<option value="Virtual">Virtual</option>
										<option value="Mixta">Mixta</option>
									</select>
								</div>

								<div className="space-y-1.5">
									<label
										htmlFor="sub-type-select"
										className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
									>
										Tipo
									</label>
									<select
										id="sub-type-select"
										value={subType}
										onChange={(e) => setSubType(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 font-semibold text-gray-700 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
									>
										<option value="Asignatura">Asignatura</option>
										<option value="Electiva">Electiva</option>
										<option value="Seminario">Seminario</option>
										<option value="Taller">Taller</option>
										<option value="Otro">Otro</option>
									</select>
								</div>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="sub-unit-select"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Unidad Académica
								</label>
								<select
									id="sub-unit-select"
									value={subUnitId}
									onChange={(e) => setSubUnitId(e.target.value)}
									className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 font-semibold text-gray-700 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
								>
									<option value="">No asignar unidad</option>
									{academicUnits.map((unit) => (
										<option key={unit.id} value={unit.id}>
											{unit.name}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="sub-desc-textarea"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Descripción / Detalles
								</label>
								<textarea
									id="sub-desc-textarea"
									value={subDesc}
									onChange={(e) => setSubDesc(e.target.value)}
									placeholder="Descripción corta de la materia..."
									rows={3}
									className="w-full rounded-xl border border-gray-200 px-3.5 py-2 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<label className="flex cursor-pointer items-center gap-2.5 py-1">
								<input
									type="checkbox"
									checked={subIsActive}
									onChange={(e) => setSubIsActive(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
								/>
								<span className="select-none font-semibold text-gray-700 text-sm">
									Materia activa en el sistema
								</span>
							</label>
						</div>

						<div className="mt-8 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowSubjectModal(false)}
								className="rounded-xl px-4 py-2 font-bold text-gray-500 text-sm hover:bg-gray-100"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSaveSubject}
								disabled={savingSubject || !subCode.trim() || !subName.trim()}
								className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-bold text-sm text-white transition-all hover:bg-primary-dark disabled:opacity-50"
							>
								{savingSubject && (
									<Loader2 size={14} className="animate-spin" />
								)}
								{savingSubject ? "Guardando..." : "Guardar Materia"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 4. MODAL: Crear/Editar Unidad Académica */}
			{showUnitModal && (
				<div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md animate-scale-up rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
						<div className="mb-5 flex items-center justify-between">
							<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
								{editingUnit
									? "Editar Unidad Académica"
									: "Nueva Unidad Académica"}
							</h3>
							<button
								type="button"
								onClick={() => setShowUnitModal(false)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4">
							<div className="space-y-1.5">
								<label
									htmlFor="unit-name-input"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Nombre de la Unidad
								</label>
								<input
									id="unit-name-input"
									type="text"
									value={unitName}
									onChange={(e) => setUnitName(e.target.value)}
									placeholder="Ej. Departamento de Ingeniería de Sistemas"
									className="w-full rounded-xl border border-gray-200 px-3.5 py-2 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="unit-code-input"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Código (Opcional)
								</label>
								<input
									id="unit-code-input"
									type="text"
									value={unitCode}
									onChange={(e) => setUnitCode(e.target.value)}
									placeholder="Ej. INGSIS"
									className="w-full rounded-xl border border-gray-200 px-3.5 py-2 font-semibold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
								/>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="unit-parent-select"
									className="block font-bold text-gray-400 text-xs uppercase tracking-wider"
								>
									Unidad Padre (Opcional)
								</label>
								<select
									id="unit-parent-select"
									value={unitParentId}
									onChange={(e) => setUnitParentId(e.target.value)}
									className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-semibold text-gray-700 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
								>
									<option value="">Ninguna (Unidad Raíz)</option>
									{academicUnits
										.filter((u) => u.id !== editingUnit?.id) // No ponerse a sí mismo como padre
										.map((u) => (
											<option key={u.id} value={u.id}>
												{u.name}
											</option>
										))}
								</select>
							</div>

							<label className="flex cursor-pointer items-center gap-2.5 py-1">
								<input
									type="checkbox"
									checked={unitIsExtra}
									onChange={(e) => setUnitIsExtra(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
								/>
								<span className="select-none font-semibold text-gray-700 text-sm">
									Es unidad extracurricular
								</span>
							</label>
						</div>

						<div className="mt-8 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowUnitModal(false)}
								className="rounded-xl px-4 py-2 font-bold text-gray-500 text-sm hover:bg-gray-100"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSaveUnit}
								disabled={savingUnit || !unitName.trim()}
								className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-bold text-sm text-white transition-all hover:bg-primary-dark disabled:opacity-50"
							>
								{savingUnit && <Loader2 size={14} className="animate-spin" />}
								{savingUnit ? "Guardando..." : "Guardar Unidad"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function AdminPage() {
	return (
		<ProtectedRoute>
			<AdminContent />
		</ProtectedRoute>
	);
}
