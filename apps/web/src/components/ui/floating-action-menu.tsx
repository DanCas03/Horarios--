"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

export type QuickAction = {
	label: string;
	href: Route;
	Icon: LucideIcon;
};

/**
 * Menú flotante de acciones rápidas (adaptado de UI_prompts/menuBotton.md).
 * Botón navy fijo abajo a la derecha que despliega accesos contextuales en
 * píldoras blancas, con la misma física de resorte del resto del sitio.
 */
export default function FloatingActionMenu({
	actions,
}: {
	actions: QuickAction[];
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 md:right-8 md:bottom-8">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-label="Acciones rápidas"
				className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-[0_8px_24px_rgba(31,54,83,0.4)] ring-1 ring-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:shadow-[0_12px_32px_rgba(31,54,83,0.5)] active:scale-95"
			>
				<motion.div
					animate={{ rotate: isOpen ? 45 : 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<Plus className="h-5 w-5" />
				</motion.div>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
						animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
						className="absolute right-0 bottom-full mb-3"
					>
						<div className="flex flex-col items-end gap-2">
							{actions.map((action, index) => (
								<motion.div
									key={action.label}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}
								>
									<Link
										href={action.href}
										onClick={() => setIsOpen(false)}
										className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-black/5 bg-white/95 px-5 py-2.5 font-semibold text-gray-700 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:text-primary active:scale-95"
									>
										<action.Icon className="h-4 w-4 text-accent" />
										{action.label}
									</Link>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
