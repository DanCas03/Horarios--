import {
	BookOpen,
	Calendar,
	GraduationCap,
	LogOut,
	Menu,
	MessageSquare,
	User,
	X,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<nav className="sticky top-0 z-50 bg-primary text-white shadow-lg">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2 hover:opacity-90">
						<GraduationCap className="h-8 w-8 text-accent" />
						<span className="font-bold text-xl tracking-tight">
							Guía Estudiantil
						</span>
					</Link>

					{/* Desktop nav */}
					<div className="hidden items-center gap-6 md:flex">
						{user ? (
							<>
								<Link
									to="/pensum"
									className="flex items-center gap-1.5 font-medium hover:text-accent"
								>
									<BookOpen size={18} />
									Pensum
								</Link>
								<Link
									to="/schedule"
									className="flex items-center gap-1.5 font-medium hover:text-accent"
								>
									<Calendar size={18} />
									Horarios
								</Link>
								<Link
									to="/reviews"
									className="flex items-center gap-1.5 font-medium hover:text-accent"
								>
									<MessageSquare size={18} />
									Reseñas
								</Link>
								<div className="ml-4 flex items-center gap-3 border-white/20 border-l pl-4">
									<Link
										to="/profile"
										className="flex items-center gap-1.5 hover:text-accent"
									>
										<User size={18} />
										{user.username}
									</Link>
									<button
										onClick={handleLogout}
										className="flex items-center gap-1 text-red-300 hover:text-red-200"
									>
										<LogOut size={16} />
									</button>
								</div>
							</>
						) : (
							<div className="flex gap-3">
								<Link
									to="/login"
									className="rounded-lg px-4 py-2 font-medium hover:bg-white/10"
								>
									Iniciar Sesión
								</Link>
								<Link
									to="/register"
									className="rounded-lg bg-accent px-4 py-2 font-semibold text-primary-dark hover:bg-amber-400"
								>
									Registrarse
								</Link>
							</div>
						)}
					</div>

					{/* Mobile menu toggle */}
					<button
						className="md:hidden"
						onClick={() => setMobileOpen(!mobileOpen)}
					>
						{mobileOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="border-white/10 border-t bg-primary-dark px-4 pb-4 md:hidden">
					{user ? (
						<div className="flex flex-col gap-3 pt-3">
							<Link
								to="/pensum"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-2 py-2 hover:text-accent"
							>
								<BookOpen size={18} /> Pensum
							</Link>
							<Link
								to="/schedule"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-2 py-2 hover:text-accent"
							>
								<Calendar size={18} /> Horarios
							</Link>
							<Link
								to="/reviews"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-2 py-2 hover:text-accent"
							>
								<MessageSquare size={18} /> Reseñas
							</Link>
							<Link
								to="/profile"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-2 py-2 hover:text-accent"
							>
								<User size={18} /> {user.username}
							</Link>
							<button
								onClick={handleLogout}
								className="flex items-center gap-2 py-2 text-red-300 hover:text-red-200"
							>
								<LogOut size={18} /> Cerrar Sesión
							</button>
						</div>
					) : (
						<div className="flex flex-col gap-2 pt-3">
							<Link
								to="/login"
								onClick={() => setMobileOpen(false)}
								className="py-2 hover:text-accent"
							>
								Iniciar Sesión
							</Link>
							<Link
								to="/register"
								onClick={() => setMobileOpen(false)}
								className="py-2 hover:text-accent"
							>
								Registrarse
							</Link>
						</div>
					)}
				</div>
			)}
		</nav>
	);
}
