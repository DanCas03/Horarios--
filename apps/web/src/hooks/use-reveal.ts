"use client";

import { useEffect } from "react";

export function useReveal() {
	useEffect(() => {
		const els = document.querySelectorAll(".reveal");

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.1, rootMargin: "0px 0px -32px 0px" },
		);

		for (const el of els) observer.observe(el);

		return () => observer.disconnect();
	}, []);
}
