"use client";

import {
	Award,
	BookOpen,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	Circle,
	Loader2,
	RotateCcw,
	Target,
} from "lucide-react";
import { useEffect, useState } from "react";

import { careersAPI, subjectsAPI } from "@/api/client";
import ProtectedRoute from "@/components/auth/protected-route";
import { SmoothAccordion } from "@/components/ui/smooth-accordion";
import { useAuth } from "@/context/auth-context";

interface Subject {
	id: string;
	code: string;
	name: string;
	credits: number;
	semesterSuggested: number;
	prerequisites: string[];
}

interface Career {
	id: string;
	name: string;
	totalCredits: number;
}

function PensumContent() {
	const { user, refreshUser } = useAuth();
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [career, setCareer] = useState<Career | null>(null);
	const [loading, setLoading] = useState(true);
	const [expandedSemester, setExpandedSemester] = useState<number | null>(1);
	const [approving, setApproving] = useState<string | null>(null);
	const [unapprovingCode, setUnapprovingCode] = useState<string | null>(null);
	const [approvingSemester, setApprovingSemester] = useState<number | null>(
		null,
	);

	const approvedCodes = new Set(
		user?.approvedSubjects?.map((s) => s.subjectCode) || [],
	);

	useEffect(() => {
		const careerId = user?.careerIds?.[0];
		if (careerId) {
			Promise.all([subjectsAPI.pensum(careerId), careersAPI.get(careerId)])
				.then(([subRes, carRes]) => {
					setSubjects(subRes.data);
					setCareer(carRes.data);
				})
				.catch(console.error)
				.finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, [user?.careerIds]);

	const handleApprove = async (code: string) => {
		setApproving(code);
		try {
			await subjectsAPI.approve({ subject_code: code });
			await refreshUser();
		} catch (err: unknown) {
			alert(
				(err as { response?: { data?: { detail?: string } } })?.response?.data
					?.detail || "Error al aprobar materia",
			);
		} finally {
			setApproving(null);
		}
	};

	const handleUnapprove = async (code: string) => {
		setUnapprovingCode(code);
		try {
			await subjectsAPI.unapprove(code);
			await refreshUser();
		} catch (err: unknown) {
			alert(
				(err as { response?: { data?: { detail?: string } } })?.response?.data
					?.detail || "Error al deshacer aprobación",
			);
		} finally {
			setUnapprovingCode(null);
		}
	};

	const handleApproveSemester = async (
		semNum: number,
		semSubjects: Subject[],
	) => {
		const currentApproved = new Set(
			user?.approvedSubjects?.map((s) => s.subjectCode) || [],
		);
		const toApprove = semSubjects.filter(
			(s) =>
				!currentApproved.has(s.code) &&
				s.prerequisites.every((p) => currentApproved.has(p)),
		);
		if (toApprove.length === 0) return;

		setApprovingSemester(semNum);
		for (const subject of toApprove) {
			try {
				await subjectsAPI.approve({ subject_code: subject.code });
				currentApproved.add(subject.code);
			} catch {}
		}
		await refreshUser();
		setApprovingSemester(null);
	};

	const semesters = subjects.reduce(
		(acc, s) => {
			const sem = s.semesterSuggested || 0;
			if (!acc[sem]) acc[sem] = [];
			acc[sem].push(s);
			return acc;
		},
		{} as Record<number, Subject[]>,
	);

	const totalCredits = career?.totalCredits || 0;
	const approvedCredits = user?.totalApprovedCredits || 0;
	const progress =
		totalCredits > 0 ? Math.round((approvedCredits / totalCredits) * 100) : 0;

	if (!user?.careerIds?.length) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-24 text-center">
				<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
					<BookOpen className="h-10 w-10 text-gray-300" />
				</div>
				<h2 className="mb-3 font-extrabold text-3xl text-gray-900 tracking-tight">
					Configura tu perfil primero
				</h2>
				<p className="font-medium text-gray-500">
					Selecciona tu universidad y carrera en tu perfil para ver tu pensum.
				</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex justify-center py-20">
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="mb-12">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm ring-1 ring-black/5">
					<span className="font-semibold text-[10px] text-gray-400 uppercase tracking-[0.2em]">
						Plan Académico
					</span>
				</div>
				<h1 className="mb-2 font-extrabold text-5xl text-gray-900 tracking-tighter">
					Mi Pensum
				</h1>
				<p className="font-medium text-gray-400">{career?.name}</p>
			</div>
			{/* Progress card — double-bezel */}
			<div className="mb-10 rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/[0.08] ring-1 ring-accent/15">
								<Award className="h-5 w-5 text-accent" />
							</div>
							<span className="font-extrabold text-gray-900 tracking-tight">
								Progreso Académico
							</span>
						</div>
						<span className="font-bold text-2xl text-gray-900 tracking-tighter">
							{progress}%
						</span>
					</div>
					<div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5 ring-inset">
						<div
							className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="mt-3 flex justify-between font-semibold text-[11px] text-gray-400 uppercase tracking-wider">
						<span>
							{approvedCredits} / {totalCredits} créditos
						</span>
						<span>
							{subjects.filter((s) => approvedCodes.has(s.code)).length} /{" "}
							{subjects.length} materias
						</span>
					</div>
				</div>
			</div>

			{/* Stat cards grid — double-bezel mini */}
			<div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
				{[
					{
						value: subjects.length,
						label: "Total",
						color: "text-primary",
						bg: "bg-primary/[0.04] ring-primary/8",
					},
					{
						value: subjects.filter((s) => approvedCodes.has(s.code)).length,
						label: "Aprobadas",
						color: "text-green-600",
						bg: "bg-green-50 ring-green-100",
					},
					{
						value: subjects.filter((s) => !approvedCodes.has(s.code)).length,
						label: "Pendientes",
						color: "text-amber-600",
						bg: "bg-amber-50 ring-amber-100",
					},
					{
						value: approvedCredits,
						label: "Créditos",
						color: "text-accent",
						bg: "bg-accent/[0.06] ring-accent/10",
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="rounded-[1.5rem] bg-black/[0.02] p-1.5 ring-1 ring-black/5"
					>
						<div
							className={`rounded-[calc(1.5rem-0.375rem)] ${stat.bg} p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 transition-transform duration-300 hover:-translate-y-0.5`}
						>
							<p
								className={`font-extrabold text-3xl tracking-tighter ${stat.color}`}
							>
								{stat.value}
							</p>
							<p className="mt-1.5 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
								{stat.label}
							</p>
						</div>
					</div>
				))}
			</div>

			<div className="space-y-4">
				{Object.entries(semesters)
					.sort(([a], [b]) => Number(a) - Number(b))
					.map(([sem, semSubjects]) => {
						const semNum = Number(sem);
						const isExpanded = expandedSemester === semNum;
						const allApproved = semSubjects.every((s) =>
							approvedCodes.has(s.code),
						);
						const canApproveAll =
							!allApproved &&
							semSubjects.some(
								(s) =>
									!approvedCodes.has(s.code) &&
									s.prerequisites.every((p) => approvedCodes.has(p)),
							);
						const isSemesterLoading = approvingSemester === semNum;

						return (
							<div
								key={sem}
								className={`overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? "shadow-[0_8px_24px_rgba(0,0,0,0.06)]" : "shadow-sm hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"}`}
							>
								<div className="flex items-center">
									<button
										onClick={() =>
											setExpandedSemester(isExpanded ? null : semNum)
										}
										className="flex flex-1 items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-black/[0.02]"
									>
										{allApproved ? (
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
												<CheckCircle className="h-5 w-5" />
											</div>
										) : (
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
												<Target className="h-5 w-5" />
											</div>
										)}
										<span className="font-extrabold text-gray-900 text-lg tracking-tight">
											Semestre {sem}
										</span>
										<span className="font-medium text-gray-400 text-sm">
											(
											{
												semSubjects.filter((s) => approvedCodes.has(s.code))
													.length
											}
											/{semSubjects.length} aprobadas)
										</span>
									</button>

									{canApproveAll && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleApproveSemester(semNum, semSubjects);
											}}
											disabled={isSemesterLoading}
											title="Aprobar todas las materias disponibles del semestre"
											className="mr-3 flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2 font-semibold text-green-700 text-xs shadow-sm ring-1 ring-green-600/20 transition-all duration-300 hover:scale-105 hover:bg-green-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
										>
											{isSemesterLoading ? (
												<Loader2 size={14} className="animate-spin" />
											) : (
												<CheckSquare size={14} />
											)}
											{isSemesterLoading ? "Aprobando..." : "Aprobar todas"}
										</button>
									)}

									<button
										onClick={() =>
											setExpandedSemester(isExpanded ? null : semNum)
										}
										className="py-4 pr-5 pl-2 text-gray-400 hover:bg-gray-50"
									>
										<ChevronRight
											size={20}
											className={`transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
												isExpanded ? "rotate-90" : "rotate-0"
											}`}
										/>
									</button>
								</div>

								<SmoothAccordion isOpen={isExpanded}>
									<div className="accordion-content px-6 pt-2 pb-6">
										<div className="divide-y divide-gray-50">
											{semSubjects.map((subject) => {
												const isApproved = approvedCodes.has(subject.code);
												const prereqsMet = subject.prerequisites.every((p) =>
													approvedCodes.has(p),
												);
												const canApprove = !isApproved && prereqsMet;
												const isUnapproving = unapprovingCode === subject.code;

												return (
													<div
														key={subject.id}
														className={`flex items-center justify-between gap-3 py-3 ${isApproved ? "opacity-70" : ""}`}
													>
														<div className="flex min-w-0 items-center gap-4">
															{isApproved ? (
																<CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
															) : (
																<Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
															)}
															<div className="min-w-0">
																<p
																	className={`truncate font-semibold tracking-tight ${isApproved ? "text-gray-400 line-through" : "text-gray-900"}`}
																>
																	{subject.name}
																</p>
																<p className="mt-0.5 text-gray-500 text-xs">
																	<span className="font-medium text-gray-700">
																		{subject.code}
																	</span>{" "}
																	• {subject.credits} crédito
																	{subject.credits !== 1 ? "s" : ""}
																	{subject.prerequisites.length > 0 && (
																		<span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600 text-xs">
																			Pre: {subject.prerequisites.join(", ")}
																		</span>
																	)}
																</p>
															</div>
														</div>

														<div className="flex flex-shrink-0 items-center gap-2">
															{isApproved ? (
																<button
																	onClick={() => handleUnapprove(subject.code)}
																	disabled={isUnapproving}
																	title="Deshacer aprobación"
																	className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 font-medium text-gray-500 text-xs transition-all hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
																>
																	{isUnapproving ? (
																		<Loader2
																			size={14}
																			className="animate-spin"
																		/>
																	) : (
																		<RotateCcw size={14} />
																	)}
																	Deshacer
																</button>
															) : (
																<button
																	onClick={() => handleApprove(subject.code)}
																	disabled={
																		!canApprove || approving === subject.code
																	}
																	className={`rounded-lg px-4 py-1.5 font-semibold text-xs transition-all duration-300 ${
																		canApprove
																			? "bg-green-50 text-green-700 shadow-sm ring-1 ring-green-600/20 hover:-translate-y-0.5 hover:bg-green-100 active:scale-95"
																			: "cursor-not-allowed bg-gray-100 text-gray-400 opacity-70"
																	}`}
																	title={
																		!prereqsMet
																			? "Faltan prelaciones"
																			: "Marcar como aprobada"
																	}
																>
																	{approving === subject.code ? (
																		<span className="flex items-center gap-1.5">
																			<Loader2
																				size={14}
																				className="animate-spin"
																			/>
																			...
																		</span>
																	) : (
																		"Aprobar"
																	)}
																</button>
															)}
														</div>
													</div>
												);
											})}
										</div>
									</div>
								</SmoothAccordion>
							</div>
						);
					})}
			</div>
		</div>
	);
}

export default function PensumPage() {
	return (
		<ProtectedRoute>
			<PensumContent />
		</ProtectedRoute>
	);
}
