"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Trazos SVG flotantes decorativos (adaptado de UI_prompts/background.md).
 * Los paths heredan `currentColor`: controla color e intensidad desde el
 * contenedor con clases text-* y opacity-*. Con prefers-reduced-motion los
 * trazos se dibujan estáticos.
 */
export default function FloatingPaths({ position }: { position: number }) {
	const reduceMotion = useReducedMotion();

	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full"
				viewBox="0 0 696 316"
				fill="none"
				preserveAspectRatio="xMidYMid slice"
				aria-hidden="true"
			>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={
							reduceMotion ? undefined : { pathLength: 0.3, opacity: 0.6 }
						}
						animate={
							reduceMotion
								? undefined
								: {
										pathLength: 1,
										opacity: [0.3, 0.6, 0.3],
										pathOffset: [0, 1, 0],
									}
						}
						transition={
							reduceMotion
								? undefined
								: {
										duration: 22 + (path.id % 6) * 1.8,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}
						}
					/>
				))}
			</svg>
		</div>
	);
}
