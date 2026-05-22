"use client";

import { BookOpen, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useReveal } from "@/hooks/use-reveal";

const features = [
	{
		icon: BookOpen,
		title: "Seguimiento de Pensum",
		desc: "Visualiza tu avance académico, marca materias aprobadas y conoce tus prelaciones automáticamente.",
	},
	{
		icon: Calendar,
		title: "Planificación de Horarios",
		desc: "Organiza tus próximos semestres con materias tentativas y genera horarios óptimos.",
	},
	{
		icon: MessageSquare,
		title: "Reseñas Anónimas",
		desc: "Comparte y consulta opiniones sobre materias y profesores de forma completamente anónima.",
	},
	{
		icon: TrendingUp,
		title: "Análisis Inteligente",
		desc: "Recibe sugerencias basadas en tu progreso, dificultad y objetivos académicos.",
	},
];

export default function Home() {
	const { user } = useAuth();
	useReveal();

	return (
		<div>
			{/* ─── HERO ─────────────────────────────────────────────────────── */}
			<section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-primary-dark text-white">
				{/* Ambient orbs */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -top-40 -left-40 h-[700px] w-[700px] rounded-full bg-primary-light/40 blur-[120px]" />
					<div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-accent/15 blur-[130px]" />
					<div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[80px]" />
				</div>

				<div className="relative mx-auto max-w-7xl px-4 py-40 sm:px-6 lg:px-8">
					<div className="max-w-4xl">
						{/* Eyebrow tag */}
						<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
							<span className="font-semibold text-[11px] text-white/60 uppercase tracking-[0.2em]">
								Plataforma Estudiantil · UCAB & UNIMET
							</span>
						</div>

						<h1 className="mb-8 text-balance font-extrabold text-6xl leading-[0.95] tracking-tighter md:text-8xl">
							Tu Guía
							<br />
							<span className="bg-gradient-to-r from-accent via-amber-300 to-accent/70 bg-clip-text text-transparent">
								Académica
							</span>
							<br />
							Universitaria
						</h1>

						<p className="mb-12 max-w-2xl text-balance text-lg text-white/60 leading-relaxed md:text-xl">
							Planifica tu carrera de forma inteligente. Seguimiento de pensum,
							horarios optimizados y reseñas de la comunidad estudiantil.
						</p>

						<div className="flex flex-wrap items-center gap-4">
							{user ? (
								<Link
									href="/pensum"
									className="group flex items-center gap-3 rounded-full bg-accent px-7 py-4 font-bold text-primary-dark shadow-[0_8px_24px_rgba(229,156,36,0.4)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(229,156,36,0.5)] active:scale-[0.98]"
								>
									Ir a Mi Pensum
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
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
								</Link>
							) : (
								<>
									<Link
										href="/register"
										className="group flex items-center gap-3 rounded-full bg-accent px-7 py-4 font-bold text-primary-dark shadow-[0_8px_24px_rgba(229,156,36,0.4)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(229,156,36,0.5)] active:scale-[0.98]"
									>
										Comenzar Gratis
										<span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
											<svg
												width="12"
												height="12"
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M2 10L10 2M10 2H4M10 2V8"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</span>
									</Link>
									<Link
										href="/login"
										className="rounded-full border border-white/10 bg-white/5 px-7 py-4 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-95"
									>
										Ya tengo cuenta
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* ─── UNIVERSITIES (Asymmetric Z-Axis cards) ──────────────────── */}
			<section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2 md:items-start">
					{/* Double-Bezel card — UCAB */}
					<div className="reveal rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5">
						<div className="group relative cursor-pointer overflow-hidden rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(13,95,56,0.1)]">
							<div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-ucab-green to-ucab-gold" />
							<div className="mb-6 flex items-center gap-4">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ucab-green/8 ring-1 ring-ucab-green/15 transition-colors group-hover:bg-ucab-green/12">
									<span className="font-extrabold text-sm text-ucab-green tracking-tight">
										UCAB
									</span>
								</div>
								<div>
									<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
										Universidad Católica
									</h3>
									<p className="font-medium text-gray-400 text-sm">
										Sistema Semestral
									</p>
								</div>
							</div>
							<p className="text-gray-500 text-sm leading-relaxed">
								Accede al pensum de todas las carreras de la UCAB, planifica tus
								semestres y consulta reseñas de la comunidad.
							</p>
						</div>
					</div>

					{/* Double-Bezel card — UNIMET (offset) */}
					<div className="reveal reveal-delay-2 rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5 md:mt-16">
						<div className="group relative cursor-pointer overflow-hidden rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(17,54,89,0.1)]">
							<div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-unimet-blue to-unimet-gold" />
							<div className="mb-6 flex items-center gap-4">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-unimet-blue/8 ring-1 ring-unimet-blue/15 transition-colors group-hover:bg-unimet-blue/12">
									<span className="font-extrabold text-sm text-unimet-blue tracking-tight">
										UNIMET
									</span>
								</div>
								<div>
									<h3 className="font-extrabold text-gray-900 text-xl tracking-tight">
										Universidad Metropolitana
									</h3>
									<p className="font-medium text-gray-400 text-sm">
										Sistema Trimestral
									</p>
								</div>
							</div>
							<p className="text-gray-500 text-sm leading-relaxed">
								Explora los programas de la UNIMET, marca tu progreso y organiza
								tus trimestres de forma eficiente.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURES ─────────────────────────────────────────────────── */}
			<section className="mx-auto max-w-7xl px-4 py-40 sm:px-6 lg:px-8">
				{/* Section header */}
				<div className="reveal mb-24 max-w-2xl">
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1.5 shadow-sm ring-1 ring-black/5">
						<span className="h-1.5 w-1.5 rounded-full bg-accent" />
						<span className="font-semibold text-[10px] text-gray-500 uppercase tracking-[0.2em]">
							Características Premium
						</span>
					</div>
					<h2 className="text-balance font-extrabold text-5xl text-gray-900 leading-[0.95] tracking-tighter md:text-6xl">
						Todo lo que necesitas
						<br />
						<span className="text-primary/50">para tu vida académica</span>
					</h2>
					<p className="mt-8 text-balance text-gray-500 text-lg leading-relaxed">
						Herramientas diseñadas por y para estudiantes universitarios
						venezolanos.
					</p>
				</div>

				{/* Feature grid — asymmetric bento */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{features.map((f, i) => (
						<div
							key={f.title}
							className={`reveal reveal-delay-${i + 1} rounded-[2rem] bg-black/[0.02] p-2 ring-1 ring-black/5 ${i === 0 ? "lg:col-span-2" : ""}`}
						>
							<div className="group h-full rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgb(0,0,0,0.06)]">
								<div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-black/5 transition-all duration-500 group-hover:scale-105 group-hover:bg-primary group-hover:ring-primary">
									<f.icon className="h-6 w-6 text-gray-500 transition-colors duration-300 group-hover:text-white" />
								</div>
								<h3 className="mb-4 font-extrabold text-gray-900 text-xl tracking-tight">
									{f.title}
								</h3>
								<p className="text-gray-500 text-sm leading-relaxed">
									{f.desc}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ─── CTA ──────────────────────────────────────────────────────── */}
			{!user && (
				<section className="mx-auto max-w-7xl px-4 pb-40 sm:px-6 lg:px-8">
					<div className="reveal rounded-[2rem] bg-primary p-2 ring-1 ring-primary/20">
						<div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] bg-primary-dark p-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
							<div className="pointer-events-none absolute inset-0">
								<div className="absolute top-0 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[60px]" />
							</div>
							<div className="relative">
								<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
									<span className="font-semibold text-[10px] text-white/50 uppercase tracking-[0.2em]">
										Completamente Gratis
									</span>
								</div>
								<h2 className="mb-6 text-balance font-extrabold text-4xl text-white tracking-tighter md:text-5xl">
									Empieza a planificar
									<br />
									tu carrera hoy
								</h2>
								<p className="mx-auto mb-10 max-w-lg text-white/50 leading-relaxed">
									Sin costos ocultos. Sin anuncios. Solo una herramienta rápida
									y confiable para que te concentres en lo que importa.
								</p>
								<Link
									href="/register"
									className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 font-bold text-primary-dark shadow-[0_8px_24px_rgba(229,156,36,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(229,156,36,0.6)] active:scale-[0.98]"
								>
									Crear Cuenta Gratis
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
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
								</Link>
							</div>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
