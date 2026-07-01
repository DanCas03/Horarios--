"use client";

import {
	type MotionValue,
	motion,
	useScroll,
	useTransform,
} from "framer-motion";
import React, { useRef } from "react";

/**
 * Hero con perspectiva 3D: la tarjeta arranca inclinada (rotateX 20°)
 * y se endereza a medida que el usuario hace scroll.
 * Adaptado de scroll.md a la paleta del proyecto.
 */
export const ContainerScroll = ({
	titleComponent,
	children,
}: {
	titleComponent: string | React.ReactNode;
	children: React.ReactNode;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
	});
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);

	const scaleDimensions = (): [number, number] => {
		return isMobile ? [0.7, 0.9] : [1.05, 1];
	};

	const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
	const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
	const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

	return (
		<div
			ref={containerRef}
			className="relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20"
		>
			<div
				className="relative w-full py-10 md:py-40"
				style={{ perspective: "1000px" }}
			>
				<Header translate={translate} titleComponent={titleComponent} />
				<Card rotate={rotate} scale={scale}>
					{children}
				</Card>
			</div>
		</div>
	);
};

const Header = ({
	translate,
	titleComponent,
}: {
	translate: MotionValue<number>;
	titleComponent: string | React.ReactNode;
}) => {
	return (
		<motion.div
			style={{ translateY: translate }}
			className="mx-auto max-w-5xl text-center"
		>
			{titleComponent}
		</motion.div>
	);
};

const Card = ({
	rotate,
	scale,
	children,
}: {
	rotate: MotionValue<number>;
	scale: MotionValue<number>;
	children: React.ReactNode;
}) => {
	return (
		<motion.div
			style={{
				rotateX: rotate,
				scale,
				// Sombra teñida con el navy de la marca, no negro puro
				boxShadow:
					"0 0 rgba(18,33,53,0.3), 0 9px 20px rgba(18,33,53,0.29), 0 37px 37px rgba(18,33,53,0.26), 0 84px 50px rgba(18,33,53,0.15), 0 149px 60px rgba(18,33,53,0.04), 0 233px 65px rgba(18,33,53,0.02)",
			}}
			className="mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-white/15 bg-primary-dark p-2 md:h-[40rem] md:p-6"
		>
			<div className="h-full w-full overflow-hidden rounded-2xl bg-surface md:rounded-2xl md:p-4">
				{children}
			</div>
		</motion.div>
	);
};
