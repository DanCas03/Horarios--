import { GraduationCap } from "lucide-react";
import React from "react";

export default function Footer() {
	return (
		<footer className="mt-auto bg-primary-dark py-8 text-white/70">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div className="flex items-center gap-2">
						<GraduationCap className="h-6 w-6 text-accent" />
						<span className="font-semibold text-white">Guía Estudiantil</span>
					</div>
					<div className="flex gap-8 text-sm">
						<span>UCAB</span>
						<span>UNIMET</span>
					</div>
					<p className="text-sm">
						&copy; {new Date().getFullYear()} Guía Estudiantil. Todos los
						derechos reservados.
					</p>
				</div>
			</div>
		</footer>
	);
}
