"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";

const Spinner = () => (
	<div className="flex min-h-[100dvh] items-center justify-center">
		<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
	</div>
);

/**
 * Guard para las rutas de la encuesta.
 * - Si no hay sesion -> redirige a /login?next=/encuesta
 * - Si no tiene materias aprobadas -> redirige a /encuesta/onboarding
 * - Si todo OK -> renderiza children
 */
export default function SurveyGuard({
	children,
	requireApprovedSubjects = true,
}: {
	children: React.ReactNode;
	requireApprovedSubjects?: boolean;
}) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		if (!user) {
			router.replace("/login?next=/encuesta");
			return;
		}

		if (requireApprovedSubjects && (!user.approvedSubjects || user.approvedSubjects.length === 0)) {
			router.replace("/encuesta/onboarding");
			return;
		}
	}, [loading, user, router, requireApprovedSubjects]);

	if (loading) return <Spinner />;
	if (!user) return null;
	if (requireApprovedSubjects && (!user.approvedSubjects || user.approvedSubjects.length === 0)) return null;

	return <>{children}</>;
}
