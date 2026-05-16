"use client";

import { Toaster } from "@horaios/ui/components/sonner";

import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<AuthProvider>
				{children}
				<Toaster richColors />
			</AuthProvider>
		</ThemeProvider>
	);
}
