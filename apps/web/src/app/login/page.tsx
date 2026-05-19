"use client";

import { AlertCircle, GraduationCap, Lock, Mail } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type SyntheticEvent, useState } from "react";

import { parseApiError } from "@/api/client";
import { useAuth } from "@/context/auth-context";

function LoginContent() {
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
		<div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-24 overflow-hidden">
			{/* Ambient background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-light/20 blur-[100px]" />
				<div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-accent/15 blur-[80px]" />
			</div>

			<div className="relative w-full max-w-md z-10">
				{/* Header */}
				<div className="mb-10 text-center">
					{/* Double-bezel logo icon */}
					<div className="mx-auto mb-8 w-fit p-2 rounded-[1.5rem] bg-black/[0.04] ring-1 ring-black/8">
						<div className="flex h-16 w-16 items-center justify-center rounded-[calc(1.5rem-0.5rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-black/5">
							<GraduationCap className="h-8 w-8 text-primary" />
						</div>
					</div>

					{/* Eyebrow */}
					<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1 shadow-sm">
						<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
							Acceso Seguro
						</span>
					</div>
					<h1 className="font-extrabold text-4xl tracking-tighter text-gray-900">
						Bienvenido de vuelta
					</h1>
					<p className="mt-3 text-gray-400 font-medium">
						Accede a tu planificación académica
					</p>
				</div>

				{/* Double-bezel form card */}
				<div className="p-2 rounded-[2rem] bg-black/[0.025] ring-1 ring-black/8">
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
							<label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
								Correo Electrónico
							</label>
							<div className="relative group">
								<Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-300 transition-colors duration-300 group-focus-within:text-primary" />
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-3.5 pr-4 pl-11 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-gray-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08] hover:border-gray-200"
									placeholder="tu@email.com"
								/>
							</div>
						</div>

						<div>
							<label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
								Contraseña
							</label>
							<div className="relative group">
								<Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-300 transition-colors duration-300 group-focus-within:text-primary" />
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-3.5 pr-4 pl-11 text-gray-900 text-sm outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-gray-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.08] hover:border-gray-200"
									placeholder="••••••••"
								/>
							</div>
						</div>

						{/* Button-in-button pill CTA */}
						<button
							type="submit"
							disabled={loading}
							className="group mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 font-semibold text-white shadow-[0_6px_20px_rgba(31,54,83,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,54,83,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
						>
							{loading ? (
								<>
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
									Ingresando...
								</>
							) : (
								<>
									Iniciar Sesión
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-white/15">
										<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
											<path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</span>
								</>
							)}
						</button>

						<p className="text-center text-gray-400 text-sm">
							¿No tienes cuenta?{" "}
							<Link
								href="/register"
								className="font-semibold text-primary transition-opacity hover:opacity-70"
							>
								Regístrate aquí
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div className="flex min-h-[100dvh] items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>}>
			<LoginContent />
		</Suspense>
	);
}
