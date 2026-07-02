"use client";

import { animate, useReducedMotion } from "framer-motion";
import {
	type CSSProperties,
	memo,
	useCallback,
	useEffect,
	useRef,
} from "react";

interface GlowingEffectProps {
	blur?: number;
	inactiveZone?: number;
	proximity?: number;
	spread?: number;
	glow?: boolean;
	className?: string;
	disabled?: boolean;
	movementDuration?: number;
	borderWidth?: number;
}

/**
 * Borde luminoso que sigue al puntero (adaptado de UI_prompts/Glowing.md).
 * Gradiente recoloreado con la paleta navy/ámbar de la marca. Colocar como
 * primer hijo de un contenedor `relative` con esquinas redondeadas; solo
 * pinta cuando el puntero ronda el borde. Con prefers-reduced-motion o
 * `disabled` queda inerte.
 */
const GlowingEffect = memo(
	({
		blur = 0,
		inactiveZone = 0.7,
		proximity = 0,
		spread = 20,
		glow = false,
		className,
		movementDuration = 2,
		borderWidth = 1,
		disabled = true,
	}: GlowingEffectProps) => {
		const reduceMotion = useReducedMotion();
		const isDisabled = disabled || !!reduceMotion;
		const containerRef = useRef<HTMLDivElement>(null);
		const lastPosition = useRef({ x: 0, y: 0 });
		const animationFrameRef = useRef<number>(0);

		const handleMove = useCallback(
			(e?: MouseEvent | { x: number; y: number }) => {
				if (!containerRef.current) return;

				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}

				animationFrameRef.current = requestAnimationFrame(() => {
					const element = containerRef.current;
					if (!element) return;

					const { left, top, width, height } = element.getBoundingClientRect();
					const mouseX = e?.x ?? lastPosition.current.x;
					const mouseY = e?.y ?? lastPosition.current.y;

					if (e) {
						lastPosition.current = { x: mouseX, y: mouseY };
					}

					const center = [left + width * 0.5, top + height * 0.5];
					const distanceFromCenter = Math.hypot(
						mouseX - center[0],
						mouseY - center[1],
					);
					const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

					if (distanceFromCenter < inactiveRadius) {
						element.style.setProperty("--active", "0");
						return;
					}

					const isActive =
						mouseX > left - proximity &&
						mouseX < left + width + proximity &&
						mouseY > top - proximity &&
						mouseY < top + height + proximity;

					element.style.setProperty("--active", isActive ? "1" : "0");

					if (!isActive) return;

					const currentAngle =
						Number.parseFloat(element.style.getPropertyValue("--start")) || 0;
					const targetAngle =
						(180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
							Math.PI +
						90;

					const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
					const newAngle = currentAngle + angleDiff;

					animate(currentAngle, newAngle, {
						duration: movementDuration,
						ease: [0.16, 1, 0.3, 1],
						onUpdate: (value) => {
							element.style.setProperty("--start", String(value));
						},
					});
				});
			},
			[inactiveZone, proximity, movementDuration],
		);

		useEffect(() => {
			if (isDisabled) return;

			const handleScroll = () => handleMove();
			const handlePointerMove = (e: PointerEvent) => handleMove(e);

			window.addEventListener("scroll", handleScroll, { passive: true });
			document.body.addEventListener("pointermove", handlePointerMove, {
				passive: true,
			});

			return () => {
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}
				window.removeEventListener("scroll", handleScroll);
				document.body.removeEventListener("pointermove", handlePointerMove);
			};
		}, [handleMove, isDisabled]);

		return (
			<>
				<div
					className={`pointer-events-none absolute -inset-px rounded-[inherit] border border-black/5 transition-opacity ${glow ? "opacity-100" : "opacity-0"} ${isDisabled ? "block" : "hidden"}`}
				/>
				<div
					ref={containerRef}
					style={
						{
							"--blur": `${blur}px`,
							"--spread": spread,
							"--start": "0",
							"--active": "0",
							"--glowingeffect-border-width": `${borderWidth}px`,
							"--repeating-conic-gradient-times": "5",
							"--gradient": `radial-gradient(circle, #e59c24 10%, #e59c2400 20%),
								radial-gradient(circle at 40% 40%, #325275 5%, #32527500 15%),
								radial-gradient(circle at 60% 60%, #f2b75c 10%, #f2b75c00 20%),
								radial-gradient(circle at 40% 60%, #1f3653 10%, #1f365300 20%),
								repeating-conic-gradient(
									from 236.84deg at 50% 50%,
									#e59c24 0%,
									#325275 calc(25% / var(--repeating-conic-gradient-times)),
									#f2b75c calc(50% / var(--repeating-conic-gradient-times)),
									#1f3653 calc(75% / var(--repeating-conic-gradient-times)),
									#e59c24 calc(100% / var(--repeating-conic-gradient-times))
								)`,
						} as CSSProperties
					}
					className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity ${blur > 0 ? "blur-[var(--blur)]" : ""} ${isDisabled ? "hidden" : ""} ${className ?? ""}`}
				>
					<div className='rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:rounded-[inherit] after:opacity-[var(--active)] after:transition-opacity after:duration-300 after:content-[""] after:[background-attachment:fixed] after:[background:var(--gradient)] after:[border:var(--glowingeffect-border-width)_solid_transparent] after:[mask-clip:padding-box,border-box] after:[mask-composite:intersect] after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]' />
				</div>
			</>
		);
	},
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
