import type { CSSProperties } from "react";

/**
 * Trazos SVG flotantes decorativos (adaptado de UI_prompts/background.md).
 * La animación es 100% CSS (`stroke-dashoffset` con periodo exacto, ver
 * `.floating-path` en index.css): sin framer-motion no hay reinicios de
 * ciclo ni conflicto con la transición universal de opacity, que era lo
 * que hacía parpadear la página. Los trazos heredan `currentColor` del
 * contenedor (clases text-* y opacity-*); cada sexto trazo usa el ámbar
 * de la marca.
 */
export default function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 7 * position} -${189 + i * 9}C-${
			380 - i * 7 * position
		} -${189 + i * 9} -${312 - i * 7 * position} ${216 - i * 9} ${
			152 - i * 7 * position
		} ${343 - i * 9}C${616 - i * 7 * position} ${470 - i * 9} ${
			684 - i * 7 * position
		} ${875 - i * 9} ${684 - i * 7 * position} ${875 - i * 9}`,
		width: 0.9 + i * 0.06,
	}));

	return (
		<div className="pointer-events-none absolute inset-0 transform-gpu">
			<svg
				className="h-full w-full"
				viewBox="0 0 696 316"
				fill="none"
				preserveAspectRatio="xMidYMid slice"
				aria-hidden="true"
			>
				{paths.map((path) => (
					<path
						key={path.id}
						className="floating-path"
						d={path.d}
						pathLength={1}
						stroke={path.id % 6 === 3 ? "var(--color-accent)" : "currentColor"}
						strokeWidth={path.width}
						strokeOpacity={0.25 + path.id * 0.028}
						strokeLinecap="round"
						style={
							{
								"--float-duration": `${18 + (path.id % 5) * 2.6}s`,
								"--float-delay": `-${((path.id * 2.3) % 18).toFixed(1)}s`,
							} as CSSProperties
						}
					/>
				))}
			</svg>
		</div>
	);
}
