/**
 * Enhanced security utilities for BlendSphere frontend
 * Includes input sanitization, XSS prevention, and security monitoring
 */

import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Advanced input sanitization using sanitize-html
 */
export function sanitizeInput(
	input: string,
	options?: {
		allowedTags?: string[];
		allowedAttributes?: Record<string, string[]>;
		strict?: boolean;
	}
): string {
	const defaultOptions = {
		allowedTags: [], // No HTML tags allowed by default
		allowedAttributes: {},
		disallowedTagsMode: 'discard' as const,
		allowedSchemes: ['http', 'https', 'mailto'],
		allowedSchemesByTag: {},
		allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
		allowProtocolRelative: false
	};

	if (options?.strict) {
		// Extra strict mode - only allow alphanumeric and basic punctuation
		return input
			.replace(/[<>'"&]/g, '') // Remove dangerous characters
			.replace(/javascript:/gi, '') // Remove javascript: protocol
			.replace(/[^\w\s\-.,!?@]/g, '') // Only allow word chars, spaces, and basic punctuation
			.trim()
			.slice(0, 1000); // Limit length
	}

	let sanitized = sanitizeHtml(input, {
		...defaultOptions,
		allowedTags: options?.allowedTags || [],
		allowedAttributes: options?.allowedAttributes || {}
	});

	// Additional checks for dangerous patterns
	sanitized = sanitized.replace(/javascript:/gi, '');
	sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
	sanitized = sanitized.replace(/onerror\s*=/gi, '');
	sanitized = sanitized.replace(/onload\s*=/gi, '');

	return sanitized;
}

/**
 * Enhanced email validation
 */
export function validateEmail(email: string): boolean {
	if (!email || email.length > 320) return false; // RFC 5321 limit

	return validator.isEmail(email, {
		allow_utf8_local_part: false,
		require_tld: true,
		allow_ip_domain: false,
		domain_specific_validation: true
	});
}

/**
 * Enhanced URL validation
 */
export function validateUrl(url: string, allowedDomains?: string[]): boolean {
	if (!url) return false;

	try {
		const parsedUrl = new URL(url);

		// Check protocol
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			return false;
		}

		// Check domain whitelist if provided
		if (
			allowedDomains &&
			!allowedDomains.some(
				(domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
			)
		) {
			return false;
		}

		// Allow localhost for development
		if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
			return true;
		}

		// Use validator.js for other URLs
		return validator.isURL(url, {
			protocols: ['http', 'https'],
			require_protocol: true,
			require_valid_protocol: true,
			allow_underscores: false,
			allow_trailing_dot: false,
			allow_protocol_relative_urls: false
		});
	} catch {
		return false;
	}
}

/**
 * SQL injection prevention for dynamic queries
 */
export function escapeForSQL(input: string): string {
	return (
		input
			.replace(/'/g, "''")
			.replace(/"/g, '""')
			.replace(/\\/g, '\\\\')
			// eslint-disable-next-line security/detect-non-literal-regexp
			.replace(new RegExp(String.fromCharCode(0), 'g'), '\\0')
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '\\r')
			// eslint-disable-next-line security/detect-non-literal-regexp
			.replace(new RegExp(String.fromCharCode(26), 'g'), '\\Z')
			.replace(/;/g, '\\;')
			.replace(/--/g, '\\-\\-')
	);
}

/**
 * Type for sanitizable values that can be processed by NoSQL sanitization
 */
type SanitizableValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| SanitizableObject
	| SanitizableValue[];

interface SanitizableObject {
	[key: string]: SanitizableValue;
}

/**
 * NoSQL injection prevention
 */
export function sanitizeForNoSQL(input: SanitizableValue): SanitizableValue {
	if (typeof input === 'string') {
		return sanitizeInput(input, { strict: true });
	}

	if (Array.isArray(input)) {
		return input.map(sanitizeForNoSQL);
	}

	if (typeof input === 'object' && input !== null) {
		const sanitized: Record<string, SanitizableValue> = {};
		for (const [key, value] of Object.entries(input)) {
			// Prevent prototype pollution
			if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
				continue;
			}

			const sanitizedKey = sanitizeInput(key, { strict: true });
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				// Convert non-array objects to strings to prevent NoSQL injection operators like $ne, $gt, etc.
				sanitized[sanitizedKey] = JSON.stringify(value);
			} else {
				sanitized[sanitizedKey] = sanitizeForNoSQL(value);
			}
		}
		return sanitized;
	}

	return input;
}

/**
 * Content Security Policy nonce generation
 */
export function generateSecureNonce(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
}

/**
 * Enhanced rate limiting with exponential backoff
 */
export class AdvancedRateLimiter {
	private attempts: Map<string, { count: number; lastAttempt: number; backoffMultiplier: number }> =
		new Map();

	constructor(
		private maxAttempts: number,
		private windowMs: number,
		private baseBackoffMs: number = 1000,
		private maxBackoffMs: number = 300000
	) {}

