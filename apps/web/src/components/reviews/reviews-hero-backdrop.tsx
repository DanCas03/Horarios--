import Logo from "@/components/logo";

/**
 * Fondo de marca para el hero de inmersión de /reviews: base navy con
 * orbes de color en deriva lenta (animación CSS pura, solo transform) y
 * el birrete del logo como marca de agua central. Los orbes ámbar viven
 * en el tercio inferior y a baja opacidad para que el título con
 * mix-blend-difference nunca cruce zonas claras: sobre el navy las
 * letras se ven crema y fuera del medio, casi negras.
 */
export default function ReviewsHeroBackdrop() {
	return (
		<div
			aria-hidden="true"
			className="absolute inset-0 overflow-hidden bg-primary-dark"
		>
			{/* Orbes en deriva */}
			<div className="hero-orb absolute -top-1/4 -right-1/4 h-3/4 w-3/4 rounded-full bg-primary-light/50 blur-[90px]" />
			<div className="hero-orb hero-orb-slow absolute -bottom-1/3 -left-1/4 h-4/5 w-4/5 rounded-full bg-accent/30 blur-[100px]" />
			<div className="hero-orb hero-orb-reverse absolute right-[8%] bottom-[-18%] h-1/2 w-1/2 rounded-full bg-accent/20 blur-[80px]" />

			{/* Marca de agua con el logo */}
			<div className="absolute inset-0 flex items-center justify-center">
				<Logo className="h-40 w-40 text-white opacity-[0.16] md:h-72 md:w-72" />
			</div>

			{/* Viñeta que asienta los bordes del marco */}
			<div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_55%,rgba(18,33,53,0.6)_100%)]" />
		</div>
	);
}
