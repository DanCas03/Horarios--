/**
 * Logo de marca "Guía Estudiantil" — birrete (mortarboard) geométrico.
 * El cuerpo usa `currentColor` (controlable por className: ej. `text-accent`),
 * la borla usa el color de acento de marca.
 */
export default function Logo({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			role="img"
			aria-label="Guía Estudiantil"
		>
			<title>Guía Estudiantil</title>
			{/* Tablero del birrete */}
			<path d="M24 7 L45 17 L24 27 L3 17 Z" fill="currentColor" />
			{/* Base del birrete */}
			<path
				d="M14 22.3 L24 27 L34 22.3 L34 32 C34 35.3 29.5 37.5 24 37.5 C18.5 37.5 14 35.3 14 32 Z"
				fill="currentColor"
				opacity="0.55"
			/>
			{/* Borla (acento) */}
			<path
				d="M43 17.5 L43 28"
				stroke="#e59c24"
				strokeWidth="2.2"
				strokeLinecap="round"
			/>
			<circle cx="43" cy="30.5" r="2.6" fill="#e59c24" />
		</svg>
	);
}
