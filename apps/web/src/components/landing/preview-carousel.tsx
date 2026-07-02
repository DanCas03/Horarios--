"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import AppPreview from "./app-preview";
import PensumPreview from "./pensum-preview";
import ReviewPreview from "./review-preview";

/**
 * Carrusel de vistas de la app dentro de la tarjeta 3D del hero: horario,
 * reseñas y pensum. Las tarjetas se deslizan en horizontal con la curva
 * resorte de la marca; como todo vive dentro de ContainerScroll, cada
 * vista conserva la animación de scroll de la tarjeta.
 */

const SLIDES = [
	{ key: "horario", label: "vista de horarios", Component: AppPreview },
	{ key: "resenas", label: "vista de reseñas", Component: ReviewPreview },
	{ key: "pensum", label: "vista de pensum", Component: PensumPreview },
];

export default function PreviewCarousel() {
	const [index, setIndex] = useState(0);
	const go = (dir: number) =>
		setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

	return (
		<div className="relative h-full w-full">
			{/* Pista deslizante */}
			<div className="h-full w-full overflow-hidden rounded-xl">
				<div
					className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
					style={{ transform: `translateX(-${index * 100}%)` }}
				>
					{SLIDES.map(({ key, Component }) => (
						<div key={key} className="h-full w-full flex-shrink-0">
							<Component />
						</div>
					))}
				</div>
			</div>

			{/* Flechas: chevrones desnudos con sombra, sin caja de botón */}
			<button
				type="button"
				onClick={() => go(-1)}
				aria-label="Vista anterior"
				className="absolute top-1/2 left-2.5 z-10 -translate-y-1/2 text-primary/70 drop-shadow-[0_2px_5px_rgba(18,33,53,0.35)] transition-all hover:scale-110 hover:text-primary active:scale-90"
			>
				<ChevronLeft size={30} strokeWidth={2.5} />
			</button>
			<button
				type="button"
				onClick={() => go(1)}
				aria-label="Vista siguiente"
				className="absolute top-1/2 right-2.5 z-10 -translate-y-1/2 text-primary/70 drop-shadow-[0_2px_5px_rgba(18,33,53,0.35)] transition-all hover:scale-110 hover:text-primary active:scale-90"
			>
				<ChevronRight size={30} strokeWidth={2.5} />
			</button>

			{/* Puntos indicadores */}
			<div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
				{SLIDES.map((s, i) => (
					<button
						key={s.key}
						type="button"
						aria-label={`Ir a la ${s.label}`}
						aria-current={i === index}
						onClick={() => setIndex(i)}
						className={
							i === index
								? "h-1.5 w-6 rounded-full bg-accent"
								: "h-1.5 w-1.5 rounded-full bg-primary/20 hover:bg-primary/40"
						}
					/>
				))}
			</div>
		</div>
	);
}
