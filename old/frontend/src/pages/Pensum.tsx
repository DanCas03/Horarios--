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
import React, { useEffect, useState } from "react";
import { careersAPI, subjectsAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Subject {
	_id: string;
	code: string;
	name: string;
	credits: number;
	semester_suggested: number;
	subject_type: string;
	prerequisites: string[];
	avg_difficulty: number;
	review_count: number;
}

interface Career {
	_id: string;
	name: string;
	total_credits: number;
}

export default function Pensum() {
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
		user?.approved_subjects?.map((s) => s.subject_code) || [],
	);

	useEffect(() => {
		if (user?.career_id) {
			Promise.all([
				subjectsAPI.pensum(user.career_id),
				careersAPI.get(user.career_id),
			])
				.then(([subRes, carRes]) => {
					setSubjects(subRes.data);
					setCareer(carRes.data);
				})
				.catch(console.error)
				.finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, [user?.career_id]);

	const handleApprove = async (code: string) => {
		setApproving(code);
		try {
			await subjectsAPI.approve({ subject_code: code });
			await refreshUser();
		} catch (err: any) {
			alert(err.response?.data?.detail || "Error al aprobar materia");
		} finally {
			setApproving(null);
		}
	};

	const handleUnapprove = async (code: string) => {
		setUnapprovingCode(code);
		try {
			await subjectsAPI.unapprove(code);
			await refreshUser();
		} catch (err: any) {
			alert(err.response?.data?.detail || "Error al deshacer aprobación");
		} finally {
			setUnapprovingCode(null);
		}
	};

	const handleApproveSemester = async (
		semNum: number,
		semSubjects: Subject[],
	) => {
		// Current approved codes at the moment this runs
		const currentApproved = new Set(
			user?.approved_subjects?.map((s) => s.subject_code) || [],
		);
		const toApprove = semSubjects.filter((s) => {
			if (currentApproved.has(s.code)) return false;
			return s.prerequisites.every((p) => currentApproved.has(p));
		});
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

	// Group by semester
	const semesters = subjects.reduce(
		(acc, s) => {
			const sem = s.semester_suggested || 0;
			if (!acc[sem]) acc[sem] = [];
			acc[sem].push(s);
			return acc;
		},
		{} as Record<number, Subject[]>,
	);

	const totalCredits = career?.total_credits || 0;
	const approvedCredits = user?.total_approved_credits || 0;
	const progress =
		totalCredits > 0 ? Math.round((approvedCredits / totalCredits) * 100) : 0;

	if (!user?.career_id) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-16 text-center">
				<BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
				<h2 className="mb-2 font-bold text-2xl text-gray-900">
					Configura tu perfil primero
				</h2>
				<p className="text-gray-500">
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
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="mb-2 font-extrabold text-3xl text-gray-900">
					Mi Pensum
				</h1>
				<p className="text-gray-500">{career?.name}</p>
			</div>

			{/* Progress Bar */}
			<div className="mb-8 rounded-2xl bg-white p-6 shadow-md">
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Award className="h-6 w-6 text-accent" />
						<span className="font-semibold text-gray-900">
							Progreso Académico
						</span>
					</div>
					<span className="text-gray-500 text-sm">
						{approvedCredits} / {totalCredits} créditos
					</span>
				</div>
				<div className="h-4 w-full rounded-full bg-gray-200">
					<div
						className="h-4 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<div className="mt-2 flex justify-between text-gray-500 text-sm">
					<span>{progress}% completado</span>
					<span>
						{subjects.filter((s) => approvedCodes.has(s.code)).length} /{" "}
						{subjects.length} materias
					</span>
				</div>
			</div>

			{/* Stats */}
			<div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
				<div className="rounded-xl bg-white p-4 text-center shadow-sm">
					<p className="font-bold text-2xl text-primary">{subjects.length}</p>
					<p className="text-gray-500 text-xs">Total Materias</p>
				</div>
				<div className="rounded-xl bg-white p-4 text-center shadow-sm">
					<p className="font-bold text-2xl text-green-600">
						{subjects.filter((s) => approvedCodes.has(s.code)).length}
					</p>
					<p className="text-gray-500 text-xs">Aprobadas</p>
				</div>
				<div className="rounded-xl bg-white p-4 text-center shadow-sm">
					<p className="font-bold text-2xl text-amber-600">
						{subjects.filter((s) => !approvedCodes.has(s.code)).length}
					</p>
					<p className="text-gray-500 text-xs">Pendientes</p>
				</div>
				<div className="rounded-xl bg-white p-4 text-center shadow-sm">
					<p className="font-bold text-2xl text-accent">{approvedCredits}</p>
					<p className="text-gray-500 text-xs">Créditos Aprobados</p>
				</div>
			</div>

			{/* Semesters */}
			<div className="space-y-4">
				{Object.entries(semesters)
					.sort(([a], [b]) => Number(a) - Number(b))
					.map(([sem, semSubjects]) => {
						const semNum = Number(sem);
						const isExpanded = expandedSemester === semNum;
						const semApproved = semSubjects.filter((s) =>
							approvingSemester === semNum ? true : approvedCodes.has(s.code),
						).length;
						const allApproved = semSubjects.every((s) =>
							approvedCodes.has(s.code),
						);
						const canApproveAll =
							!allApproved &&
							semSubjects.some((s) => {
								return (
									!approvedCodes.has(s.code) &&
									s.prerequisites.every((p) => approvedCodes.has(p))
								);
							});
						const isSemesterLoading = approvingSemester === semNum;

						return (
							<div
								key={sem}
								className="overflow-hidden rounded-2xl bg-white shadow-md"
							>
								{/* Semester header */}
								<div className="flex items-center">
									<button
										onClick={() =>
											setExpandedSemester(isExpanded ? null : semNum)
										}
										className="flex flex-1 items-center gap-3 px-6 py-4 text-left hover:bg-gray-50"
									>
										{allApproved ? (
											<CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
										) : (
											<Target className="h-6 w-6 flex-shrink-0 text-primary" />
										)}
										<span className="font-bold text-gray-900">
											Semestre {sem}
										</span>
										<span className="text-gray-400 text-sm">
											(
											{
												semSubjects.filter((s) => approvedCodes.has(s.code))
													.length
											}
											/{semSubjects.length} aprobadas)
										</span>
									</button>

									{/* Approve-all semester button */}
									{canApproveAll && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleApproveSemester(semNum, semSubjects);
											}}
											disabled={isSemesterLoading}
											title="Aprobar todas las materias disponibles del semestre"
											className="mr-3 flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 font-medium text-green-700 text-xs transition-colors hover:bg-green-100 disabled:opacity-50"
										>
											{isSemesterLoading ? (
												<Loader2 size={13} className="animate-spin" />
											) : (
												<CheckSquare size={13} />
											)}
											{isSemesterLoading ? "Aprobando..." : "Aprobar semestre"}
										</button>
									)}

									<button
										onClick={() =>
											setExpandedSemester(isExpanded ? null : semNum)
										}
										className="py-4 pr-5 pl-2 text-gray-400 hover:bg-gray-50"
									>
										{isExpanded ? (
											<ChevronDown size={20} />
										) : (
											<ChevronRight size={20} />
										)}
									</button>
								</div>

								{isExpanded && (
									<div className="px-6 pb-4">
										<div className="divide-y divide-gray-100">
											{semSubjects.map((subject) => {
												const isApproved = approvedCodes.has(subject.code);
												const prereqsMet = subject.prerequisites.every((p) =>
													approvedCodes.has(p),
												);
												const canApprove = !isApproved && prereqsMet;
												const isUnapproving = unapprovingCode === subject.code;

												return (
													<div
														key={subject._id}
														className={`flex items-center justify-between gap-3 py-3 ${isApproved ? "opacity-70" : ""}`}
													>
														<div className="flex min-w-0 items-center gap-3">
															{isApproved ? (
																<CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
															) : (
																<Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
															)}
															<div className="min-w-0">
																<p
																	className={`truncate font-medium ${isApproved ? "text-gray-400 line-through" : "text-gray-900"}`}
																>
																	{subject.name}
																</p>
																<p className="text-gray-400 text-xs">
																	{subject.code} | {subject.credits} crédito
																	{subject.credits !== 1 ? "s" : ""}
																	{subject.prerequisites.length > 0 && (
																		<span className="ml-2">
																			Prelaciones:{" "}
																			{subject.prerequisites.join(", ")}
																		</span>
																	)}
																</p>
															</div>
														</div>

														<div className="flex flex-shrink-0 items-center gap-2">
															{isApproved ? (
																/* Undo button */
																<button
																	onClick={() => handleUnapprove(subject.code)}
																	disabled={isUnapproving}
																	title="Deshacer aprobación"
																	className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 font-medium text-gray-500 text-xs transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
																>
																	{isUnapproving ? (
																		<Loader2
																			size={12}
																			className="animate-spin"
																		/>
																	) : (
																		<RotateCcw size={12} />
																	)}
																	Deshacer
																</button>
															) : (
																/* Approve button */
																<button
																	onClick={() => handleApprove(subject.code)}
																	disabled={
																		!canApprove || approving === subject.code
																	}
																	className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
																		canApprove
																			? "bg-green-100 text-green-700 hover:bg-green-200"
																			: "cursor-not-allowed bg-gray-100 text-gray-400"
																	}`}
																	title={
																		!prereqsMet
																			? "Faltan prelaciones"
																			: "Marcar como aprobada"
																	}
																>
																	{approving === subject.code ? (
																		<span className="flex items-center gap-1">
																			<Loader2
																				size={12}
																				className="animate-spin"
																			/>{" "}
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
								)}
							</div>
						);
					})}
			</div>
		</div>
	);
}
