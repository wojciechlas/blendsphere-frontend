/**
 * Security utilities for BlendSphere frontend
 */

interface RateLimitEntry {
	count: number;
	lastAttempt: number;
	blockedUntil?: number;
}

// Rate limiting storage (in a real app, this would be in a more persistent store)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple client-side rate limiting
 * Note: This is not a replacement for server-side rate limiting
 */
export class RateLimiter {
	private limit: number;
	private windowMs: number;
	private blockDurationMs: number;

	constructor(limit: number, windowMs: number = 60000, blockDurationMs: number = 300000) {
		this.limit = limit;
		this.windowMs = windowMs;
		this.blockDurationMs = blockDurationMs;
	}

	isAllowed(identifier: string): boolean {
		const now = Date.now();
		const entry = rateLimitStore.get(identifier);

		if (!entry) {
			rateLimitStore.set(identifier, {
				count: 1,
				lastAttempt: now
			});
			return true;
		}

		// Check if currently blocked
		if (entry.blockedUntil && now < entry.blockedUntil) {
			return false;
		}

		// Reset count if window has passed
		if (now - entry.lastAttempt > this.windowMs) {
			entry.count = 1;
			entry.lastAttempt = now;
			entry.blockedUntil = undefined;
			return true;
		}

		// Increment count
		entry.count++;
		entry.lastAttempt = now;

		// Block if limit exceeded
		if (entry.count > this.limit) {
			entry.blockedUntil = now + this.blockDurationMs;
			return false;
		}

		return true;
	}

	getRemainingTime(identifier: string): number {
		const entry = rateLimitStore.get(identifier);
		if (!entry?.blockedUntil) return 0;

		return Math.max(0, entry.blockedUntil - Date.now());
	}
}

// Create rate limiters for different actions
export const loginRateLimiter = new RateLimiter(5, 60000, 300000); // 5 attempts per minute, 5min block
export const signupRateLimiter = new RateLimiter(3, 60000, 600000); // 3 attempts per minute, 10min block

/**
 * Generate a unique identifier for rate limiting
 * Uses a combination of IP simulation and browser fingerprinting
 */
export function getRateLimitIdentifier(): string {
	if (typeof window === 'undefined') return 'server';

	// Simple browser fingerprinting for rate limiting
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.textBaseline = 'top';
		ctx.font = '14px Arial';
		ctx.fillText('BlendSphere fingerprint', 2, 2);
	}

	const fingerprint = [
		navigator.userAgent,
		navigator.language,
		screen.width + 'x' + screen.height,
		new Date().getTimezoneOffset(),
		canvas.toDataURL()
	].join('|');

	// Simple hash function
	let hash = 0;
	for (let i = 0; i < fingerprint.length; i++) {
		const char = fingerprint.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return 'client_' + Math.abs(hash).toString(36);
}

/**
 * Secure storage wrapper for sensitive data
 */
export class SecureStorage {
	private static encrypt(data: string): string {
		// Simple XOR encryption (in production, use proper encryption)
		const key = 'BlendSphere2025';
		let encrypted = '';

		for (let i = 0; i < data.length; i++) {
			encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
		}

		return btoa(encrypted);
	}

	private static decrypt(encryptedData: string): string {
		try {
			const data = atob(encryptedData);
			const key = 'BlendSphere2025';
			let decrypted = '';

			for (let i = 0; i < data.length; i++) {
				decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
			}

			return decrypted;
		} catch {
			return '';
		}
	}

	static setItem(key: string, value: string): void {
		if (typeof window === 'undefined') return;

		try {
			const encrypted = this.encrypt(value);
			localStorage.setItem(`bs_${key}`, encrypted);
		} catch (error) {
			console.warn('Failed to store encrypted data:', error);
		}
	}

	static getItem(key: string): string | null {
		if (typeof window === 'undefined') return null;

		try {
			const encrypted = localStorage.getItem(`bs_${key}`);
			if (!encrypted) return null;

			return this.decrypt(encrypted);
		} catch (error) {
			console.warn('Failed to retrieve encrypted data:', error);
			return null;
		}
	}

	static removeItem(key: string): void {
		if (typeof window === 'undefined') return;

		localStorage.removeItem(`bs_${key}`);
	}
}

/**
 * Content Security Policy helpers
 */
export function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeRedirectUrl(url: string, allowedOrigins: string[] = []): string {
	try {
		const parsed = new URL(url, window.location.origin);

		// Only allow same origin or explicitly allowed origins
		if (parsed.origin === window.location.origin || allowedOrigins.includes(parsed.origin)) {
			return parsed.pathname + parsed.search;
		}

		// Default to dashboard for unsafe URLs
		return '/dashboard';
	} catch {
		// Invalid URL, return safe default
		return '/dashboard';
	}
}

/**
 * Check if running in secure context (HTTPS in production)
 */
export function isSecureContext(): boolean {
	if (typeof window === 'undefined') return true;

	return (
		window.location.protocol === 'https:' ||
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1'
	);
}

/**
 * Log security events (in production, send to monitoring service)
 */
export function logSecurityEvent(event: string, details: Record<string, unknown> = {}): void {
	if (import.meta.env.DEV) {
		console.warn(`[Security Event] ${event}:`, details);
	}

	// In production, send to monitoring service
	// Example: send to Sentry, LogRocket, etc.
}
