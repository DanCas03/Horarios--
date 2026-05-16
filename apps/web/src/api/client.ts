"use client";

import { env } from "@horaios/env/web";
import axios from "axios";

const api = axios.create({
	baseURL: `${env.NEXT_PUBLIC_API_URL}/api`,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("access_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const hadToken = !!localStorage.getItem("access_token");
			localStorage.removeItem("access_token");
			localStorage.removeItem("user");
			if (hadToken) {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

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

export const universitiesAPI = {
	list: () => api.get("/universities/"),
	get: (id: string) => api.get(`/universities/${id}`),
};

export const careersAPI = {
	list: (universityId?: string) =>
		api.get("/careers/", {
			params: universityId ? { university_id: universityId } : {},
		}),
	get: (id: string) => api.get(`/careers/${id}`),
};

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

export const schedulesAPI = {
	my: (params?: { period?: string; schedule_type?: string }) =>
		api.get("/schedules/my", { params }),
	create: (data: unknown) => api.post("/schedules", data),
	update: (id: string, data: unknown) => api.put(`/schedules/${id}`, data),
	createTentative: (period: string, subjects: unknown[]) =>
		api.post(`/schedules/tentative?period=${period}`, subjects),
	delete: (id: string) => api.delete(`/schedules/${id}`),
};

export function parseApiError(err: unknown, defaultMsg: string): string {
	const detail = (err as { response?: { data?: { detail?: unknown } } })
		?.response?.data?.detail;
	if (Array.isArray(detail)) {
		return detail
			.map((d) =>
				typeof d === "object" && d !== null && "msg" in d
					? String((d as { msg: unknown }).msg)
					: JSON.stringify(d),
			)
			.join(". ");
	}
	if (typeof detail === "string") return detail;
	return defaultMsg;
}

export default api;
