import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="mt-auto border-t border-gray-100 bg-white py-16 text-gray-400">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
					{/* Brand */}
					<div className="max-w-xs">
						<div className="mb-4 flex items-center gap-2">
							<GraduationCap className="h-6 w-6 text-accent" />
							<span className="font-extrabold text-gray-900 tracking-tight">Guía Estudiantil</span>
						</div>
						<p className="text-sm text-gray-400 leading-relaxed">
							Planifica tu carrera universitaria con inteligencia.
							Diseñado por y para estudiantes venezolanos.
						</p>
					</div>

					{/* Links */}
					<div className="flex flex-wrap gap-12 text-sm">
						<div className="flex flex-col gap-3">
							<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">Universidades</span>
							<span className="cursor-pointer transition-colors hover:text-gray-900">UCAB</span>
							<span className="cursor-pointer transition-colors hover:text-gray-900">UNIMET</span>
						</div>
						<div className="flex flex-col gap-3">
							<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">Plataforma</span>
							<Link href="/pensum" className="transition-colors hover:text-gray-900">Pensum</Link>
							<Link href="/schedule" className="transition-colors hover:text-gray-900">Horarios</Link>
							<Link href="/reviews" className="transition-colors hover:text-gray-900">Reseñas</Link>
						</div>
						<div className="flex flex-col gap-3">
							<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">Legal</span>
							<Link href="#" className="transition-colors hover:text-gray-900">Privacidad</Link>
							<Link href="#" className="transition-colors hover:text-gray-900">Términos de Servicio</Link>
						</div>
					</div>
				</div>

				<div className="mt-16 border-t border-gray-100 pt-8 text-xs text-gray-300">
					© {new Date().getFullYear()} Guía Estudiantil. Todos los derechos reservados.
				</div>
			</div>
		</footer>
	);
}