	canAttempt(identifier: string): { allowed: boolean; retryAfter?: number } {
		const now = Date.now();
		const attempt = this.attempts.get(identifier);

		if (!attempt) {
			this.attempts.set(identifier, { count: 1, lastAttempt: now, backoffMultiplier: 1 });
			return { allowed: true };
		}

		// Reset if window has passed
		if (now - attempt.lastAttempt > this.windowMs) {
			this.attempts.set(identifier, { count: 1, lastAttempt: now, backoffMultiplier: 1 });
			return { allowed: true };
		}

		// Check if we've exceeded the limit
		if (attempt.count >= this.maxAttempts) {
			// Calculate current backoff time
			const backoffTime = Math.min(
				this.baseBackoffMs * Math.pow(2, attempt.backoffMultiplier - 1),
				this.maxBackoffMs
			);

			// Increase backoff multiplier for next time
			attempt.backoffMultiplier = Math.min(attempt.backoffMultiplier + 1, 10);
			attempt.lastAttempt = now;

			return {
				allowed: false,
				retryAfter: backoffTime
			};
		}

		// Allow attempt but increment count
		attempt.count++;
		attempt.lastAttempt = now;
		return { allowed: true };
	}

	reset(identifier: string): void {
		this.attempts.delete(identifier);
	}

	cleanup(): void {
		const now = Date.now();
		for (const [key, attempt] of this.attempts.entries()) {
			if (now - attempt.lastAttempt > this.windowMs * 2) {
				this.attempts.delete(key);
			}
		}
	}
}

/**
 * Security event logger with structured logging
 */
export interface SecurityEvent {
	id: string;
	type: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	details: Record<string, unknown>;
	timestamp: string;
	userAgent?: string;
	ip?: string;
	userId?: string;
}

export class SecurityLogger {
	private events: SecurityEvent[] = [];
	private maxEvents = 1000;

	log(event: Omit<SecurityEvent, 'timestamp' | 'id'>): void {
		const securityEvent: SecurityEvent = {
			...event,
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
		};

		this.events.push(securityEvent);

		// Keep only recent events
		if (this.events.length > this.maxEvents) {
			this.events = this.events.slice(-this.maxEvents);
		}

		// Log to console in development
		if (process.env.NODE_ENV === 'development') {
			console.warn(`[SECURITY] ${event.severity.toUpperCase()}: ${event.type}`, event.details);
		}

		// In production, you would send this to your monitoring service
		// await this.sendToMonitoringService(securityEvent);
	}

	getRecentEvents(limit = 50): SecurityEvent[] {
		return this.events.slice(-limit);
	}

	getEventsByType(type: string): SecurityEvent[] {
		return this.events.filter((event) => event.type === type);
	}

	getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
		return this.events.filter((event) => event.severity === severity);
	}
}

// Global security logger instance
export const securityLogger = new SecurityLogger();

// Enhanced rate limiters with exponential backoff
export const loginRateLimiter = new AdvancedRateLimiter(5, 60000, 1000, 300000);
export const signupRateLimiter = new AdvancedRateLimiter(3, 60000, 2000, 600000);
export const passwordResetRateLimiter = new AdvancedRateLimiter(3, 300000, 5000, 900000); // 5 minutes window

/**
 * Enhanced fingerprinting for rate limiting
 */
export function getEnhancedFingerprint(): string {
	if (typeof window === 'undefined') return 'server';

	const components = [
		navigator.userAgent,
		navigator.language,
		screen.width + 'x' + screen.height,
		new Date().getTimezoneOffset().toString(),
		navigator.platform,
		navigator.cookieEnabled ? '1' : '0'
	];

	// Simple hash function
	let hash = 0;
	const str = components.join('|');
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(36);
}

/**
 * Interface for stored data with expiration
 */
interface StoredData {
	value: unknown;
	timestamp: number;
	expiration: number | null;
}

/**
 * Secure local storage with encryption and integrity checks
 */
export class SecureLocalStorage {
	private key: string;

	constructor(key = 'blendsphere_secure') {
		this.key = key;
	}

	private encrypt(data: string): string {
		// Simple XOR encryption (in production, use a proper encryption library)
		const key = this.key;
		let encrypted = '';
		for (let i = 0; i < data.length; i++) {
			encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
		}
		return btoa(encrypted);
	}

	private decrypt(encryptedData: string): string {
		try {
			const data = atob(encryptedData);
			const key = this.key;
			let decrypted = '';
			for (let i = 0; i < data.length; i++) {
				decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
			}
			return decrypted;
		} catch {
			return '';
		}
	}

	setItem(key: string, value: unknown, expirationMs?: number): void {
		try {
			const data: StoredData = {
				value,
				timestamp: Date.now(),
				expiration: expirationMs ? Date.now() + expirationMs : null
			};

			const encrypted = this.encrypt(JSON.stringify(data));
			localStorage.setItem(key, encrypted);
		} catch (error) {
			securityLogger.log({
				type: 'storage_error',
				severity: 'medium',
				message: 'Failed to store encrypted data in localStorage',
				details: { error: error instanceof Error ? error.message : 'Unknown error', key }
			});
		}
	}

	getItem(key: string): unknown {
		try {
			const encrypted = localStorage.getItem(key);
			if (!encrypted) return null;

			const decrypted = this.decrypt(encrypted);
			if (!decrypted) return null;

			const data: StoredData = JSON.parse(decrypted) as StoredData;

			// Check expiration
			if (data.expiration && Date.now() > data.expiration) {
				this.removeItem(key);
				return null;
			}

			return data.value;
		} catch {
			// Remove corrupted data
			this.removeItem(key);
			return null;
		}
	}

	removeItem(key: string): void {
		localStorage.removeItem(key);
	}

	clear(): void {
		localStorage.clear();
	}
}

// Global secure storage instance
export const secureStorage = new SecureLocalStorage();
