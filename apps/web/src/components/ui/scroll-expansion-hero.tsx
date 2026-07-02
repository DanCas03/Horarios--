"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

/** Curva de resorte de la marca, compartida por todas las escenas del dive. */
const BRAND_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

interface ScrollExpandMediaProps {
	media: ReactNode;
	title: string;
	subtitle?: string;
	scrollHint?: string;
	/** Escenas 2 y 4: contenido funcional que vive dentro del marco expandido
	 *  y también dentro de la barra compacta (es la misma capa, nunca se
	 *  desmonta; solo cambia su opacidad). */
	panel?: ReactNode;
	/** Escena 3: contenido alternativo que reemplaza al panel dentro del
	 *  marco expandido, con scroll propio. */
	altPanel?: ReactNode;
	/** Muestra `altPanel` en lugar de `panel` mientras el marco sigue a
	 *  pantalla completa (no aplica compactado). */
	showAltPanel?: boolean;
	/** Escena 4: contrae el marco a una barra delgada anclada arriba del
	 *  contenido de la página. */
	compact?: boolean;
	/** Notifica a la página cuándo el marco entra o sale de la inmersión,
	 *  para que restaure la escena que corresponda al reentrar. */
	onExpandedChange?: (expanded: boolean) => void;
	children?: ReactNode;
}

/** True si el gesto ocurre dentro de una capa con scroll propio ya
 *  desplazada (p. ej. el formulario dentro del marco): ahí el gesto es
 *  scroll interno, no una salida de la inmersión. */
const isInsideScrolledLayer = (target: EventTarget | null) => {
	let el = target instanceof Element ? target : null;
	while (el && el !== document.documentElement) {
		if (el.scrollTop > 0) return true;
		el = el.parentElement;
	}
	return false;
};

/**
 * Hero de inmersión con scroll (adaptado de UI_prompts/diveImage.md).
 * El marco double-bezel aloja una secuencia de escenas: (1) el medio
 * (`media`) crece con la rueda o el gesto táctil hasta llenar el viewport;
 * (2) al completarse la inmersión el velo navy se disuelve en una
 * superficie clara y el `panel` aparece centrado dentro del mismo marco,
 * con el título encogido como encabezado; (3) opcionalmente el `altPanel`
 * reemplaza al panel mediante cross-fade; (4) con `compact` el marco se
 * contrae a una barra delgada arriba y `children` fluye debajo. La
 * posición centrada del marco no cambia nunca: en la escena 4 es el
 * contenedor el que encoge su altura. El título usa mix-blend-difference
 * directamente en el h1 (sin ancestro posicionado/transformado, que
 * crearía un stacking context y anularía el blend). Con
 * prefers-reduced-motion no hay secuestro de scroll: todo aparece en su
 * estado final.
 */
