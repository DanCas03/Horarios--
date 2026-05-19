import { auth } from "@horaios/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="p-2 rounded-[2rem] bg-black/[0.025] ring-1 ring-black/5">
				<div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
					<div className="mb-6">
						<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-black/5 bg-gray-50 px-4 py-1 ring-1 ring-black/5">
							<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Panel Principal</span>
						</div>
						<h1 className="font-extrabold text-5xl tracking-tighter text-gray-900">Dashboard</h1>
						<p className="mt-2 text-gray-400 font-medium">Bienvenido, {session.user.name}</p>
					</div>
					<div className="mt-8">
						<Dashboard session={session} />
					</div>
				</div>
			</div>
		</div>
	);
}
