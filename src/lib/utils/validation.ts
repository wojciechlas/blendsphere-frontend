import { z } from 'zod';
import { Language, UserRole } from '$lib/components/schemas';

/**
 * Form validation utilities using Zod
 */

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

/**
 * Password validation schema with custom refinements
 */
const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters long')
	.refine((password) => /[A-Z]/.test(password), {
		message: 'Password must contain at least one uppercase letter'
	})
	.refine((password) => /[a-z]/.test(password), {
		message: 'Password must contain at least one lowercase letter'
	})
	.refine((password) => /\d/.test(password), {
		message: 'Password must contain at least one number'
	})
	.refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
		message: 'Password must contain at least one special character'
	});

/**
 * Email validation schema
 */
const emailSchema = z
	.string()
	.trim()
	.min(1, 'Email is required')
	.email('Please enter a valid email address');

/**
 * Name validation schema
 */
const nameSchema = z
	.string()
	.trim()
	.min(2, 'Name must be at least 2 characters long')
	.max(100, 'Name must be less than 100 characters')
	.optional();

/**
 * Username validation schema
 */
const usernameSchema = z
	.string()
	.trim()
	.min(3, 'Username must be at least 3 characters long')
	.max(30, 'Username must be less than 30 characters')
	.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

/**
 * Native language validation schema
 */
const nativeLanguageSchema = z.nativeEnum(Language, {
	errorMap: () => ({ message: 'Please select a valid native language' })
});

/**
 * User role validation schema
 */
const userRoleSchema = z.nativeEnum(UserRole, {
	errorMap: () => ({ message: 'Please select a valid account type' })
});

/**
 * About me validation schema
 */
const aboutMeSchema = z
	.string()
	.trim()
	.max(500, 'About me must be less than 500 characters')
	.optional();

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, 'Password is required')
});

/**
 * Signup form validation schema
 */
export const signupSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
		passwordConfirm: z.string().min(1, 'Password confirmation is required'),
		name: nameSchema,
		username: usernameSchema,
		nativeLanguage: nativeLanguageSchema,
		role: userRoleSchema,
		aboutMe: aboutMeSchema
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords do not match',
		path: ['passwordConfirm']
	});

/**
 * Password reset request schema
 */
export const passwordResetSchema = z.object({
	email: emailSchema
});

/**
 * Validate email format (legacy function for backward compatibility)
 */
export function validateEmail(email: string): boolean {
	return emailSchema.safeParse(email).success;
}

/**
 * Validate password strength (legacy function for backward compatibility)
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
	const result = passwordSchema.safeParse(password);

	if (result.success) {
		return { isValid: true, errors: [] };
	}

	return {
		isValid: false,
		errors: result.error.errors.map((err) => err.message)
	};
}

/**
 * Convert Zod validation errors to our ValidationError format
 */
function convertZodErrors(zodError: z.ZodError): ValidationError[] {
	return zodError.errors.map((err) => ({
		field: err.path[0]?.toString() || 'unknown',
		message: err.message
	}));
}

/**
 * Validate login form using Zod schema
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
	const result = loginSchema.safeParse({ email, password });

	if (result.success) {
		return { isValid: true, errors: [] };
	}

	return {
		isValid: false,
		errors: convertZodErrors(result.error)
	};
}

/**
 * Validate signup form using Zod schema
 */
export function validateSignupForm(
	email: string,
	password: string,
	passwordConfirm: string,
	name?: string,
	username?: string,
	nativeLanguage?: string,
	role?: string,
	aboutMe?: string
): ValidationResult {
	const result = signupSchema.safeParse({
		email,
		password,
		passwordConfirm,
		name: name || undefined,
		username,
		nativeLanguage,
		role,
		aboutMe: aboutMe || undefined
	});

	if (result.success) {
		return { isValid: true, errors: [] };
	}

	return {
		isValid: false,
		errors: convertZodErrors(result.error)
	};
}

/**
 * Validate password reset form using Zod schema
 */
export function validatePasswordResetForm(email: string): ValidationResult {
	const result = passwordResetSchema.safeParse({ email });

	if (result.success) {
		return { isValid: true, errors: [] };
	}

	return {
		isValid: false,
		errors: convertZodErrors(result.error)
	};
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
	return input
		.replace(/[<>]/g, '') // Remove < and > characters
		.trim();
}

/**
 * Type-safe form validation using Zod schemas
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

/**
 * Generic validation function for any Zod schema
 */
export function validateWithSchema<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	return {
		success: false,
		errors: convertZodErrors(result.error)
	};
}
