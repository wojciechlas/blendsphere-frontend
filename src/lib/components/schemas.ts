import { z } from "zod";

export const schema = z.object({
	id: z.number(),
	header: z.string(),
	type: z.string(),
	status: z.string(),
	target: z.string(),
	limit: z.string(),
	reviewer: z.string(),
});

export type Schema = z.infer<typeof schema>;

export enum Language {
	EN = "EN",
	ES = "ES",
	FR = "FR",
	DE = "DE",
	IT = "IT",
	PL = "PL",
	// Add other supported languages here
}

export enum UserRole {
	ADMIN = "ADMIN",
	TEACHER = "TEACHER",
	STUDENT = "STUDENT",
	INDIVIDUAL_LEARNER = "INDIVIDUAL_LEARNER",
}

export enum LanguageLevel {
	A1 = "A1",
	A2 = "A2",
	B1 = "B1",
	B2 = "B2",
	C1 = "C1",
	C2 = "C2",
}
