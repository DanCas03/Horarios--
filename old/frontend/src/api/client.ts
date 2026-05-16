import axios from "axios";

const api = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor: add JWT token to requests
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("access_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Interceptor: handle auth errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const hadToken = !!localStorage.getItem("access_token");
			localStorage.removeItem("access_token");
			localStorage.removeItem("user");
			// Solo redirigir si había una sesión activa (token expirado/inválido),
			// no cuando el usuario simplemente ingresó credenciales incorrectas
			if (hadToken) {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

// --- Auth ---
export const authAPI = {
	register: (data: {
		email: string;
		username: string;
		password: string;
		university_id?: string;
		career_id?: string;
	}) => api.post("/auth/register", data),
	login: (data: { email: string; password: string }) =>
		api.post("/auth/login", data),
	me: () => api.get("/auth/me"),
};

// --- Universities ---
export const universitiesAPI = {
	list: () => api.get("/universities/"),
	get: (id: string) => api.get(`/universities/${id}`),
};

// --- Careers ---
export const careersAPI = {
	list: (universityId?: string) =>
		api.get("/careers/", {
			params: universityId ? { university_id: universityId } : {},
		}),
	get: (id: string) => api.get(`/careers/${id}`),
};

// --- Subjects ---
export const subjectsAPI = {
	list: (params?: {
		career_id?: string;
		university_id?: string;
		semester?: number;
	}) => api.get("/subjects/", { params }),
	pensum: (careerId: string) => api.get(`/subjects/pensum/${careerId}`),
	get: (id: string) => api.get(`/subjects/${id}`),
	available: (careerId: string) => api.get(`/subjects/available/${careerId}`),
	approve: (data: { subject_code: string; grade?: number; period?: string }) =>
		api.post("/subjects/approve", data),
	unapprove: (subjectCode: string) =>
		api.delete(`/subjects/approve/${subjectCode}`),
};

// --- Reviews ---
export const reviewsAPI = {
	bySubject: (subjectCode: string, universityId?: string) =>
		api.get(`/reviews/subject/${subjectCode}`, {
			params: universityId ? { university_id: universityId } : {},
		}),
	byProfessor: (professorName: string) =>
		api.get(`/reviews/professor/${professorName}`),
	create: (data: {
		subject_code: string;
		university_id: string;
		professor_name?: string;
		period: string;
		section?: string;
		difficulty_rating: number;
		professor_rating?: number;
		workload_rating: number;
		would_recommend: boolean;
		comment?: string;
		tips?: string;
		study_strategy?: string;
	}) => api.post("/reviews/", data),
};

// --- Schedules ---
export const schedulesAPI = {
	my: (params?: { period?: string; schedule_type?: string }) =>
		api.get("/schedules/my", { params }),
	create: (data: any) => api.post("/schedules", data),
	update: (id: string, data: any) => api.put(`/schedules/${id}`, data),
	createTentative: (period: string, subjects: any[]) =>
		api.post(`/schedules/tentative?period=${period}`, subjects),
	delete: (id: string) => api.delete(`/schedules/${id}`),
};

/**
 * Convierte un error de Axios en un string legible.
 * FastAPI devuelve errores 422 como array de objetos {msg, loc, type};
 * errores 400/401 como string. Esta función maneja ambos casos.
 */
export function parseApiError(err: any, defaultMsg: string): string {
	const detail = err?.response?.data?.detail;
	if (Array.isArray(detail)) {
		return detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(". ");
	}
	if (typeof detail === "string") return detail;
	return defaultMsg;
}

export default api;
