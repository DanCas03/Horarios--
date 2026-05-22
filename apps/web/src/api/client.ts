"use client";

import axios from "axios";

const api = axios.create({
	baseURL: "/api",
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// Auth handled via better-auth cookies (withCredentials: true)

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
		subjectCode: string;
		universityId: string;
		professorName?: string;
		period: string;
		section?: string;
		difficultyRating: number;
		professorRating?: number;
		workloadRating: number;
		wouldRecommend: boolean;
		comment?: string;
		tips?: string;
		studyStrategy?: string;
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
