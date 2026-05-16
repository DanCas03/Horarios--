"use client";

import { AlertCircle, GraduationCap, Lock, Mail } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useState } from "react";

import { parseApiError } from "@/api/client";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
	const { login } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = (searchParams.get("next") || "/pensum") as Route;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(email, password);
			router.push(nextPath);
		} catch (err: unknown) {
			setError(parseApiError(err, "Error al iniciar sesión"));
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
						Iniciar Sesión
					</h1>
					<p className="mt-2 text-gray-500">
						Accede a tu planificación académica
					</p>
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
							Correo Electrónico
						</label>
						<div className="relative">
							<Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="tu@email.com"
							/>
						</div>
					</div>

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
								className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
								placeholder="********"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? "Ingresando..." : "Iniciar Sesión"}
					</button>

					<p className="text-center text-gray-500 text-sm">
						¿No tienes cuenta?{" "}
						<Link
							href="/register"
							className="font-semibold text-primary hover:underline"
						>
							Regístrate aquí
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}
