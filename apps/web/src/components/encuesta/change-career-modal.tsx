"use client";

import { AlertTriangle, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import api, { academicProgramsAPI, universitiesAPI } from "@/api/client";
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

export default function ChangeCareerModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const { user, refreshUser } = useAuth();
	const router = useRouter();
	const [universities, setUniversities] = useState<University[]>([]);
	const [programs, setPrograms] = useState<AcademicProgram[]>([]);
	const [selectedUni, setSelectedUni] = useState(
		user?.universityIds?.[0] || "",
	);
	const [selectedProgram, setSelectedProgram] = useState(
		user?.academicProgramIds?.[0] || "",
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	// Precargar selección actual cada vez que se abre
	useEffect(() => {
		if (!open) return;
		setSelectedUni(user?.universityIds?.[0] || "");
		setSelectedProgram(user?.academicProgramIds?.[0] || "");
		setError("");
	}, [open, user?.universityIds, user?.academicProgramIds]);

	useEffect(() => {
		if (!open) return;
		universitiesAPI
			.list()
			.then((res) => setUniversities(res.data))
			.catch(() => {});
	}, [open]);

	useEffect(() => {
		if (!selectedUni) {
			setPrograms([]);
			return;
		}
		academicProgramsAPI
			.list(selectedUni)
			.then((res) => setPrograms(res.data))
			.catch(() => {});
	}, [selectedUni]);

	if (!open) return null;

	const programChanged =
		selectedProgram !== (user?.academicProgramIds?.[0] || "");

	const handleConfirm = async () => {
		if (!selectedUni || !selectedProgram) {
			setError("Selecciona universidad y carrera.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await api.put("/auth/me", {
				universityIds: [selectedUni],
				academicProgramIds: [selectedProgram],
			});
			await refreshUser();
			router.push("/encuesta/onboarding");
		} catch {
			setError("No se pudo cambiar la carrera. Intenta de nuevo.");
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div className="fade-in zoom-in-95 w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 duration-200">
				<h3 className="flex items-center gap-2 font-bold text-gray-900 text-lg">
					<GraduationCap size={20} className="text-primary" />
					Cambiar carrera
				</h3>
				<p className="mt-2 text-gray-500 text-sm">
					Selecciona tu universidad y carrera correctas.
				</p>

				{programChanged && (
					<div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-amber-800 text-xs ring-1 ring-amber-200">
						<AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
						<span>
							Cambiar de carrera reiniciará tus materias cursadas (las volverás
							a seleccionar). Tus reseñas se conservan.
						</span>
					</div>
				)}

				{error && (
					<div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
						{error}
					</div>
				)}

				<div className="mt-4 space-y-4">
					<div>
						<label
							htmlFor="cc-uni"
							className="mb-1.5 block font-medium text-gray-700 text-sm"
						>
							Universidad
						</label>
						<select
							id="cc-uni"
							value={selectedUni}
							onChange={(e) => {
								setSelectedUni(e.target.value);
								setSelectedProgram("");
							}}
							className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
								htmlFor="cc-prog"
								className="mb-1.5 block font-medium text-gray-700 text-sm"
							>
								Carrera
							</label>
							<select
								id="cc-prog"
								value={selectedProgram}
								onChange={(e) => setSelectedProgram(e.target.value)}
								className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
							>
								<option value="">Selecciona tu carrera</option>
								{programs.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={saving}
						className="rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 text-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={saving || !selectedUni || !selectedProgram}
						className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-sm text-white shadow-[0_4px_12px_rgba(31,54,83,0.25)] transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? (
							<>
								<Loader2 size={15} className="animate-spin" /> Guardando...
							</>
						) : (
							"Confirmar y reseleccionar materias"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
