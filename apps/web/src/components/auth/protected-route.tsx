"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";

const Spinner = () => (
	<div className="flex min-h-screen items-center justify-center">
		<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
	</div>
);

export default function ProtectedRoute({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!loading) {
			if (!user) {
				router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
			} else if (pathname?.startsWith("/admin") && user.role !== "admin") {
				router.replace("/dashboard");
			}
		}
	}, [loading, pathname, router, user]);

	if (loading) return <Spinner />;
	if (!user || (pathname?.startsWith("/admin") && user.role !== "admin"))
		return null;

	return <>{children}</>;
}
