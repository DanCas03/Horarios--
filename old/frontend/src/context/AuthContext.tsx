import React, {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { authAPI } from "../api/client";

interface ApprovedSubject {
	subject_code: string;
	grade?: number;
	period?: string;
}

interface User {
	_id: string;
	email: string;
	username: string;
	university_id?: string;
	career_id?: string;
	approved_subjects: ApprovedSubject[];
	total_approved_credits: number;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		username: string,
		password: string,
		universityId?: string,
		careerId?: string,
	) => Promise<void>;
	logout: () => void;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(
		localStorage.getItem("access_token"),
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (token) {
			refreshUser().finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, []);

	const refreshUser = async () => {
		try {
			const res = await authAPI.me();
			setUser(res.data);
		} catch {
			logout();
		}
	};

	const login = async (email: string, password: string) => {
		const res = await authAPI.login({ email, password });
		const { access_token, user: userData } = res.data;
		localStorage.setItem("access_token", access_token);
		setToken(access_token);
		setUser(userData);
	};

	const register = async (
		email: string,
		username: string,
		password: string,
		universityId?: string,
		careerId?: string,
	) => {
		const res = await authAPI.register({
			email,
			username,
			password,
			...(universityId ? { university_id: universityId } : {}),
			...(careerId ? { career_id: careerId } : {}),
		});
		const { access_token, user: userData } = res.data;
		localStorage.setItem("access_token", access_token);
		setToken(access_token);
		setUser(userData);
	};

	const logout = () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("user");
		setToken(null);
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, token, loading, login, register, logout, refreshUser }}
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
