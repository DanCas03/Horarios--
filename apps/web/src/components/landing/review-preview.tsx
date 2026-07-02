import { Star, ThumbsUp } from "lucide-react";

/**
 * Vista previa estática de las reseñas anónimas que se muestra como
 * segunda tarjeta del carrusel del hero. Solo decorativa.
 */

type PreviewReview = {
	subject: string;
	code: string;
	rating: number;
	period: string;
	comment: string;
	helpful: number;
	tag: string;
};

const REVIEWS: PreviewReview[] = [
	{
		subject: "Cálculo I",
		code: "MAT-1115",
		rating: 5,
		period: "2025-15",
		comment:
			"Explica con calma y los parciales salen de las guías. Vayan a las horas de consulta, valen oro.",
		helpful: 24,
		tag: "Da buenos tips",
	},
	{
		subject: "Programación II",
		code: "PRG-2201",
		rating: 4,
		period: "2024-25",
		comment:
			"Proyectos exigentes pero se aprende muchísimo. Empiecen el proyecto final desde la semana uno.",
		helpful: 18,
		tag: "Exigente y justo",
	},
];

function Stars({ value, size = 11 }: { value: number; size?: number }) {
	return (
		<span className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((n) => (
				<Star
					key={n}
					size={size}
					className={
						n <= value
							? "fill-accent text-accent"
							: "fill-gray-200 text-gray-200"
					}
				/>
			))}
		</span>
	);
}

export default function ReviewPreview() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none flex h-full w-full select-none flex-col overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5"
		>
			{/* Barra tipo navegador */}
			<div className="flex items-center gap-2 border-gray-100 border-b bg-gray-50/80 px-4 py-2.5">
				<span className="h-2.5 w-2.5 rounded-full bg-red-300" />
				<span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
				<span className="h-2.5 w-2.5 rounded-full bg-green-300" />
				<span className="mx-auto rounded-md bg-white px-3 py-1 font-mono text-[10px] text-gray-400 ring-1 ring-black/5">
					guia-estudiantil.app/reviews
				</span>
				<span className="w-14" />
			</div>

			{/* Encabezado con promedio */}
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-6">
				<div>
					<p className="font-bold text-gray-900 text-sm">Reseñas Anónimas</p>
					<p className="text-[11px] text-gray-400">
						Materias y profesores · Comunidad estudiantil
					</p>
				</div>
				<div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 ring-1 ring-black/5">
					<p className="font-bold text-gray-900 text-sm tabular-nums">4.6</p>
					<Stars value={5} size={10} />
					<p className="text-[9px] text-gray-400">128 reseñas</p>
				</div>
			</div>

			{/* Tarjetas de reseña */}
			<div className="flex min-h-0 flex-1 flex-col gap-2.5 px-4 pb-4 md:gap-3 md:px-6 md:pb-6">
				{REVIEWS.map((r) => (
					<div
						key={r.code}
						className="flex min-h-0 flex-1 flex-col justify-between rounded-lg bg-gray-50/70 p-3 ring-1 ring-black/5 md:p-4"
					>
						<div>
							<div className="flex items-center justify-between gap-2">
								<p className="font-semibold text-gray-900 text-xs md:text-sm">
									{r.subject}
									<span className="ml-1.5 font-mono text-[9px] text-gray-400 md:text-[10px]">
										{r.code}
									</span>
								</p>
								<Stars value={r.rating} />
							</div>
							<p className="mt-1.5 line-clamp-2 text-[10px] text-gray-500 leading-relaxed md:line-clamp-3 md:text-xs">
								“{r.comment}”
							</p>
						</div>
						<div className="mt-2 flex items-center gap-2">
							<span className="flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 font-medium text-[9px] text-primary ring-1 ring-primary/10">
								<ThumbsUp size={9} /> Útil · {r.helpful}
							</span>
							<span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-[9px] text-amber-700 ring-1 ring-amber-200/60">
								{r.tag}
							</span>
							<span className="ml-auto text-[9px] text-gray-400">
								{r.period}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
