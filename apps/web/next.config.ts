import "@horaios/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	output: "standalone",
	// Evita que Next.js intente procesar estos paquetes con Webpack
	serverExternalPackages: ["better-auth", "@prisma/client"],
};

export default nextConfig;
