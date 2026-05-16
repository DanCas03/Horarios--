import { AlertCircle, GraduationCap, Lock, Mail, User } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { careersAPI, parseApiError, universitiesAPI } from "../api/client";
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

export default function Register() {
	const { register } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// University & Career selection (optional on register)
	const [universities, setUniversities] = useState<University[]>([]);
	const [careers, setCareers] = useState<Career[]>([]);
	const [selectedUni, setSelectedUni] = useState("");
	const [selectedCareer, setSelectedCareer] = useState("");
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
			careersAPI
				.list(selectedUni)
				.then((res) => setCareers(res.data))
				.catch(() => {});
		} else {
			setCareers([]);
		}
	}, [selectedUni]);

	const handleSubmit = async (e: React.FormEvent) => {
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
				selectedCareer || undefined,
			);
			navigate("/pensum");
		} catch (err: any) {
			setError(parseApiError(err, "Error al registrarse"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<GraduationCap className="mx-auto mb-4 h-12 w-12 text-primary" />
					<h1 className="font-extrabold text-3xl text-gray-900">
						Crear Cuenta
					</h1>
					<p className="mt-2 text-gray-500">Únete a la comunidad estudiantil</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="space-y-5 rounded-2xl bg-white p-8 shadow-xl"
				>
					{error && (
						<div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-700 text-sm">
							<AlertCircle size={18} />
							{error}
						</div>
					)}

					<div>
						<label className="mb-1.5 block font-medium text-gray-700 text-sm">
							Nombre de usuario
						</label>
						<div className="relative">
							<User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="juanperez"
							/>
						</div>
					</div>

					<div>
						<label className="mb-1.5 block font-medium text-gray-700 text-sm">
							Correo Electrónico
						</label>
						<div className="relative">
							<Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="tu@email.com"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="mb-1.5 block font-medium text-gray-700 text-sm">
								Contraseña
							</label>
							<div className="relative">
								<Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
									placeholder="********"
								/>
							</div>
						</div>
						<div>
							<label className="mb-1.5 block font-medium text-gray-700 text-sm">
								Confirmar
							</label>
							<div className="relative">
								<Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
								<input
									type="password"
									required
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
									placeholder="********"
								/>
							</div>
						</div>
					</div>

					{/* Optional: University + Career */}
					<div className="border-gray-100 border-t pt-2">
						<p className="mb-3 text-gray-400 text-xs">
							Opcional - puedes configurarlo después
						</p>
						<div className="space-y-3">
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
									disabled={loadingUniversities}
									className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-400"
								>
									<option value="">
										{loadingUniversities
											? "Cargando universidades..."
											: universities.length === 0
												? "No hay universidades disponibles"
												: "Selecciona universidad..."}
									</option>
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
										<option value="">Selecciona carrera...</option>
										{careers.map((c) => (
											<option key={c._id} value={c._id}>
												{c.name}
											</option>
										))}
									</select>
								</div>
							)}
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? "Creando cuenta..." : "Registrarse"}
					</button>

					<p className="text-center text-gray-500 text-sm">
						¿Ya tienes cuenta?{" "}
						<Link
							to="/login"
							className="font-semibold text-primary hover:underline"
						>
							Inicia sesión
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}
