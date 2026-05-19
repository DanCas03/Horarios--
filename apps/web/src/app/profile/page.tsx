"use client";

import {
	BookOpen,
	Building2,
	CheckCircle,
	Save,
	User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import api, { careersAPI, universitiesAPI } from "@/api/client";
import ProtectedRoute from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";

interface University {
	_id: string;
	name: string;
	short_name: string;
}

interface Career {
	_id: string;
	name: string;
}

function ProfileContent() {
	const { user, refreshUser } = useAuth();
	const [universities, setUniversities] = useState<University[]>([]);
	const [careers, setCareers] = useState<Career[]>([]);
	const [selectedUni, setSelectedUni] = useState(user?.university_id || "");
	const [selectedCareer, setSelectedCareer] = useState(user?.career_id || "");
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
			careersAPI
				.list(selectedUni)
				.then((res) => setCareers(res.data))
				.catch(() => {});
		} else {
			setCareers([]);
		}
	}, [selectedUni]);

	const handleSave = async () => {
		setSaving(true);
		try {
			await api.put("/auth/me", {
				university_id: selectedUni || null,
				career_id: selectedCareer || null,
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
		(u) => u._id === (user?.university_id || selectedUni),
	);

	return (
		<div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-12">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm ring-1 ring-black/5">
					<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Mi Cuenta</span>
				</div>
				<h1 className="font-extrabold text-5xl tracking-tighter text-gray-900">Mi Perfil</h1>
			</div>

			{/* Account info — double-bezel */}
			<div className="mb-6 p-2 rounded-[2rem] bg-black/[0.025] ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<h2 className="mb-6 font-extrabold text-gray-900 text-xl tracking-tight">Información de Cuenta</h2>
					<div className="grid grid-cols-2 gap-6">
						<div className="rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
							<p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Usuario</p>
							<p className="font-bold text-gray-900">{user?.username}</p>
						</div>
						<div className="rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
							<p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Correo</p>
							<p className="font-bold text-gray-900 truncate">{user?.email}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Academic config — double-bezel */}
			<div className="mb-6 p-2 rounded-[2rem] bg-black/[0.025] ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<h2 className="mb-6 font-extrabold text-gray-900 text-xl tracking-tight">Configuración Académica</h2>

					<div className="space-y-4">
						<div>
							<label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
								Universidad
							</label>
							<select
								value={selectedUni}
								onChange={(e) => {
									setSelectedUni(e.target.value);
									setSelectedCareer("");
								}}
								className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08] hover:border-gray-200 appearance-none"
							>
								<option value="">Selecciona tu universidad</option>
								{universities.map((u) => (
									<option key={u._id} value={u._id}>
										{u.short_name} - {u.name}
									</option>
								))}
							</select>
						</div>

						{selectedUni && (
							<div>
								<label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
									Carrera
								</label>
								<select
									value={selectedCareer}
									onChange={(e) => setSelectedCareer(e.target.value)}
									className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08] hover:border-gray-200 appearance-none"
								>
									<option value="">Selecciona tu carrera</option>
									{careers.map((c) => (
										<option key={c._id} value={c._id}>
											{c.name}
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
								<><CheckCircle size={16} /> Guardado</>
							) : (
								<>
									<Save size={16} /> {saving ? "Guardando..." : "Guardar Cambios"}
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Academic summary — double-bezel */}
			<div className="p-2 rounded-[2rem] bg-black/[0.025] ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<h2 className="mb-6 font-extrabold text-gray-900 text-xl tracking-tight">Resumen Académico</h2>
					<div className="grid grid-cols-3 gap-4">
						<div className="rounded-2xl bg-primary/[0.04] p-6 text-center ring-1 ring-primary/8">
							<p className="font-extrabold text-4xl text-primary tracking-tighter">
								{user?.approved_subjects?.length || 0}
							</p>
							<p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Materias</p>
						</div>
						<div className="rounded-2xl bg-accent/[0.06] p-6 text-center ring-1 ring-accent/10">
							<p className="font-extrabold text-4xl text-accent tracking-tighter">
								{user?.total_approved_credits || 0}
							</p>
							<p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Créditos</p>
						</div>
						<div className="rounded-2xl bg-gray-50 p-6 text-center ring-1 ring-black/5">
							<p className="font-extrabold text-2xl text-gray-700 tracking-tighter">
								{currentUni?.short_name || "—"}
							</p>
							<p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Universidad</p>
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
			<ProfileContent />
		</ProtectedRoute>
	);
}
