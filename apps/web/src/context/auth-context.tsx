"use client";

import axios from "axios";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { authClient } from "@/lib/auth-client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ApprovedSubject {
	subjectId: string;
	grade?: number;
	period?: string;
}

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	username?: string | null;
	universityIds: string[];
	academicProgramIds: string[];
	approvedSubjects: ApprovedSubject[];
	totalApprovedCredits: number;
}

interface AuthContextType {
	user: UserProfile | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		name: string,
		password: string,
		universityId?: string,
		academicProgramId?: string,
	) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(): Promise<UserProfile | null> {
	try {
		const res = await axios.get("/api/auth/me", { withCredentials: true });
		return res.data as UserProfile;
	} catch {
		return null;
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshUser = useCallback(async () => {
		const profile = await fetchProfile();
		setUser(profile);
	}, []);

	useEffect(() => {
		refreshUser().finally(() => setLoading(false));
	}, [refreshUser]);

	const login = async (email: string, password: string) => {
		await authClient.signIn.email({ email, password });
		await refreshUser();
	};

	const register = async (
		email: string,
		name: string,
		password: string,
		universityId?: string,
		academicProgramId?: string,
	) => {
		await authClient.signUp.email({ email, name, password });
		// Si se eligió universidad/carrera, actualizar el perfil
		if (universityId || academicProgramId) {
			await axios.put(
				"/api/auth/me",
				{
					universityIds: universityId ? [universityId] : [],
					academicProgramIds: academicProgramId ? [academicProgramId] : [],
				},
				{ withCredentials: true },
			);
		}
		await refreshUser();
	};

	const logout = async () => {
		await authClient.signOut();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, login, register, logout, refreshUser }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
}
