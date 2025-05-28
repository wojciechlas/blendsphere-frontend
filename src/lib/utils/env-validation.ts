/**
 * Environment variable validation and security configuration
 * Ensures all required environment variables are present and properly formatted
 */

import { z } from 'zod';

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
	// Base configuration
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

	// PocketBase configuration
	PUBLIC_POCKETBASE_URL: z.string().url('Invalid PocketBase URL'),

	// Security configuration
	VITE_DEBUG_MODE: z
		.string()
		.transform((val) => val === 'true')
		.optional(),
	VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

	// Content Security Policy
	VITE_CSP_DEFAULT_SRC: z.string().default("'self'"),
	VITE_CSP_SCRIPT_SRC: z.string().default("'self' 'unsafe-inline'"),
	VITE_CSP_STYLE_SRC: z.string().default("'self' 'unsafe-inline' https://fonts.googleapis.com"),
	VITE_CSP_IMG_SRC: z.string().default("'self' data: https:"),
	VITE_CSP_FONT_SRC: z.string().default("'self' https://fonts.gstatic.com"),
	VITE_CSP_CONNECT_SRC: z.string().default("'self' ws://localhost:* wss://localhost:* https:"),

	// Rate limiting configuration
	VITE_RATE_LIMIT_LOGIN_ATTEMPTS: z
		.string()
		.transform((val) => parseInt(val, 10))
		.default('5'),
	VITE_RATE_LIMIT_LOGIN_WINDOW: z
		.string()
		.transform((val) => parseInt(val, 10))
		.default('60000'),
	VITE_RATE_LIMIT_SIGNUP_ATTEMPTS: z
		.string()
		.transform((val) => parseInt(val, 10))
		.default('3'),
	VITE_RATE_LIMIT_SIGNUP_WINDOW: z
		.string()
		.transform((val) => parseInt(val, 10))
		.default('60000'),

	// Session configuration
	VITE_SESSION_TIMEOUT: z
		.string()
		.transform((val) => parseInt(val, 10))
		.default('1800000'), // 30 minutes
	VITE_SESSION_RENEW_THRESHOLD: z
		.string()
		.transform((val) => parseInt(val, 10))
		.default('300000'), // 5 minutes

	// Feature flags
	VITE_ENABLE_SECURITY_LOGGING: z
		.string()
		.transform((val) => val === 'true')
		.default(true),
	VITE_ENABLE_RATE_LIMITING: z
		.string()
		.transform((val) => val === 'true')
		.default(true),
	VITE_ENABLE_FINGERPRINTING: z
		.string()
		.transform((val) => val === 'true')
		.default(true),

	// Development only
	VITE_MOCK_SECURITY_EVENTS: z
		.string()
		.transform((val) => val === 'true')
		.optional()
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
export function validateEnv(): AppEnv {
	try {
		// Combine process.env and import.meta.env for comprehensive validation
		const envVars = {
			...process.env,
			...(typeof window === 'undefined' && import.meta?.env ? import.meta.env : {})
		};

		const parsed = envSchema.parse(envVars);

		// Additional validation for production
		if (parsed.NODE_ENV === 'production') {
			validateProductionEnv(parsed);
		}

		return parsed;
	} catch (error) {
		console.error('❌ Environment validation failed:');
		if (error instanceof z.ZodError) {
			error.errors.forEach((err) => {
				console.error(`  - ${err.path.join('.')}: ${err.message}`);
			});
		} else {
			console.error('  -', error);
		}

		throw new Error('Invalid environment configuration');
	}
}

/**
 * Additional validation for production environment
 */
function validateProductionEnv(env: AppEnv): void {
	const issues: string[] = [];

	// Ensure HTTPS in production
	if (!env.PUBLIC_POCKETBASE_URL.startsWith('https://')) {
		issues.push('PocketBase URL must use HTTPS in production');
	}

	// Ensure debug mode is disabled
	if (env.VITE_DEBUG_MODE === true) {
		issues.push('Debug mode should be disabled in production');
	}

	// Ensure appropriate log level
	if (env.VITE_LOG_LEVEL === 'debug') {
		issues.push('Log level should not be "debug" in production');
	}

	// Ensure CSP is properly configured
	if (env.VITE_CSP_SCRIPT_SRC.includes('unsafe-eval')) {
		issues.push('CSP should not allow "unsafe-eval" in production');
	}

	if (issues.length > 0) {
		console.warn('⚠️ Production environment warnings:');
		issues.forEach((issue) => console.warn(`  - ${issue}`));
	}
}

/**
 * Get runtime configuration based on validated environment
 */
export function getSecurityConfig(): {
	rateLimiting: {
		login: { attempts: number; windowMs: number };
		signup: { attempts: number; windowMs: number };
	};
	session: {
		timeoutMs: number;
		renewThresholdMs: number;
	};
	features: {
		securityLogging: boolean;
		rateLimiting: boolean;
		fingerprinting: boolean;
	};
	csp: {
		defaultSrc: string;
		scriptSrc: string;
		styleSrc: string;
		imgSrc: string;
		fontSrc: string;
		connectSrc: string;
	};
} {
	const env = validateEnv();

	return {
		rateLimiting: {
			login: {
				attempts: env.VITE_RATE_LIMIT_LOGIN_ATTEMPTS,
				windowMs: env.VITE_RATE_LIMIT_LOGIN_WINDOW
			},
			signup: {
				attempts: env.VITE_RATE_LIMIT_SIGNUP_ATTEMPTS,
				windowMs: env.VITE_RATE_LIMIT_SIGNUP_WINDOW
			}
		},
		session: {
			timeoutMs: env.VITE_SESSION_TIMEOUT,
			renewThresholdMs: env.VITE_SESSION_RENEW_THRESHOLD
		},
		features: {
			securityLogging: env.VITE_ENABLE_SECURITY_LOGGING,
			rateLimiting: env.VITE_ENABLE_RATE_LIMITING,
			fingerprinting: env.VITE_ENABLE_FINGERPRINTING
		},
		csp: {
			defaultSrc: env.VITE_CSP_DEFAULT_SRC,
			scriptSrc: env.VITE_CSP_SCRIPT_SRC,
			styleSrc: env.VITE_CSP_STYLE_SRC,
			imgSrc: env.VITE_CSP_IMG_SRC,
			fontSrc: env.VITE_CSP_FONT_SRC,
			connectSrc: env.VITE_CSP_CONNECT_SRC
		}
	};
}

