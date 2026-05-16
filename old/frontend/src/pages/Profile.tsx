import {
	BookOpen,
	Building2,
	CheckCircle,
	Save,
	User as UserIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import api, { careersAPI, universitiesAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface University {
	_id: string;
	name: string;
	short_name: string;
}

interface Career {
	_id: string;
	name: string;
	code: string;
}

export default function Profile() {
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
		} catch (err) {
			alert("Error al guardar perfil");
		} finally {
			setSaving(false);
		}
	};

	const currentUni = universities.find(
		(u) => u._id === (user?.university_id || selectedUni),
	);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 className="mb-8 flex items-center gap-3 font-extrabold text-3xl text-gray-900">
				<UserIcon className="h-8 w-8 text-primary" />
				Mi Perfil
			</h1>

			{/* User Info */}
			<div className="mb-6 rounded-2xl bg-white p-6 shadow-md">
				<h2 className="mb-4 font-bold text-gray-900 text-lg">
					Información de Cuenta
				</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-gray-500 text-sm">Usuario</p>
						<p className="font-medium text-gray-900">{user?.username}</p>
					</div>
					<div>
						<p className="text-gray-500 text-sm">Correo</p>
						<p className="font-medium text-gray-900">{user?.email}</p>
					</div>
				</div>
			</div>

			{/* Academic Config */}
			<div className="mb-6 rounded-2xl bg-white p-6 shadow-md">
				<h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900 text-lg">
					<Building2 size={20} className="text-primary" />
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
								setSelectedCareer("");
							}}
							className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
							<label className="mb-1.5 block font-medium text-gray-700 text-sm">
								Carrera
							</label>
							<select
								value={selectedCareer}
								onChange={(e) => setSelectedCareer(e.target.value)}
								className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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

					<button
						onClick={handleSave}
						disabled={saving}
						className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-light disabled:opacity-50"
					>
						{saved ? (
							<>
								<CheckCircle size={18} /> Guardado
							</>
						) : (
							<>
								<Save size={18} /> {saving ? "Guardando..." : "Guardar Cambios"}
							</>
						)}
					</button>
				</div>
			</div>

			{/* Stats */}
			<div className="rounded-2xl bg-white p-6 shadow-md">
				<h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900 text-lg">
					<BookOpen size={20} className="text-primary" />
					Resumen Académico
				</h2>
				<div className="grid grid-cols-3 gap-4">
					<div className="rounded-xl bg-gray-50 p-4 text-center">
						<p className="font-bold text-3xl text-primary">
							{user?.approved_subjects?.length || 0}
						</p>
						<p className="text-gray-500 text-sm">Materias Aprobadas</p>
					</div>
					<div className="rounded-xl bg-gray-50 p-4 text-center">
						<p className="font-bold text-3xl text-accent">
							{user?.total_approved_credits || 0}
						</p>
						<p className="text-gray-500 text-sm">Créditos Aprobados</p>
					</div>
					<div className="rounded-xl bg-gray-50 p-4 text-center">
						<p className="font-bold text-3xl text-green-600">
							{currentUni?.short_name || "-"}
						</p>
						<p className="text-gray-500 text-sm">Universidad</p>
					</div>
				</div>
			</div>
		</div>
	);
}
