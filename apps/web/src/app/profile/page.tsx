"use client";

import { BookOpen, CheckCircle, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import api, { academicProgramsAPI, universitiesAPI } from "@/api/client";
import ProtectedRoute from "@/components/auth/protected-route";
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

function ProfileContent() {
	const { user, refreshUser } = useAuth();
	const searchParams = useSearchParams();
	const router = useRouter();
	const isFirstTime = searchParams.get("firstTime") === "true";

	const [universities, setUniversities] = useState<University[]>([]);
	const [academicPrograms, setAcademicPrograms] = useState<AcademicProgram[]>(
		[],
	);
	const [selectedUni, setSelectedUni] = useState(
		user?.universityIds?.[0] || "",
	);
	const [selectedProgram, setSelectedProgram] = useState(
		user?.academicProgramIds?.[0] || "",
	);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		universitiesAPI
			.list()
			.then((res) => setUniversities(res.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (selectedUni) {
			academicProgramsAPI
				.list(selectedUni)
				.then((res) => setAcademicPrograms(res.data))
				.catch(() => {});
		} else {
			setAcademicPrograms([]);
		}
	}, [selectedUni]);

	useEffect(() => {
		if (
			isFirstTime &&
			user?.universityIds?.length &&
			user?.academicProgramIds?.length
		) {
			router.replace("/encuesta");
		}
	}, [isFirstTime, user, router]);

	const handleSave = async () => {
		if (isFirstTime && (!selectedUni || !selectedProgram)) {
			alert("Por favor selecciona tu universidad y carrera para continuar.");
			return;
		}
		setSaving(true);
		try {
			await api.put("/auth/me", {
				universityIds: selectedUni ? [selectedUni] : [],
				academicProgramIds: selectedProgram ? [selectedProgram] : [],
			});
			await refreshUser();
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
			if (isFirstTime) {
				router.push("/encuesta/onboarding");
			}
		} catch {
			alert("Error al guardar perfil");
		} finally {
			setSaving(false);
		}
	};

	const currentUni = universities.find(
		(u) => u.id === (user?.universityIds?.[0] || selectedUni),
	);

	return (
		<div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
			{/* First time registration banner */}
			{isFirstTime && (
				<div className="mb-8 flex items-center gap-3.5 rounded-2xl border border-amber-200/60 bg-amber-50 p-5 text-amber-900 shadow-sm ring-1 ring-amber-500/5">
					<CheckCircle className="h-6 w-6 flex-shrink-0 animate-pulse text-amber-600" />
					<div>
						<p className="font-bold text-sm">Registro casi completo</p>
						<p className="mt-0.5 font-medium text-amber-700/90 text-xs leading-relaxed">
							Para poder personalizar tu experiencia, planificar tus horarios y
							acceder a las encuestas, por favor selecciona tu universidad y
							carrera.
						</p>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="mb-12">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm ring-1 ring-black/5">
					<span className="font-semibold text-[10px] text-gray-400 uppercase tracking-[0.2em]">
						Mi Cuenta
					</span>
				</div>
				<h1 className="font-extrabold text-5xl text-gray-900 tracking-tighter">
					Mi Perfil
				</h1>
			</div>

			{/* Account info — double-bezel */}
			<div className="mb-6 rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<h2 className="mb-6 font-extrabold text-gray-900 text-xl tracking-tight">
						Información de Cuenta
					</h2>
					<div className="grid grid-cols-2 gap-6">
						<div className="rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
							<p className="mb-1 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
								Nombre
							</p>
							<p className="font-bold text-gray-900">{user?.name}</p>
						</div>
						<div className="rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
							<p className="mb-1 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
								Correo
							</p>
							<p className="truncate font-bold text-gray-900">{user?.email}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Academic config — double-bezel */}
			<div className="mb-6 rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<h2 className="mb-6 font-extrabold text-gray-900 text-xl tracking-tight">
						Configuración Académica
					</h2>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="university-select"
								className="mb-2 block font-semibold text-gray-400 text-xs uppercase tracking-wider"
							>
								Universidad
							</label>
							<select
								id="university-select"
								value={selectedUni}
								onChange={(e) => {
									setSelectedUni(e.target.value);
									setSelectedProgram("");
								}}
								className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gray-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08]"
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
									htmlFor="program-select"
									className="mb-2 block font-semibold text-gray-400 text-xs uppercase tracking-wider"
								>
									Programa Académico
								</label>
								<select
									id="program-select"
									value={selectedProgram}
									onChange={(e) => setSelectedProgram(e.target.value)}
									className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gray-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08]"
								>
									<option value="">Selecciona tu programa</option>
									{academicPrograms.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Pill CTA con gradiente animado (UI_prompts/gradient.md) */}
						<button
							type="button"
							onClick={handleSave}
							disabled={saving}
							className="gradient-button group mt-2 flex items-center gap-3 rounded-full px-6 py-3 font-semibold text-white shadow-[0_4px_16px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,54,83,0.35),0_4px_16px_rgba(229,156,36,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
						>
							{saved ? (
								<>
									<CheckCircle size={16} /> Guardado
								</>
							) : (
								<>
									<Save size={16} />{" "}
									{saving ? "Guardando..." : "Guardar Cambios"}
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Academic summary — double-bezel */}
			<div className="rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<h2 className="mb-6 flex items-center gap-3 font-extrabold text-gray-900 text-xl tracking-tight">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.06] ring-1 ring-primary/10">
							<BookOpen className="h-5 w-5 text-primary" />
						</div>
						Resumen Académico
					</h2>
					<div className="grid grid-cols-3 gap-4">
						<div className="rounded-xl bg-gray-50 px-4 py-5 text-center ring-1 ring-black/5">
							<p className="font-extrabold text-3xl text-primary tracking-tighter">
								{user?.approvedSubjects?.length || 0}
							</p>
							<p className="mt-1.5 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
								Materias Aprobadas
							</p>
						</div>
						<div className="rounded-xl bg-gray-50 px-4 py-5 text-center ring-1 ring-black/5">
							<p className="font-extrabold text-3xl text-accent tracking-tighter">
								{user?.totalApprovedCredits || 0}
							</p>
							<p className="mt-1.5 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
								Créditos Aprobados
							</p>
						</div>
						<div className="rounded-xl bg-gray-50 px-4 py-5 text-center ring-1 ring-black/5">
							<p className="font-extrabold text-3xl text-green-600 tracking-tighter">
								{currentUni?.shortName || "-"}
							</p>
							<p className="mt-1.5 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
								Universidad
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ProfilePage() {
	return (
		<ProtectedRoute>
			<Suspense
				fallback={
					<div className="flex min-h-screen items-center justify-center">
						<span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
					</div>
				}
			>
				<ProfileContent />
			</Suspense>
		</ProtectedRoute>
	);
}
