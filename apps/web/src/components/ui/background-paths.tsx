"use client";

import { motion } from "framer-motion";

/**
 * Sección con trazos SVG flotantes animados de fondo y título que se
 * revela letra por letra. Adaptado de background.md al tema claro del
 * sitio: los paths heredan `currentColor` del contenedor.
 */
function FloatingPaths({ position }: { position: number }) {
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
			>
				<title>Trazos decorativos de fondo</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				))}
			</svg>
		</div>
	);
}

export function BackgroundPaths({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children?: React.ReactNode;
}) {
	const words = title.split(" ");

	return (
		<section className="relative w-full overflow-hidden py-32 md:py-44">
			<div className="absolute inset-0 text-primary">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>

			<div className="container relative z-10 mx-auto px-4 text-center md:px-6">
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 1.2 }}
					className="mx-auto max-w-4xl"
				>
					<h2 className="mb-6 text-balance font-extrabold text-5xl tracking-tighter md:text-7xl">
						{words.map((word, wordIndex) => (
							<span
								key={`${word}-${wordIndex}`}
								className="mr-3 inline-block last:mr-0 md:mr-4"
							>
								{word.split("").map((letter, letterIndex) => (
									<motion.span
										key={`${wordIndex}-${letterIndex}`}
										initial={{ y: 80, opacity: 0 }}
										whileInView={{ y: 0, opacity: 1 }}
										viewport={{ once: true }}
										transition={{
											delay: wordIndex * 0.08 + letterIndex * 0.02,
											type: "spring",
											stiffness: 150,
											damping: 25,
										}}
										className="inline-block bg-gradient-to-r from-primary-dark to-primary/70 bg-clip-text text-transparent"
									>
										{letter}
									</motion.span>
								))}
							</span>
						))}
					</h2>

					{subtitle && (
						<p className="mx-auto mb-10 max-w-lg text-balance text-gray-500 leading-relaxed">
							{subtitle}
						</p>
					)}

					{children}
				</motion.div>
			</div>
		</section>
	);
}
