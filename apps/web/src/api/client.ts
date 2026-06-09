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
		academic_program_id?: string;
	}) => api.post("/auth/register", data),
	login: (data: { email: string; password: string }) =>
		api.post("/auth/login", data),
	me: () => api.get("/auth/me"),
};

export const universitiesAPI = {
	list: () => api.get("/universities/"),
	get: (id: string) => api.get(`/universities/${id}`),
};

export const academicProgramsAPI = {
	list: (universityId?: string) =>
		api.get("/academic-programs/", {
			params: universityId ? { university_id: universityId } : {},
		}),
	get: (id: string) => api.get(`/academic-programs/${id}`),
};

export const periodsAPI = {
	list: (universityId?: string) =>
		api.get("/periods", {
			params: universityId ? { university_id: universityId } : {},
		}),
};

export const subjectsAPI = {
	list: (params?: {
		academic_program_id?: string;
		university_id?: string;
		semester?: number;
	}) => api.get("/subjects/", { params }),
	pensum: (programId: string) => api.get(`/subjects/pensum/${programId}`),
	get: (id: string) => api.get(`/subjects/${id}`),
	available: (programId: string) => api.get(`/subjects/available/${programId}`),
	approve: (data: { subjectId: string; grade?: number; period?: string }) =>
		api.post("/subjects/approve", data),
	unapprove: (subjectId: string) =>
		api.delete(`/subjects/approve/${subjectId}`),
	sections: (subjectId: string, periodId?: string) =>
		api.get("/sections", { params: { subjectId, periodId } }),
};

export const reviewsAPI = {
	bySubject: (subjectCode: string, universityId?: string) =>
		api.get(`/reviews/subject/${subjectCode}`, {
			params: universityId ? { university_id: universityId } : {},
		}),
	byProfessor: (teacherId: string) =>
		api.get(`/reviews/professor/${teacherId}`),
	create: (data: {
		subjectCode: string;
		universityId?: string;
		teacherIds?: string[];
		periodId?: string;
		sectionId?: string;
		ratings: { category: string; value: number }[];
		overallRating?: number;
		wouldRecommend: boolean;
		comment: string;
		tips?: string;
		studyStrategy?: string;
	}) => api.post("/reviews/", data),
};

export const schedulesAPI = {
	my: (params?: { periodId?: string; schedule_type?: string }) =>
		api.get("/schedules/my", { params }),
	create: (data: unknown) => api.post("/schedules", data),
	update: (id: string, data: unknown) => api.put(`/schedules/${id}`, data),
	createTentative: (periodId: string, data: { sectionIds?: string[]; customBlocks?: any[] }) =>
		api.post(`/schedules/tentative?periodId=${periodId}`, data),
	delete: (id: string) => api.delete(`/schedules/${id}`),
};

export const surveyAPI = {
	complete: () => api.patch("/auth/me/survey"),
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
