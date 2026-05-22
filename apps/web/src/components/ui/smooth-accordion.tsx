"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SmoothAccordion — animates height to the exact pixel value of its content.
 * No max-height hack, no sudden jumps.
 */
export function SmoothAccordion({
	isOpen,
	children,
	className = "",
}: {
	isOpen: boolean;
	children: React.ReactNode;
	className?: string;
}) {
	const innerRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number>(0);

	useEffect(() => {
		if (!innerRef.current) return;

		if (isOpen) {
			// Measure the real scrollHeight and animate to it
			const h = innerRef.current.scrollHeight;
			setHeight(h);
		} else {
			// Snap to current pixel height first (avoids animated close from wrong value),
			// then set to 0 on next frame so the transition fires
			setHeight(innerRef.current.scrollHeight);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => setHeight(0));
			});
		}
	}, [isOpen]);

	// Re-measure if children change while open (e.g., approved subject added)
	useEffect(() => {
		if (isOpen && innerRef.current) {
			setHeight(innerRef.current.scrollHeight);
		}
	});

	return (
		<div
			style={{
				height: height,
				overflow: "hidden",
				transition: "height 480ms cubic-bezier(0.16, 1, 0.3, 1)",
			}}
			aria-hidden={!isOpen}
		>
			<div ref={innerRef} className={className}>
				{children}
			</div>
		</div>
	);
}
