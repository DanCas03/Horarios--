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

export const academicUnitsAPI = {
	list: (universityId?: string) =>
		api.get("/academic-units", {
			params: universityId ? { university_id: universityId } : {},
		}),
	create: (data: {
		name: string;
		code?: string | null;
		universityId: string;
		isExtracurricular?: boolean;
		parentId?: string | null;
	}) => api.post("/academic-units", data),
	update: (
		id: string,
		data: {
			name?: string;
			code?: string | null;
			isExtracurricular?: boolean;
			parentId?: string | null;
		},
	) => api.put(`/academic-units/${id}`, data),
	delete: (id: string) => api.delete(`/academic-units/${id}`),
};

export const subjectsAPI = {
	list: (params?: {
		academic_program_id?: string;
		university_id?: string;
		semester?: number;
		academic_unit_id?: string;
	}) => api.get("/subjects/", { params }),
	pensum: (programId: string) => api.get(`/subjects/pensum/${programId}`),
	get: (id: string) => api.get(`/subjects/${id}`),
	available: (programId: string) => api.get(`/subjects/available/${programId}`),
	approve: (data: {
		subjectId?: string;
		subjectIds?: string[];
		grade?: number;
		period?: string;
	}) => api.post("/subjects/approve", data),
	unapprove: (subjectId: string) =>
		api.delete(`/subjects/approve/${subjectId}`),
	sections: (subjectId: string, periodId?: string) =>
		api.get("/sections", { params: { subjectId, periodId } }),
	create: (data: {
		name: string;
		code: string;
		universityId: string;
		credits: number;
		subjectType?: string;
		modality?: string;
		usualAvailability?: string;
		description?: string;
		academicUnitId?: string;
	}) => api.post("/subjects", data),
	update: (
		id: string,
		data: {
			name?: string;
			code?: string;
			credits?: number;
			modality?: string;
			subjectType?: string;
			academicUnitId?: string | null;
			description?: string | null;
			isActive?: boolean;
			usualAvailability?: string | null;
		},
	) => api.put(`/subjects/${id}`, data),
	delete: (id: string) => api.delete(`/subjects/${id}`),
};

export const reviewsAPI = {
	bySubject: (subjectCode: string, universityId?: string) =>
		api.get(`/reviews/subject/${subjectCode}`, {
			params: universityId ? { university_id: universityId } : {},
		}),
	byProfessor: (teacherId: string) =>
		api.get(`/reviews/professor/${teacherId}`),
	mine: () => api.get("/reviews/mine"),
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
		notFoundTeacherNames?: string;
	}) => api.post("/reviews/", data),
};

export const teachersAPI = {
	list: () => api.get("/teachers"),
};

export const schedulesAPI = {
	my: (params?: { periodId?: string; schedule_type?: string }) =>
		api.get("/schedules/my", { params }),
	create: (data: unknown) => api.post("/schedules", data),
	update: (id: string, data: unknown) => api.put(`/schedules/${id}`, data),
	createTentative: (
		periodId: string,
		data: { sectionIds?: string[]; customBlocks?: any[] },
	) => api.post(`/schedules/tentative?periodId=${periodId}`, data),
	delete: (id: string) => api.delete(`/schedules/${id}`),
};

export const studyPlansAPI = {
	list: (academicProgramId?: string) =>
		api.get("/study-plans", {
			params: academicProgramId
				? { academic_program_id: academicProgramId }
				: {},
		}),
	create: (data: {
		name: string;
		academicProgramId: string;
		isActive?: boolean;
	}) => api.post("/study-plans", data),
	update: (id: string, data: { name?: string; isActive?: boolean }) =>
		api.put(`/study-plans/${id}`, data),
	delete: (id: string) => api.delete(`/study-plans/${id}`),
};

export const studyPlanSubjectsAPI = {
	list: (studyPlanId: string) =>
		api.get("/study-plan-subjects", { params: { study_plan_id: studyPlanId } }),
	assign: (data: {
		studyPlanId: string;
		subjectId: string;
		suggestedTerm: number;
		prerequisiteIds?: string[];
		corequisiteIds?: string[];
	}) => api.post("/study-plan-subjects", data),
	update: (
		id: string,
		data: {
			suggestedTerm?: number;
			prerequisiteIds?: string[];
			corequisiteIds?: string[];
		},
	) => api.put(`/study-plan-subjects/${id}`, data),
	delete: (id: string) => api.delete(`/study-plan-subjects/${id}`),
};

export const surveyAPI = {
	complete: () => api.patch("/auth/me/survey"),
};

export function parseApiError(err: unknown, defaultMsg: string): string {
	const data = (err as { response?: { data?: any } })?.response?.data;
	if (data && typeof data === "object") {
		if (data.detail) {
			const detail = data.detail;
			if (Array.isArray(detail)) {
				return detail
					.map((d) =>
						typeof d === "object" && d !== null && "msg" in d
							? String((d as { msg: any }).msg)
							: JSON.stringify(d),
					)
					.join(". ");
			}
			if (typeof detail === "string") return detail;
		}
		if (typeof data.error === "string") {
			return data.error;
		}
		if (typeof data.message === "string") {
			return data.message;
		}
	}
	return defaultMsg;
}

export default api;
