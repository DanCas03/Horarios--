"use client";

import { useEffect, useRef } from "react";

/**
 * Foco radial que sigue al puntero (adaptado de UI_prompts/Spotlight.md).
 * Alternativa ligera a GlowingEffect: escucha el puntero solo sobre su
 * contenedor (no sobre todo el documento), escribe dos custom properties
 * y deja el dibujo a CSS puro (.spotlight-halo/.spotlight-border en
 * index.css). Sin requestAnimationFrame ni framer-motion, y cero trabajo
 * mientras el cursor está fuera de la tarjeta. Colocar como primer hijo
 * de un contenedor `relative` con esquinas redondeadas.
 */
export default function SpotlightEffect({ className }: { className?: string }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const overlay = ref.current;
		const host = overlay?.parentElement;
		if (!overlay || !host) return;

		const move = (e: PointerEvent) => {
			const rect = host.getBoundingClientRect();
			overlay.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
			overlay.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
			overlay.style.opacity = "1";
		};
		const leave = () => {
			overlay.style.opacity = "0";
		};

		host.addEventListener("pointermove", move, { passive: true });
		host.addEventListener("pointerleave", leave);
		return () => {
			host.removeEventListener("pointermove", move);
			host.removeEventListener("pointerleave", leave);
		};
	}, []);

	return (
		<div
			ref={ref}
			aria-hidden="true"
			style={{ opacity: 0 }}
			className={`spotlight-effect pointer-events-none absolute inset-0 rounded-[inherit] ${className ?? ""}`}
		>
			<div className="spotlight-halo absolute inset-0 rounded-[inherit]" />
			<div className="spotlight-border absolute inset-0 rounded-[inherit]" />
		</div>
	);
}
