import { Check, Lock } from "lucide-react";

/**
 * Vista previa estática del pensum con el cálculo de créditos que se
 * muestra como tercera tarjeta del carrusel del hero. Solo decorativa.
 */

type PreviewSubject = {
	code: string;
	state: "aprobada" | "cursando" | "bloqueada";
};

const SEMESTERS: { name: string; subjects: PreviewSubject[] }[] = [
	{
		name: "Semestre 6",
		subjects: [
			{ code: "PRG-3301", state: "aprobada" },
			{ code: "BDD-3302", state: "cursando" },
			{ code: "RED-3303", state: "cursando" },
		],
	},
	{
		name: "Semestre 7",
		subjects: [
			{ code: "ING-4401", state: "bloqueada" },
			{ code: "SIS-4402", state: "bloqueada" },
			{ code: "ELE-4403", state: "bloqueada" },
		],
	},
];

const STATE_STYLES: Record<PreviewSubject["state"], string> = {
	aprobada: "bg-primary/8 text-primary ring-primary/15",
	cursando: "bg-amber-100 text-amber-800 ring-amber-200",
	bloqueada: "bg-gray-100 text-gray-400 ring-gray-200",
};

const STATS = [
	{ label: "Aprobados", value: "142" },
	{ label: "En curso", value: "18" },
	{ label: "Restantes", value: "40" },
];

export default function PensumPreview() {
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
					guia-estudiantil.app/pensum
				</span>
				<span className="w-14" />
			</div>

			{/* Encabezado con créditos */}
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-6">
				<div>
					<p className="font-bold text-gray-900 text-sm">
						Mi Pensum · Ing. Informática
					</p>
					<p className="text-[11px] text-gray-400">
						200 créditos · 10 semestres
					</p>
				</div>
				<div className="flex gap-2">
					{STATS.map((s) => (
						<div
							key={s.label}
							className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-center ring-1 ring-black/5"
						>
							<p className="font-bold text-gray-900 text-xs tabular-nums">
								{s.value}
							</p>
							<p className="text-[9px] text-gray-400">{s.label}</p>
						</div>
					))}
				</div>
			</div>

			{/* Avance de carrera con la barra de marca */}
			<div className="px-4 md:px-6">
				<div className="mb-1.5 flex items-baseline justify-between">
					<p className="font-semibold text-[10px] text-gray-400 uppercase tracking-wider">
						Avance de carrera
					</p>
					<p className="font-bold text-gray-900 text-xs tabular-nums">71%</p>
				</div>
				<div className="h-2.5 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5">
					<div className="progress-fill relative h-full w-[71%] overflow-hidden rounded-full">
						<div className="progress-shimmer" />
					</div>
				</div>
				<p className="mt-1.5 text-[10px] text-gray-400">
					142 de 200 créditos aprobados
				</p>
			</div>

			{/* Semestres con estados de materia */}
			<div className="grid min-h-0 flex-1 grid-cols-2 gap-2 px-4 pt-3 pb-4 md:gap-3 md:px-6 md:pb-6">
				{SEMESTERS.map((sem) => (
					<div
						key={sem.name}
						className="flex min-h-0 flex-col gap-1.5 rounded-lg bg-gray-50/70 p-2.5 ring-1 ring-black/5 md:p-3"
					>
						<p className="font-semibold text-[9px] text-gray-400 uppercase tracking-wider md:text-[10px]">
							{sem.name}
						</p>
						{sem.subjects.map((s) => (
							<div
								key={s.code}
								className={`flex flex-1 items-center justify-between rounded-md px-2 py-1.5 ring-1 ${STATE_STYLES[s.state]}`}
							>
								<p className="font-mono font-semibold text-[9px] md:text-[11px]">
									{s.code}
								</p>
								{s.state === "aprobada" && <Check size={10} />}
								{s.state === "cursando" && (
									<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
								)}
								{s.state === "bloqueada" && <Lock size={10} />}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
