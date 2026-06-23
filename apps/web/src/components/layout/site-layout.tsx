"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import Footer from "./footer";
import Navbar from "./navbar";

export default function SiteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isEncuesta = pathname.startsWith("/encuesta");

	if (isEncuesta) {
		return <>{children}</>;
	}

	return (
		<div className="flex min-h-[100dvh] flex-col">
			<Suspense fallback={null}>
				<Navbar />
			</Suspense>
			<main className="flex-1 pt-20">{children}</main>
			<Suspense fallback={null}>
				<Footer />
			</Suspense>
		</div>
	);
}
