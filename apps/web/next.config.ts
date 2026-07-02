import "@horaios/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	output: "standalone",
	// Evita que Next.js intente procesar estos paquetes con Webpack
	serverExternalPackages: ["better-auth", "@prisma/client"],
	// Imagen del hero de inmersión de /reviews (UI_prompts/diveImage.md)
	images: {
		remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
	},
};

export default nextConfig;
