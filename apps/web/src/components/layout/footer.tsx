"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/logo";

function FooterContent() {
	const searchParams = useSearchParams();
	const isNavDisabled =
		searchParams.get("firstTime") === "true" ||
		searchParams.get("disableNav") === "true";

	if (isNavDisabled) return null;

	return (
		<footer className="mt-auto border-gray-100 border-t bg-white py-16 text-gray-400">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
					{/* Brand */}
					<div className="max-w-xs">
						<div className="mb-4 flex items-center gap-2">
							<Logo className="h-6 w-6 text-accent" />
							<span className="font-extrabold text-gray-900 tracking-tight">
								Guía Estudiantil
							</span>
						</div>
						<p className="text-gray-400 text-sm leading-relaxed">
							Planifica tu carrera universitaria con inteligencia. Diseñado por
							y para estudiantes venezolanos.
						</p>
					</div>

					{/* Links */}
					<div className="flex flex-wrap gap-12 text-sm">
						<div className="flex flex-col gap-3">
							<span className="font-bold text-[10px] text-gray-300 uppercase tracking-[0.2em]">
								Universidades
							</span>
							<span className="cursor-pointer transition-colors hover:text-gray-900">
								UCAB
							</span>
							<span className="cursor-pointer transition-colors hover:text-gray-900">
								UNIMET
							</span>
						</div>
						<div className="flex flex-col gap-3">
							<span className="font-bold text-[10px] text-gray-300 uppercase tracking-[0.2em]">
								Plataforma
							</span>
							<Link
								href="/pensum"
								className="transition-colors hover:text-gray-900"
							>
								Pensum
							</Link>
							<Link
								href="/schedule"
								className="transition-colors hover:text-gray-900"
							>
								Horarios
							</Link>
							<Link
								href="/reviews"
								className="transition-colors hover:text-gray-900"
							>
								Reseñas
							</Link>
						</div>
						<div className="flex flex-col gap-3">
							<span className="font-bold text-[10px] text-gray-300 uppercase tracking-[0.2em]">
								Legal
							</span>
							<Link href="#" className="transition-colors hover:text-gray-900">
								Privacidad
							</Link>
							<Link href="#" className="transition-colors hover:text-gray-900">
								Términos de Servicio
							</Link>
						</div>
					</div>
				</div>

				<div className="mt-16 border-gray-100 border-t pt-8 text-gray-300 text-xs">
					© {new Date().getFullYear()} Guía Estudiantil. Todos los derechos
					reservados.
				</div>
			</div>
		</footer>
	);
}

export default function Footer() {
	return (
		<Suspense fallback={null}>
			<FooterContent />
		</Suspense>
	);
}
