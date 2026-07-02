"use client";

import {
	BookOpen,
	Check,
	ChevronDown,
	ChevronRight,
	Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { parseApiError, subjectsAPI } from "@/api/client";
import SurveyGuard from "@/components/auth/survey-guard";
import ChangeCareerModal from "@/components/encuesta/change-career-modal";
import { useAuth } from "@/context/auth-context";

interface PensumSubject {
	id: string;
	code: string;
	name: string;
	credits: number;
	semesterSuggested: number | null;
}

function OnboardingContent() {
	const { user, refreshUser } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const isEditing = searchParams.get("edit") === "true";

	const [subjects, setSubjects] = useState<PensumSubject[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [collapsedSemesters, setCollapsedSemesters] = useState<Set<number>>(
		new Set(),
	);
	const [showChangeCareer, setShowChangeCareer] = useState(false);

	// Si ya tiene materias aprobadas y no está editando, ir directo a encuesta
	useEffect(() => {
		if (
			!isEditing &&
			user &&
			user.approvedSubjects &&
			user.approvedSubjects.length > 0
		) {
			router.replace("/encuesta");
		}
	}, [user, router, isEditing]);

	// Inicializar selectedIds con las materias aprobadas actuales del usuario
	useEffect(() => {
		if (user?.approvedSubjects) {
			const initialApproved = new Set(
				user.approvedSubjects
					.map((s) => s.subjectId)
					.filter((id): id is string => !!id),
			);
			setSelectedIds(initialApproved);
		}
	}, [user?.approvedSubjects]);

	// Cargar pensum
	useEffect(() => {
		if (!user?.academicProgramIds?.[0]) return;
		setLoading(true);
		subjectsAPI
			.pensum(user.academicProgramIds[0])
			.then((res) => {
				setSubjects(res.data as PensumSubject[]);
			})
			.catch(() => {
				setError("No se pudo cargar el pensum");
			})
			.finally(() => setLoading(false));
	}, [user?.academicProgramIds]);

	// Agrupar por semestre
	const bySemester = useMemo(() => {
		const map = new Map<number, PensumSubject[]>();
		for (const s of subjects) {
			const sem = s.semesterSuggested ?? 0;
			if (!map.has(sem)) map.set(sem, []);
			map.get(sem)?.push(s);
		}
		return Array.from(map.entries()).sort(([a], [b]) => a - b);
	}, [subjects]);

	const toggleSubject = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const toggleSemester = useCallback((semesterSubjects: PensumSubject[]) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			const allSelected = semesterSubjects.every((s) => next.has(s.id));
			if (allSelected) {
				for (const s of semesterSubjects) next.delete(s.id);
			} else {
				for (const s of semesterSubjects) next.add(s.id);
			}
			return next;
		});
	}, []);

	const toggleCollapse = useCallback((sem: number) => {
		setCollapsedSemesters((prev) => {
			const next = new Set(prev);
			if (next.has(sem)) next.delete(sem);
			else next.add(sem);
			return next;
		});
	}, []);

	const handleSubmit = async () => {
		if (selectedIds.size === 0) {
			setError("Selecciona al menos una materia cursada");
			return;
		}
		setError("");
		setSubmitting(true);
		try {
			await subjectsAPI.approve({ subjectIds: Array.from(selectedIds) });

			await refreshUser();
			router.push("/encuesta");
		} catch (err: unknown) {
			setError(parseApiError(err, "Error al guardar materias"));
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
			{/* Header */}
			<div className="mb-10 text-center">
				<div className="mx-auto mb-6 w-fit rounded-[1.25rem] bg-black/[0.04] p-1.5 ring-1 ring-black/8">
					<div className="flex h-14 w-14 items-center justify-center rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-black/5">
						<BookOpen className="h-7 w-7 text-primary" />
					</div>
				</div>
				<h1 className="font-extrabold text-2xl text-gray-900 tracking-tight sm:text-3xl">
					Selecciona tus materias cursadas
				</h1>
				<p className="mt-3 text-gray-500 text-sm">
					Marca las materias que ya aprobaste. Solo podrás hacer reseñas de
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
			</div>

			{error && (
				<div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm ring-1 ring-red-100">
					{error}
				</div>
			)}

			{/* Counter */}
			<div className="mb-6 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
				<span className="font-medium text-gray-700 text-sm">
					{selectedIds.size} materia{selectedIds.size !== 1 ? "s" : ""}{" "}
					seleccionada{selectedIds.size !== 1 ? "s" : ""}
				</span>
				{selectedIds.size > 0 && (
					<button
						type="button"
						onClick={() => setSelectedIds(new Set())}
						className="font-medium text-primary text-xs hover:underline"
					>
						Limpiar selección
					</button>
				)}
			</div>

			{/* Semesters */}
			<div className="space-y-4">
				{bySemester.map(([semester, semSubjects]) => {
					const isCollapsed = collapsedSemesters.has(semester);
					const allSelected = semSubjects.every((s) => selectedIds.has(s.id));
					const _someSelected = semSubjects.some((s) => selectedIds.has(s.id));
					const selectedCount = semSubjects.filter((s) =>
						selectedIds.has(s.id),
					).length;

					return (
						<div
							key={semester}
							className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
						>
							{/* Semester header */}
							<div className="flex items-center gap-3 px-5 py-3.5">
								<button
									type="button"
									onClick={() => toggleCollapse(semester)}
									className="flex items-center gap-2 text-gray-900"
								>
									{isCollapsed ? (
										<ChevronRight size={16} className="text-gray-400" />
									) : (
										<ChevronDown size={16} className="text-gray-400" />
									)}
									<span className="font-bold text-sm">
										{semester === 0
											? "Sin semestre asignado"
											: `Semestre ${semester}`}
									</span>
								</button>

								<span className="text-gray-400 text-xs">
									{selectedCount}/{semSubjects.length}
								</span>

								<button
									type="button"
									onClick={() => toggleSemester(semSubjects)}
									className={`ml-auto rounded-lg px-3 py-1 font-medium text-xs transition-all active:scale-95 ${
										allSelected
											? "bg-primary/10 text-primary"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{allSelected ? "Deseleccionar" : "Seleccionar todo"}
								</button>
							</div>

							{/* Subject list */}
							{!isCollapsed && (
								<div className="border-gray-50 border-t px-3 pb-3">
									{semSubjects.map((subject) => {
										const isSelected = selectedIds.has(subject.id);
										return (
											<button
												type="button"
												key={subject.id}
												onClick={() => toggleSubject(subject.id)}
												className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
													isSelected
														? "bg-green-50 ring-1 ring-green-600/10"
														: "hover:bg-gray-50"
												}`}
											>
												<div
													className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
														isSelected
															? "border-green-600 bg-green-600"
															: "border-gray-300"
													}`}
												>
													{isSelected && (
														<Check size={12} className="text-white" />
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<span
															className={`font-mono font-semibold text-xs ${isSelected ? "text-green-700" : "text-primary"}`}
														>
															{subject.code}
														</span>
														<span
															className={`truncate text-sm ${isSelected ? "font-medium text-green-900" : "text-gray-700"}`}
														>
															{subject.name}
														</span>
													</div>
												</div>
												<span className="flex-shrink-0 text-gray-400 text-xs">
													{subject.credits} cr
												</span>
											</button>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Submit */}
			<div className="mt-8 flex justify-center">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={submitting || selectedIds.size === 0}
					className="gradient-button group flex items-center gap-3 rounded-full px-8 py-4 font-semibold text-white shadow-[0_6px_20px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,54,83,0.35),0_6px_20px_rgba(229,156,36,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
				>
					{submitting ? (
						<>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
							Guardando...
						</>
					) : (
						<>
							Confirmar {selectedIds.size} materia
							{selectedIds.size !== 1 ? "s" : ""} y continuar
							<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-white/15">
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<title>Flecha de confirmación</title>
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
			</div>

			<ChangeCareerModal
				open={showChangeCareer}
				onClose={() => setShowChangeCareer(false)}
			/>
		</div>
	);
}

export default function OnboardingPage() {
	return (
		<SurveyGuard requireApprovedSubjects={false}>
			<Suspense
				fallback={
					<div className="flex min-h-[60vh] items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				}
			>
				<OnboardingContent />
			</Suspense>
		</SurveyGuard>
	);
}
