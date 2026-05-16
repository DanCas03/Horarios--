"use client";

import {
	BookOpen,
	Calendar,
	ChevronRight,
	GraduationCap,
	MessageSquare,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/context/auth-context";

const features = [
	{
		icon: BookOpen,
		title: "Seguimiento de Pensum",
		desc: "Visualiza tu avance académico, marca materias aprobadas y conoce tus prelaciones.",
	},
	{
		icon: Calendar,
		title: "Planificación de Horarios",
		desc: "Organiza tus próximos semestres con materias tentativas y genera horarios óptimos.",
	},
	{
		icon: MessageSquare,
		title: "Reseñas Anónimas",
		desc: "Comparte y consulta opiniones sobre materias y profesores de forma anónima.",
	},
	{
		icon: TrendingUp,
		title: "Análisis Inteligente",
		desc: "Recibe sugerencias basadas en tu progreso, dificultad y objetivos académicos.",
	},
];

export default function Home() {
	const { user } = useAuth();

	return (
		<div>
			<section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary-dark text-white">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-accent blur-3xl" />
					<div className="absolute right-10 bottom-10 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
				</div>
				<div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
					<div className="mx-auto max-w-3xl text-center">
						<div className="mb-6 flex justify-center">
							<GraduationCap className="h-16 w-16 text-accent" />
						</div>
						<h1 className="mb-6 font-extrabold text-4xl tracking-tight md:text-6xl">
							Tu Guía Académica
							<span className="mt-2 block text-accent">Universitaria</span>
						</h1>
						<p className="mb-10 text-lg text-white/80 leading-relaxed md:text-xl">
							Planifica tu carrera de forma inteligente. Seguimiento de pensum,
							horarios optimizados y reseñas de la comunidad estudiantil para la
							UCAB y la UNIMET.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							{user ? (
								<Link
									href="/pensum"
									className="flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-bold text-primary-dark shadow-lg hover:bg-amber-400"
								>
									Ir a Mi Pensum <ChevronRight size={20} />
								</Link>
							) : (
								<>
									<Link
										href="/register"
										className="flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-bold text-primary-dark shadow-lg hover:bg-amber-400"
									>
										Comenzar Ahora <ChevronRight size={20} />
									</Link>
									<Link
										href="/login"
										className="rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur hover:bg-white/20"
									>
										Ya tengo cuenta
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="cursor-pointer rounded-2xl border-ucab-green border-t-4 bg-white p-8 shadow-xl hover:shadow-2xl">
						<div className="mb-4 flex items-center gap-4">
							<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ucab-green/10">
								<span className="font-extrabold text-lg text-ucab-green">
									UCAB
								</span>
							</div>
							<div>
								<h3 className="font-bold text-gray-900 text-lg">
									Universidad Católica Andrés Bello
								</h3>
								<p className="text-gray-500 text-sm">Sistema Semestral</p>
							</div>
						</div>
						<p className="text-gray-600 text-sm">
							Accede al pensum de todas las carreras de la UCAB, planifica tus
							semestres y consulta reseñas.
						</p>
					</div>

					<div className="cursor-pointer rounded-2xl border-unimet-blue border-t-4 bg-white p-8 shadow-xl hover:shadow-2xl">
						<div className="mb-4 flex items-center gap-4">
							<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-unimet-blue/10">
								<span className="font-extrabold text-lg text-unimet-blue">
									UNIMET
								</span>
							</div>
							<div>
								<h3 className="font-bold text-gray-900 text-lg">
									Universidad Metropolitana
								</h3>
								<p className="text-gray-500 text-sm">Sistema Trimestral</p>
							</div>
						</div>
						<p className="text-gray-600 text-sm">
							Explora los programas de la UNIMET, marca tu progreso y organiza
							tus trimestres.
						</p>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
				<div className="mb-16 text-center">
					<h2 className="font-extrabold text-3xl text-gray-900 md:text-4xl">
						Todo lo que necesitas para tu vida académica
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-gray-500 text-lg">
						Herramientas diseñadas por y para estudiantes universitarios
						venezolanos.
					</p>
				</div>
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
					{features.map((f) => (
						<div
							key={f.title}
							className="group rounded-2xl bg-white p-6 shadow-md hover:shadow-xl"
						>
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-accent/20">
								<f.icon className="h-6 w-6 text-primary group-hover:text-accent" />
							</div>
							<h3 className="mb-2 font-bold text-gray-900">{f.title}</h3>
							<p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
