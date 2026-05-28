"use client";

import {
	BookOpen,
	Building2,
	CheckCircle,
	Save,
	User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

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
	const [universities, setUniversities] = useState<University[]>([]);
	const [academicPrograms, setAcademicPrograms] = useState<AcademicProgram[]>([]);
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

	const handleSave = async () => {
		setSaving(true);
		try {
			await api.put("/auth/me", {
				universityIds: selectedUni ? [selectedUni] : [],
				academicProgramIds: selectedProgram ? [selectedProgram] : [],
			});
			await refreshUser();
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
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
								Usuario
							</p>
							<p className="font-bold text-gray-900">{user?.username}</p>
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
							<label className="mb-1.5 block font-medium text-gray-700 text-sm">
								Universidad
							</label>
							<select
								value={selectedUni}
								onChange={(e) => {
									setSelectedUni(e.target.value);
									setSelectedProgram("");
								}}
								className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
								<label className="mb-2 block font-semibold text-gray-400 text-xs uppercase tracking-wider">
									Programa Académico
								</label>
								<select
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

						{/* Pill save button */}
						<button
							onClick={handleSave}
							disabled={saving}
							className="group mt-2 flex items-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-[0_4px_16px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
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

			<div className="rounded-2xl bg-white p-6 shadow-md">
				<h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900 text-lg">
					<BookOpen size={20} className="text-primary" />
					Resumen Académico
				</h2>
				<div className="grid grid-cols-3 gap-4">
					<div className="rounded-xl bg-gray-50 p-4 text-center">
						<p className="font-bold text-3xl text-primary">
							{user?.approvedSubjects?.length || 0}
						</p>
						<p className="text-gray-500 text-sm">Materias Aprobadas</p>
					</div>
					<div className="rounded-xl bg-gray-50 p-4 text-center">
						<p className="font-bold text-3xl text-accent">
							{user?.totalApprovedCredits || 0}
						</p>
						<p className="text-gray-500 text-sm">Créditos Aprobados</p>
					</div>
					<div className="rounded-xl bg-gray-50 p-4 text-center">
						<p className="font-bold text-3xl text-green-600">
							{currentUni?.shortName || "-"}
						</p>
						<p className="text-gray-500 text-sm">Universidad</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ProfilePage() {
	return (
		<ProtectedRoute>
			<ProfileContent />
		</ProtectedRoute>
	);
}
