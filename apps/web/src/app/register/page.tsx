"use client";

import { AlertCircle, GraduationCap, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useEffect, useState } from "react";

import { academicProgramsAPI, parseApiError, universitiesAPI } from "@/api/client";
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

export default function RegisterPage() {
	const { register } = useAuth();
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const [universities, setUniversities] = useState<University[]>([]);
	const [academicPrograms, setAcademicPrograms] = useState<AcademicProgram[]>([]);
	const [selectedUni, setSelectedUni] = useState("");
	const [selectedProgram, setSelectedProgram] = useState("");
	const [loadingUniversities, setLoadingUniversities] = useState(true);

	useEffect(() => {
		setLoadingUniversities(true);
		universitiesAPI
			.list()
			.then((res) => setUniversities(res.data))
			.catch(() => {})
			.finally(() => setLoadingUniversities(false));
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

	const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Las contraseñas no coinciden");
			return;
		}
		if (password.length < 8) {
			setError("La contraseña debe tener al menos 8 caracteres");
			return;
		}

		setLoading(true);
		try {
			await register(
				email,
				username,
				password,
				selectedUni || undefined,
				selectedProgram || undefined,
			);
			router.push("/pensum");
		} catch (err: unknown) {
			setError(parseApiError(err, "Error al registrarse"));
		} finally {
			setLoading(false);
		}
	};

	const inputClass =
		"w-full rounded-xl border border-gray-100 bg-gray-50/50 py-3.5 pr-4 pl-11 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-gray-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08] hover:border-gray-200";
	const selectClass =
		"w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08] hover:border-gray-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed";
	const labelClass =
		"mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400";

	return (
		<div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-24">
			{/* Ambient background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[100px]" />
				<div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary-light/20 blur-[90px]" />
			</div>

			<div className="relative z-10 w-full max-w-lg">
				{/* Header */}
				<div className="mb-10 text-center">
					{/* Double-bezel logo */}
					<div className="mx-auto mb-8 w-fit rounded-[1.5rem] bg-black/[0.04] p-2 ring-1 ring-black/8">
						<div className="flex h-16 w-16 items-center justify-center rounded-[calc(1.5rem-0.5rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-black/5">
							<GraduationCap className="h-8 w-8 text-accent" />
						</div>
					</div>

					<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm">
						<span className="font-semibold text-[10px] text-gray-400 uppercase tracking-[0.2em]">
							Registro Gratuito
						</span>
					</div>
					<h1 className="font-extrabold text-4xl text-gray-900 tracking-tighter">
						Crear Cuenta
					</h1>
					<p className="mt-3 font-medium text-gray-400">
						Únete a la comunidad estudiantil
					</p>
				</div>

				{/* Double-bezel form card */}
				<div className="rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/8">
					<form
						onSubmit={handleSubmit}
						className="space-y-5 rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_0_0_1px_rgba(0,0,0,0.02)]"
					>
						{error && (
							<div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm ring-1 ring-red-100">
								<AlertCircle size={16} className="flex-shrink-0" />
								{error}
							</div>
						)}

						<div>
							<label className={labelClass}>Nombre de usuario</label>
							<div className="group relative">
								<User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-300 transition-colors duration-300 group-focus-within:text-primary" />
								<input
									id="register-username"
									type="text"
									required
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className={inputClass}
									placeholder="juanperez"
								/>
							</div>
						</div>

						<div>
							<label className={labelClass}>Correo Electrónico</label>
							<div className="group relative">
								<Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-300 transition-colors duration-300 group-focus-within:text-primary" />
								<input
									id="register-email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className={inputClass}
									placeholder="tu@email.com"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={labelClass}>Contraseña</label>
								<div className="group relative">
									<Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-300 transition-colors duration-300 group-focus-within:text-primary" />
									<input
										id="register-password"
										type="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className={inputClass}
										placeholder="••••••••"
									/>
								</div>
							</div>
							<div>
								<label className={labelClass}>Confirmar</label>
								<div className="group relative">
									<Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-300 transition-colors duration-300 group-focus-within:text-primary" />
									<input
										id="register-confirm-password"
										type="password"
										required
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className={inputClass}
										placeholder="••••••••"
									/>
								</div>
							</div>
						</div>

						{/* Optional section */}
						<div className="border-gray-50 border-t pt-5">
							<p className="mb-4 font-semibold text-[10px] text-gray-300 uppercase tracking-[0.2em]">
								Opcional — Configurar después
							</p>
							<div className="space-y-4">
								<div>
									<label
										htmlFor="register-optional-university"
										className={labelClass}
									>
										Universidad
									</label>
									<select
										id="register-optional-university"
										value={selectedUni}
										onChange={(e) => {
											setSelectedUni(e.target.value);
											setSelectedProgram("");
										}}
										disabled={loadingUniversities}
										className={selectClass}
									>
										<option value="">
											{loadingUniversities
												? "Cargando universidades..."
												: universities.length === 0
													? "No hay universidades disponibles"
													: "Selecciona universidad..."}
										</option>
										{universities.map((u) => (
											<option key={u.id} value={u.id}>
												{u.shortName} - {u.name}
											</option>
										))}
									</select>
								</div>

								{selectedUni && (
									<div className="fade-in slide-in-from-top-2 animate-in duration-300">
										<label htmlFor="register-career" className={labelClass}>
											Programa Académico
										</label>
										<select
											id="register-career"
											value={selectedProgram}
											onChange={(e) => setSelectedProgram(e.target.value)}
											className={selectClass}
										>
											<option value="">Selecciona programa...</option>
											{academicPrograms.map((c) => (
												<option key={c.id} value={c.id}>
													{c.name}
												</option>
											))}
										</select>
									</div>
								)}
							</div>
						</div>

						{/* Pill CTA with button-in-button */}
						<button
							type="submit"
							disabled={loading}
							className="group mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 font-semibold text-white shadow-[0_6px_20px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
						>
							{loading ? (
								<>
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
									Creando cuenta...
								</>
							) : (
								<>
									Crear Cuenta
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-white/15">
										<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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

						<p className="text-center text-gray-400 text-sm">
							¿Ya tienes cuenta?{" "}
							<Link
								href="/login"
								className="font-semibold text-primary transition-opacity hover:opacity-70"
							>
								Inicia sesión
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