export default function ScrollExpandMedia({
	media,
	title,
	subtitle,
	scrollHint,
	panel,
	altPanel,
	showAltPanel = false,
	compact = false,
	onExpandedChange,
	children,
}: ScrollExpandMediaProps) {
	const reduceMotion = useReducedMotion();
	const [scrollProgress, setScrollProgress] = useState(0);
	const [expanded, setExpanded] = useState(false);
	const [showContent, setShowContent] = useState(false);
	const [viewport, setViewport] = useState({ width: 0, height: 0 });
	const touchStartY = useRef(0);

	const isMobile = viewport.width > 0 && viewport.width < 768;

	// Accesibilidad: sin animaciones tampoco hay inmersión que superar
	useEffect(() => {
		if (reduceMotion) {
			setScrollProgress(1);
			setExpanded(true);
			setShowContent(true);
		}
	}, [reduceMotion]);

	useEffect(() => {
		onExpandedChange?.(expanded);
	}, [expanded, onExpandedChange]);

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
			if (
				expanded &&
				e.deltaY < 0 &&
				window.scrollY <= 5 &&
				!isInsideScrolledLayer(e.target)
			) {
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
			if (
				expanded &&
				deltaY < -20 &&
				window.scrollY <= 5 &&
				!isInsideScrolledLayer(e.target)
			) {
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
		const check = () =>
			setViewport({ width: window.innerWidth, height: window.innerHeight });
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	const mediaWidth = 300 + scrollProgress * (isMobile ? 620 : 1150);
	const mediaHeight = 360 + scrollProgress * (isMobile ? 190 : 360);
	const textTranslateX = scrollProgress * (isMobile ? 170 : 140);

	// Escenas: 1 = backdrop (sin expandir), 2/3 = panel o panel alternativo
	// dentro del marco expandido, 4 = barra compacta
	const compactNow = compact && expanded;
	const sceneActive = expanded;
	const altActive = sceneActive && showAltPanel && !compactNow;
	const panelActive = sceneActive && !altActive;

	const frameWidth = compactNow
		? Math.min(viewport.width * 0.94, 680)
		: mediaWidth;
	const frameHeight = compactNow ? 84 : mediaHeight;

	// Altura real del marco expandido (el estilo lo limita a 82vh) para
	// colocar el título encogido justo bajo su borde superior
	const expandedFrameHeight = Math.min(
		360 + (isMobile ? 190 : 360),
		viewport.height > 0 ? viewport.height * 0.82 : Number.POSITIVE_INFINITY,
	);
	const titleScale = sceneActive ? (isMobile ? 0.5 : 0.34) : 1;
	const titleY = sceneActive
		? -(expandedFrameHeight / 2) + (isMobile ? 64 : 80)
		: 0;

	// Nunca `spring`: pelearía con la transición universal de index.css
	const tween = (duration: number) =>
		reduceMotion
			? { duration: 0 }
			: { type: "tween" as const, duration, ease: BRAND_EASE };
	const sceneTween = tween(0.7);
	const frameTransition = tween(expanded ? 0.7 : 0.18);
	const wordTransition = sceneActive ? sceneTween : tween(0.18);

	const [firstWord, ...restWords] = title.split(" ");
	const restOfTitle = restWords.join(" ");

	return (
		<div className="overflow-x-clip">
			<section className="relative flex min-h-[100dvh] w-full flex-col items-center">
				<div
					className={`relative flex w-full items-center justify-center transition-[height] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${compactNow ? "h-36" : "h-[100dvh]"}`}
				>
					{/* Marco double-bezel de la marca: escenario de todas las escenas */}
					<motion.div
						className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-black/[0.025] p-2 ring-1 ring-black/5 transition-none"
						initial={false}
						animate={{ width: frameWidth, height: frameHeight }}
						transition={frameTransition}
						style={{
							maxWidth: "94vw",
							maxHeight: "82vh",
							boxShadow: compactNow
								? "0 12px 32px rgba(18, 33, 53, 0.16)"
								: "0 24px 70px rgba(18, 33, 53, 0.25)",
						}}
					>
						<div className="relative h-full w-full">
							{/* Escena 1: backdrop con velo navy que se disipa */}
							<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[calc(2rem-0.5rem)]">
								{media}
								<motion.div
									className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary/25 to-transparent transition-none"
									initial={false}
									animate={{
										opacity: sceneActive ? 0 : 0.9 - scrollProgress * 0.5,
									}}
									transition={tween(sceneActive ? 0.6 : 0.15)}
								/>
							</div>

							{/* Escenas 2-4: superficie clara que disuelve el backdrop */}
							<motion.div
								className="pointer-events-none absolute inset-0 rounded-[calc(2rem-0.5rem)] bg-white transition-none"
								initial={false}
								animate={{ opacity: sceneActive ? 1 : 0 }}
								transition={sceneTween}
							/>

							{/* Escenas 2 y 4: panel funcional (cross-fade entre capas
							    superpuestas, nunca montaje/desmontaje condicional) */}
							{panel && (
								<motion.div
									className="absolute inset-0 transition-none"
									initial={false}
									animate={{ opacity: panelActive ? 1 : 0 }}
									transition={tween(0.45)}
									style={{ pointerEvents: panelActive ? "auto" : "none" }}
									inert={panelActive ? undefined : true}
								>
									{panel}
								</motion.div>
							)}

							{/* Escena 3: panel alternativo con scroll propio */}
							{altPanel && (
								<motion.div
									className="absolute inset-0 overflow-y-auto overscroll-contain rounded-[calc(2rem-0.5rem)] transition-none"
									initial={false}
									animate={{ opacity: altActive ? 1 : 0 }}
									transition={tween(0.45)}
									style={{ pointerEvents: altActive ? "auto" : "none" }}
									inert={altActive ? undefined : true}
								>
									{altPanel}
								</motion.div>
							)}

							{/* Captura de clic/Enter para expandir sin gesto (escena 1) */}
							{!expanded && (
								<button
									type="button"
									aria-label="Expandir el panel y mostrar el contenido"
									onClick={expandNow}
									className="absolute inset-0 z-10 cursor-pointer rounded-[calc(2rem-0.5rem)]"
								/>
							)}
						</div>
					</motion.div>

					{/* Título: grande y abriéndose hacia los lados en la escena 1; en
					    las escenas 2-3 se encoge y sube como encabezado del marco. El
					    wrapper NO puede posicionarse ni transformarse: crearía un
					    stacking context que aísla el mix-blend-difference del h1 y lo
					    anula (letras planas). Toda transformación vive en el propio h1
					    y sus spans; el blend, en el h1, como en diveImage.md. */}
					<div className="pointer-events-none flex flex-col items-center gap-3 px-4 text-center">
						{subtitle && (
							<motion.span
								className="relative z-10 font-semibold text-[11px] text-accent uppercase tracking-[0.25em] transition-none"
								initial={false}
								animate={{
									x: `${-textTranslateX}vw`,
									opacity: sceneActive ? 0 : 1,
								}}
								transition={wordTransition}
							>
								{subtitle}
							</motion.span>
						)}
						<motion.h1
							className="relative z-10 flex flex-col items-center gap-1 font-extrabold text-5xl text-blue-200 tracking-tighter mix-blend-difference transition-none md:text-7xl"
							initial={false}
							animate={{
								scale: titleScale,
								y: titleY,
								opacity: compactNow ? 0 : 1,
							}}
							transition={sceneTween}
						>
							<motion.span
								className="transition-none"
								initial={false}
								animate={{
									x: sceneActive ? "0vw" : `${-textTranslateX}vw`,
								}}
								transition={wordTransition}
							>
								{firstWord}
							</motion.span>
							{restOfTitle && (
								<motion.span
									className="transition-none"
									initial={false}
									animate={{
										x: sceneActive ? "0vw" : `${textTranslateX}vw`,
									}}
									transition={wordTransition}
								>
									{restOfTitle}
								</motion.span>
							)}
						</motion.h1>
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

				{/* Contenido que fluye debajo del marco (resultados en la escena 4) */}
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
