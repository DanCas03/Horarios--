"use client";

import {
	BookOpen,
	Calendar,
	GraduationCap,
	LogOut,
	MessageSquare,
	User,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";

const NAV_LINKS = [
	{ href: "/pensum" as Route, label: "Pensum", Icon: BookOpen },
	{ href: "/schedule" as Route, label: "Horarios", Icon: Calendar },
	{ href: "/reviews" as Route, label: "Reseñas", Icon: MessageSquare },
];

export default function Navbar() {
	const { user, logout } = useAuth();
	const router = useRouter();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// Lock body scroll when mobile menu is open
	useEffect(() => {
		document.body.style.overflow = mobileOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	const handleLogout = () => {
		logout();
		setMobileOpen(false);
		router.push("/login");
	};

	return (
		<>
			{/* ─── Floating pill navbar ─────────────────────────────────────── */}
			<header className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex justify-center">
				<nav
					className={`pointer-events-auto mt-4 flex items-center gap-1 rounded-full border px-3 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
						scrolled
							? "border-black/10 bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl"
							: "border-white/20 bg-primary/85 shadow-[0_4px_24px_rgba(31,54,83,0.3)] backdrop-blur-xl"
					}`}
				>
					{/* Logo */}
					<Link
						href="/"
						className={`mr-2 flex items-center gap-2 rounded-full px-3 py-1.5 font-bold text-sm tracking-tight transition-opacity hover:opacity-80 ${scrolled ? "text-primary" : "text-white"}`}
					>
						<GraduationCap className="h-5 w-5 text-accent" />
						<span className="hidden sm:inline">Guía Estudiantil</span>
					</Link>

					{/* Desktop links */}
					<div className="hidden items-center gap-1 md:flex">
						{user &&
							NAV_LINKS.map(({ href, label }) => (
								<Link
									key={href}
									href={href}
									className={`rounded-full px-4 py-1.5 font-medium text-sm transition-all duration-300 hover:bg-white/15 active:scale-95 ${scrolled ? "text-gray-700 hover:bg-primary/8 hover:text-primary" : "text-white/80 hover:text-white"}`}
								>
									{label}
								</Link>
							))}
					</div>

					{/* Right actions */}
					<div
						className={`ml-2 flex items-center gap-2 border-l pl-3 ${scrolled ? "border-black/10" : "border-white/20"}`}
					>
						{user ? (
							<>
								<Link
									href="/profile"
									className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-sm transition-all hover:bg-white/15 active:scale-95 ${scrolled ? "text-gray-700 hover:bg-primary/8" : "text-white/80 hover:text-white"}`}
								>
									<User size={15} />
									<span className="hidden max-w-[80px] truncate sm:inline">
										{user.username}
									</span>
								</Link>
								<button
									onClick={handleLogout}
									className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-90"
									title="Cerrar sesión"
								>
									<LogOut size={15} />
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className={`rounded-full px-4 py-1.5 font-medium text-sm transition-all hover:bg-white/15 active:scale-95 ${scrolled ? "text-gray-700" : "text-white/80 hover:text-white"}`}
								>
									Iniciar Sesión
								</Link>
								<Link
									href="/register"
									className="group flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 font-semibold text-primary-dark text-sm shadow-[0_2px_8px_rgba(229,156,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(229,156,36,0.5)] active:scale-95"
								>
									Registrarse
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
										<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
											<path
												d="M2 8L8 2M8 2H3M8 2V7"
												stroke="currentColor"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</span>
								</Link>
							</>
						)}
					</div>

					{/* Mobile hamburger */}
					<button
						className={`relative ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-white/15 active:scale-90 md:hidden ${scrolled ? "text-gray-700" : "text-white"}`}
						onClick={() => setMobileOpen(!mobileOpen)}
						aria-label="Menú"
					>
						<span
							className={`absolute block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${mobileOpen ? "translate-y-0 rotate-45" : "-translate-y-1"}`}
						/>
						<span
							className={`absolute block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${mobileOpen ? "scale-x-0 opacity-0" : "opacity-100"}`}
						/>
						<span
							className={`absolute block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${mobileOpen ? "translate-y-0 -rotate-45" : "translate-y-1"}`}
						/>
					</button>
				</nav>
			</header>

			{/* ─── Mobile fullscreen overlay ────────────────────────────────── */}
			<div
				className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/95 backdrop-blur-3xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
					mobileOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0"
				}`}
			>
				<div className="flex flex-col items-center gap-2">
					{user ? (
						<>
							{NAV_LINKS.map(({ href, label, Icon }, i) => (
								<Link
									key={href}
									href={href}
									onClick={() => setMobileOpen(false)}
									className={`reveal reveal-delay-${i + 1} flex items-center gap-3 rounded-full px-8 py-4 font-bold text-2xl text-gray-900 transition-all hover:bg-primary/5 hover:text-primary active:scale-95 ${mobileOpen ? "is-visible" : ""}`}
								>
									<Icon size={24} />
									{label}
								</Link>
							))}
							<Link
								href="/profile"
								onClick={() => setMobileOpen(false)}
								className={`reveal reveal-delay-4 flex items-center gap-3 rounded-full px-8 py-4 font-bold text-2xl text-gray-900 transition-all hover:bg-primary/5 hover:text-primary active:scale-95 ${mobileOpen ? "is-visible" : ""}`}
							>
								<User size={24} />
								{user.username}
							</Link>
							<button
								onClick={handleLogout}
								className={`reveal reveal-delay-4 mt-4 flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-base text-red-500 transition-all hover:bg-red-50 active:scale-95 ${mobileOpen ? "is-visible" : ""}`}
							>
								<LogOut size={18} /> Cerrar Sesión
							</button>
						</>
					) : (
						<>
							<Link
								href="/login"
								onClick={() => setMobileOpen(false)}
								className={`reveal reveal-delay-1 rounded-full px-8 py-4 font-bold text-2xl text-gray-900 transition-all hover:bg-primary/5 active:scale-95 ${mobileOpen ? "is-visible" : ""}`}
							>
								Iniciar Sesión
							</Link>
							<Link
								href="/register"
								onClick={() => setMobileOpen(false)}
								className={`reveal reveal-delay-2 mt-2 flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white text-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 ${mobileOpen ? "is-visible" : ""}`}
							>
								Registrarse
							</Link>
						</>
					)}
				</div>
			</div>
		</>
	);
}