/**
 * Security-focused environment checks
 */
export function performSecurityChecks(): {
	passed: boolean;
	warnings: string[];
	errors: string[];
} {
	const warnings: string[] = [];
	const errors: string[] = [];

	try {
		const env = validateEnv();

		// Check for development practices in production
		if (env.NODE_ENV === 'production') {
			if (env.VITE_DEBUG_MODE) {
				warnings.push('Debug mode is enabled in production');
			}

			if (env.VITE_LOG_LEVEL === 'debug') {
				warnings.push('Debug logging is enabled in production');
			}

			// Check CSP configuration
			if (env.VITE_CSP_SCRIPT_SRC.includes('unsafe-inline')) {
				warnings.push('CSP allows unsafe-inline scripts (consider using nonces)');
			}

			if (env.VITE_CSP_SCRIPT_SRC.includes('unsafe-eval')) {
				errors.push('CSP allows unsafe-eval (security risk)');
			}
		}

		// Check rate limiting configuration
		if (env.VITE_RATE_LIMIT_LOGIN_ATTEMPTS > 10) {
			warnings.push('Login rate limit attempts seem high (>10)');
		}

		if (env.VITE_RATE_LIMIT_LOGIN_WINDOW < 30000) {
			warnings.push('Login rate limit window seems short (<30s)');
		}

		// Check session configuration
		if (env.VITE_SESSION_TIMEOUT > 7200000) {
			// 2 hours
			warnings.push('Session timeout seems long (>2 hours)');
		}

		if (env.VITE_SESSION_TIMEOUT < 300000) {
			// 5 minutes
			warnings.push('Session timeout seems short (<5 minutes)');
		}
	} catch (error) {
		errors.push(
			`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return {
		passed: errors.length === 0,
		warnings,
		errors
	};
}

/**
 * Generate security report
 */
export function generateSecurityReport(): string {
	const checks = performSecurityChecks();
	const config = getSecurityConfig();

	let report = '# BlendSphere Security Configuration Report\n\n';

	report += '## Environment Validation\n';
	if (checks.passed) {
		report += '✅ All environment variables are valid\n\n';
	} else {
		report += '❌ Environment validation failed\n\n';
		if (checks.errors.length > 0) {
			report += '### Errors:\n';
			checks.errors.forEach((error) => {
				report += `- ${error}\n`;
			});
			report += '\n';
		}
	}

	if (checks.warnings.length > 0) {
		report += '### Warnings:\n';
		checks.warnings.forEach((warning) => {
			report += `- ${warning}\n`;
		});
		report += '\n';
	}

	report += '## Security Configuration\n\n';

	report += '### Rate Limiting\n';
	report += `- Login: ${config.rateLimiting.login.attempts} attempts per ${config.rateLimiting.login.windowMs}ms\n`;
	report += `- Signup: ${config.rateLimiting.signup.attempts} attempts per ${config.rateLimiting.signup.windowMs}ms\n\n`;

	report += '### Session Management\n';
	report += `- Timeout: ${config.session.timeoutMs}ms (${Math.round(config.session.timeoutMs / 60000)} minutes)\n`;
	report += `- Renewal Threshold: ${config.session.renewThresholdMs}ms (${Math.round(config.session.renewThresholdMs / 60000)} minutes)\n\n`;

	report += '### Feature Flags\n';
	report += `- Security Logging: ${config.features.securityLogging ? '✅' : '❌'}\n`;
	report += `- Rate Limiting: ${config.features.rateLimiting ? '✅' : '❌'}\n`;
	report += `- Fingerprinting: ${config.features.fingerprinting ? '✅' : '❌'}\n\n`;

	report += '### Content Security Policy\n';
	report += `- Default Source: ${config.csp.defaultSrc}\n`;
	report += `- Script Source: ${config.csp.scriptSrc}\n`;
	report += `- Style Source: ${config.csp.styleSrc}\n`;
	report += `- Image Source: ${config.csp.imgSrc}\n`;
	report += `- Font Source: ${config.csp.fontSrc}\n`;
	report += `- Connect Source: ${config.csp.connectSrc}\n\n`;

	report += '## Recommendations\n\n';
	if (config.csp.scriptSrc.includes('unsafe-inline')) {
		report += '- Consider implementing nonces to remove unsafe-inline from CSP\n';
	}
	if (!config.features.securityLogging) {
		report += '- Enable security logging for better monitoring\n';
	}
	if (!config.features.rateLimiting) {
		report += '- Enable rate limiting to prevent abuse\n';
	}

	return report;
}

// Export the validated environment for use throughout the app
export const appEnv = validateEnv();
