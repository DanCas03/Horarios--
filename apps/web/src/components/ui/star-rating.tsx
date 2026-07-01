"use client";

import { Star } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

/** Formatea un rating para mostrar: 3 → "3", 3.5 → "3.5". */
export const formatRating = (value: number) =>
	Number.isInteger(value) ? String(value) : value.toFixed(1);

/** Estrella con relleno parcial (fraction 0–1) vía capa recortada. */
function PartialStar({
	fraction,
	sizeClass,
}: {
	fraction: number;
	sizeClass: string;
}) {
	const pct = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
	return (
		<span className={`relative block ${sizeClass}`}>
			<Star className={`${sizeClass} block text-gray-300`} aria-hidden="true" />
			<span
				className="absolute inset-y-0 left-0 block overflow-hidden"
				style={{ width: pct }}
			>
				<Star
					className={`${sizeClass} block fill-amber-400 text-amber-400`}
					aria-hidden="true"
				/>
			</span>
		</span>
	);
}

/** Muestra un rating (admite decimales: promedios y medias estrellas). */
export function StarRatingDisplay({
	value,
	max = 5,
	sizeClass = "h-3.5 w-3.5",
	className = "",
}: {
	value: number;
	max?: number;
	sizeClass?: string;
	className?: string;
}) {
	return (
		<div
			role="img"
			aria-label={`${formatRating(value)} de ${max} estrellas`}
			className={`flex w-fit items-center gap-0.5 ${className}`}
		>
			{Array.from({ length: max }, (_, i) => (
				<PartialStar key={i} fraction={value - i} sizeClass={sizeClass} />
			))}
		</div>
	);
}

/**
 * Selector de rating con medias estrellas (0.5 a max, pasos de 0.5).
 * Cada estrella tiene dos zonas de toque (mitad izquierda/derecha);
 * con teclado funciona como slider (flechas ±0.5, Home/End).
 */
export function StarRatingInput({
	value,
	onChange,
	label,
	max = 5,
	sizeClass = "h-6 w-6",
	className = "",
}: {
	value: number;
	onChange: (value: number) => void;
	label: string;
	max?: number;
	sizeClass?: string;
	className?: string;
}) {
	const [hover, setHover] = useState<number | null>(null);
	const shown = hover ?? value;

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		let next: number | null = null;
		if (e.key === "ArrowRight" || e.key === "ArrowUp") {
			next = Math.min(max, value + 0.5);
		} else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
			next = Math.max(0.5, value - 0.5);
		} else if (e.key === "Home") {
			next = 0.5;
		} else if (e.key === "End") {
			next = max;
		}
		if (next !== null && next !== value) {
			e.preventDefault();
			onChange(next);
		} else if (next !== null) {
			e.preventDefault();
		}
	};

	return (
		<div
			role="slider"
			tabIndex={0}
			aria-label={label}
			aria-valuemin={0.5}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext={`${formatRating(value)} de ${max} estrellas`}
			onKeyDown={handleKeyDown}
			onMouseLeave={() => setHover(null)}
			className={`flex w-fit touch-manipulation select-none items-center gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${className}`}
		>
			{Array.from({ length: max }, (_, i) => (
				<span
					key={i}
					className="relative block transition-transform hover:scale-110 active:scale-95"
				>
					<PartialStar fraction={shown - i} sizeClass={sizeClass} />
					<button
						type="button"
						tabIndex={-1}
						aria-hidden="true"
						onClick={() => onChange(i + 0.5)}
						onMouseEnter={() => setHover(i + 0.5)}
						className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-hidden="true"
						onClick={() => onChange(i + 1)}
						onMouseEnter={() => setHover(i + 1)}
						className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
					/>
				</span>
			))}
		</div>
	);
}
