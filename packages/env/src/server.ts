import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const getDeploymentUrl = () => {
	if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}
	if (process.env.VERCEL_BRANCH_URL) {
		return `https://${process.env.VERCEL_BRANCH_URL}`;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return "http://localhost:3000";
};

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.preprocess(
			(val) => val ?? getDeploymentUrl(),
			z.string().url()
		),
		CORS_ORIGIN: z.preprocess(
			(val) => val ?? getDeploymentUrl(),
			z.string().url()
		),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
