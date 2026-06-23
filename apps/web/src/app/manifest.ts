import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Guía Estudiantil",
		short_name: "Guía Estudiantil",
		description: "Planifica tu carrera, pensum, horarios y reseñas.",
		start_url: "/",
		display: "standalone",
		background_color: "#122135",
		theme_color: "#122135",
		icons: [
			{
				src: "/favicon/web-app-manifest-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/favicon/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}

