"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface ScrollExpandMediaProps {
	mediaSrc: string;
	title: string;
	subtitle?: string;
	scrollHint?: string;
	children?: ReactNode;
}

/**
 * Hero de inmersión con scroll (adaptado de UI_prompts/diveImage.md).
 * La imagen crece con la rueda o el gesto táctil hasta llenar el viewport
 * y entonces libera el scroll normal; el contenido aparece debajo. El
 * marco usa el double-bezel de la marca y un velo navy que se disipa.
 * Con prefers-reduced-motion no hay secuestro de scroll (todo visible de
 * entrada) y un clic o Enter sobre la imagen la expande al instante.
 */
export default function ScrollExpandMedia({
	mediaSrc,
	title,
	subtitle,
	scrollHint,
	children,
}: ScrollExpandMediaProps) {
	const reduceMotion = useReducedMotion();
	const [scrollProgress, setScrollProgress] = useState(0);
	const [expanded, setExpanded] = useState(false);
	const [showContent, setShowContent] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const touchStartY = useRef(0);

	// Accesibilidad: sin animaciones tampoco hay inmersión que superar
	useEffect(() => {
		if (reduceMotion) {
			setScrollProgress(1);
			setExpanded(true);
			setShowContent(true);
		}
	}, [reduceMotion]);

	const expandNow = () => {
		setScrollProgress(1);
		setExpanded(true);
		setShowContent(true);
	};

	useEffect(() => {
		if (reduceMotion) return;

		const advance = (delta: number) => {
			const next = Math.min(Math.max(scrollProgress + delta, 0), 1);
			setScrollProgress(next);
			if (next >= 1) {
				setExpanded(true);
				setShowContent(true);
			} else if (next < 0.75) {
				setShowContent(false);
			}
		};

		const onWheel = (e: WheelEvent) => {
			if (expanded && e.deltaY < 0 && window.scrollY <= 5) {
				setExpanded(false);
				e.preventDefault();
			} else if (!expanded) {
				e.preventDefault();
				advance(e.deltaY * 0.0016);
			}
		};

		const onTouchStart = (e: TouchEvent) => {
			touchStartY.current = e.touches[0]?.clientY ?? 0;
		};

		const onTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0];
			if (!touchStartY.current || !touch) return;
			const deltaY = touchStartY.current - touch.clientY;
			if (expanded && deltaY < -20 && window.scrollY <= 5) {
				setExpanded(false);
				e.preventDefault();
			} else if (!expanded) {
				e.preventDefault();
				// Más sensibilidad al volver atrás, como el componente original
				advance(deltaY * (deltaY < 0 ? 0.009 : 0.006));
				touchStartY.current = touch.clientY;
			}
		};

		const onTouchEnd = () => {
			touchStartY.current = 0;
		};

		const onScroll = () => {
			if (!expanded) window.scrollTo(0, 0);
		};

		window.addEventListener("wheel", onWheel, { passive: false });
		window.addEventListener("scroll", onScroll);
		window.addEventListener("touchstart", onTouchStart, { passive: false });
		window.addEventListener("touchmove", onTouchMove, { passive: false });
		window.addEventListener("touchend", onTouchEnd);

		return () => {
			window.removeEventListener("wheel", onWheel);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("touchstart", onTouchStart);
			window.removeEventListener("touchmove", onTouchMove);
			window.removeEventListener("touchend", onTouchEnd);
		};
	}, [scrollProgress, expanded, reduceMotion]);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	const mediaWidth = 300 + scrollProgress * (isMobile ? 620 : 1150);
	const mediaHeight = 360 + scrollProgress * (isMobile ? 190 : 360);
	const textTranslateX = scrollProgress * (isMobile ? 170 : 140);

	const [firstWord, ...restWords] = title.split(" ");
	const restOfTitle = restWords.join(" ");

	return (
		<div className="overflow-x-clip">
			<section className="relative flex min-h-[100dvh] w-full flex-col items-center">
				<div className="relative flex h-[100dvh] w-full items-center justify-center">
					{/* Medio que se expande, con marco double-bezel de la marca */}
					<button
						type="button"
						aria-label="Expandir la imagen y mostrar las reseñas"
						onClick={() => {
							if (!expanded) expandNow();
						}}
						className={`absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5 transition-none ${expanded ? "cursor-default" : "cursor-pointer"}`}
						style={{
							width: mediaWidth,
							height: mediaHeight,
							maxWidth: "94vw",
							maxHeight: "82vh",
							boxShadow: "0 24px 70px rgba(18, 33, 53, 0.25)",
						}}
					>
						<div className="relative h-full w-full overflow-hidden rounded-[calc(2rem-0.5rem)]">
							<Image
								src={mediaSrc}
								alt={title}
								fill
								sizes="94vw"
								className="object-cover"
								priority
							/>
							{/* Velo navy que se disipa al expandir */}
							<motion.div
								className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary/25 to-transparent transition-none"
								initial={false}
								animate={{ opacity: 0.9 - scrollProgress * 0.5 }}
								transition={{ duration: 0.15 }}
							/>
						</div>
					</button>

					{/* Título que se abre hacia los lados durante la inmersión */}
					<div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 px-4 text-center">
						{subtitle && (
							<span
								className="font-semibold text-[11px] text-accent uppercase tracking-[0.25em] transition-none"
								style={{ transform: `translateX(-${textTranslateX}vw)` }}
							>
								{subtitle}
							</span>
						)}
						<h1 className="flex flex-col items-center gap-1 font-extrabold text-5xl text-primary tracking-tighter md:text-7xl">
							<span
								className="transition-none"
								style={{ transform: `translateX(-${textTranslateX}vw)` }}
							>
								{firstWord}
							</span>
							{restOfTitle && (
								<span
									className="transition-none"
									style={{ transform: `translateX(${textTranslateX}vw)` }}
								>
									{restOfTitle}
								</span>
							)}
						</h1>
					</div>

					{/* Pista de scroll */}
					<motion.div
						className="absolute bottom-10 z-10 flex flex-col items-center gap-2 text-gray-400 transition-none"
						initial={false}
						animate={{
							opacity: expanded ? 0 : Math.max(1 - scrollProgress * 1.6, 0),
						}}
						transition={{ duration: 0.2 }}
					>
						<span className="font-semibold text-[10px] uppercase tracking-[0.2em]">
							{scrollHint ?? "Desliza para explorar"}
						</span>
						<ChevronDown size={16} className="animate-bounce" />
					</motion.div>
				</div>

				{/* Contenido que aparece tras la inmersión */}
				<motion.div
					className="w-full transition-none"
					initial={false}
					animate={{ opacity: showContent ? 1 : 0 }}
					transition={{ duration: 0.6 }}
				>
					{children}
				</motion.div>
			</section>
		</div>
	);
}
