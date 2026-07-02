/**
 * Vista previa estática del planificador de horarios que se muestra
 * dentro de la tarjeta 3D del hero. Solo decorativa.
 */

type PreviewBlock = {
	code: string;
	time: string;
	tone: string;
	grow: number;
};

type PreviewDay = {
	name: string;
	blocks: PreviewBlock[];
};

const DAYS: PreviewDay[] = [
	{
		name: "Lun",
		blocks: [
			{
				code: "MAT-1115",
				time: "7:00",
				tone: "bg-blue-100 text-blue-800 ring-blue-200",
				grow: 2,
			},
			{
				code: "FIS-2101",
				time: "9:00",
				tone: "bg-emerald-100 text-emerald-800 ring-emerald-200",
				grow: 2,
			},
		],
	},
	{
		name: "Mar",
		blocks: [
			{
				code: "PRG-2201",
				time: "8:00",
				tone: "bg-violet-100 text-violet-800 ring-violet-200",
				grow: 3,
			},
			{
				code: "ING-3305",
				time: "14:00",
				tone: "bg-amber-100 text-amber-800 ring-amber-200",
				grow: 2,
			},
		],
	},
	{
		name: "Mié",
		blocks: [
			{
				code: "MAT-1115",
				time: "7:00",
				tone: "bg-blue-100 text-blue-800 ring-blue-200",
				grow: 2,
			},
			{
				code: "LAB-2102",
				time: "10:00",
				tone: "bg-rose-100 text-rose-800 ring-rose-200",
				grow: 3,
			},
		],
	},
	{
		name: "Jue",
		blocks: [
			{
				code: "PRG-2201",
				time: "8:00",
				tone: "bg-violet-100 text-violet-800 ring-violet-200",
				grow: 3,
			},
		],
	},
	{
		name: "Vie",
		blocks: [
			{
				code: "HUM-1103",
				time: "11:00",
				tone: "bg-amber-100 text-amber-800 ring-amber-200",
				grow: 2,
			},
			{
				code: "FIS-2101",
				time: "14:00",
				tone: "bg-emerald-100 text-emerald-800 ring-emerald-200",
				grow: 2,
			},
		],
	},
];

const STATS = [
	{ label: "Materias", value: "6" },
	{ label: "Créditos", value: "21" },
	{ label: "Avance", value: "68%" },
];

export default function AppPreview() {
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
					guia-estudiantil.app/schedule
				</span>
				<span className="w-14" />
			</div>

			{/* Encabezado del dashboard */}
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-6">
				<div>
					<p className="font-bold text-gray-900 text-sm">
						Mi Horario · 2025-15
					</p>
					<p className="text-[11px] text-gray-400">
						Ing. Informática · Semestre 6
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

			{/* Grid semanal */}
			<div className="grid min-h-0 flex-1 grid-cols-5 gap-1.5 px-4 pb-4 md:gap-2 md:px-6 md:pb-6">
				{DAYS.map((day) => (
					<div key={day.name} className="flex min-h-0 flex-col gap-1.5">
						<p className="text-center font-semibold text-[10px] text-gray-400 uppercase tracking-wider">
							{day.name}
						</p>
						{day.blocks.map((b) => (
							<div
								key={`${day.name}-${b.code}`}
								style={{ flexGrow: b.grow }}
								className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 ring-1 ${b.tone}`}
							>
								<p className="font-mono font-semibold text-[9px] leading-tight md:text-[11px]">
									{b.code}
								</p>
								<p className="text-[8px] opacity-70 md:text-[10px]">{b.time}</p>
							</div>
						))}
						<div className="min-h-4 flex-1 rounded-lg border border-gray-100 border-dashed" />
					</div>
				))}
			</div>
		</div>
	);
}
