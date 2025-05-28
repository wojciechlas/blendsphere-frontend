/**
 * Security test suite for BlendSphere frontend
 * Tests input validation, sanitization, rate limiting, and other security measures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	sanitizeInput,
	validateEmail,
	validateUrl,
	escapeForSQL,
	sanitizeForNoSQL,
	generateSecureNonce,
	AdvancedRateLimiter,
	SecurityLogger,
	getEnhancedFingerprint,
	SecureLocalStorage
} from './security-enhanced';

// Mock localStorage for testing
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		length: 0,
		key: vi.fn()
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Mock navigator and screen for fingerprinting tests
Object.defineProperty(global, 'navigator', {
	value: {
		userAgent: 'test-agent',
		language: 'en-US',
		platform: 'test-platform',
		cookieEnabled: true
	},
	writable: true
});

Object.defineProperty(global, 'screen', {
	value: {
		width: 1920,
		height: 1080
	},
	writable: true
});

describe('Input Sanitization', () => {
	it('should remove HTML tags by default', () => {
		const input = '<script>alert("xss")</script>Hello World';
		const result = sanitizeInput(input);
		expect(result).toBe('Hello World');
	});

	it('should handle malicious script injections', () => {
		const maliciousInputs = [
			'<script>alert("xss")</script>',
			 
			'javascript:alert("xss")',
			'<img src="x" onerror="alert(1)">',
			'<svg onload="alert(1)"></svg>',
			'"><script>alert(1)</script>'
		];

		maliciousInputs.forEach((input) => {
			const result = sanitizeInput(input);
			expect(result).not.toMatch(/<script|javascript:|onerror|onload/i);
		});
	});

	it('should handle strict mode properly', () => {
		const input = 'Hello<>&"\'World! @user #hashtag';
		const result = sanitizeInput(input, { strict: true });
		expect(result).toBe('HelloWorld! @user hashtag');
	});

	it('should limit input length in strict mode', () => {
		const longInput = 'a'.repeat(2000);
		const result = sanitizeInput(longInput, { strict: true });
		expect(result.length).toBeLessThanOrEqual(1000);
	});
});

describe('Email Validation', () => {
	it('should validate correct email addresses', () => {
		const validEmails = ['user@example.com', 'test.email@domain.co.uk', 'user+tag@example.org'];

		validEmails.forEach((email) => {
			expect(validateEmail(email)).toBe(true);
		});
	});

	it('should reject invalid email addresses', () => {
		const invalidEmails = [
			'invalid-email',
			'@domain.com',
			'user@',
			'user@domain',
			'user space@domain.com',
			'a'.repeat(300) + '@domain.com', // Too long
			'user@192.168.1.1' // IP addresses not allowed
		];

		invalidEmails.forEach((email) => {
			expect(validateEmail(email)).toBe(false);
		});
	});
});

describe('URL Validation', () => {
	it('should validate safe URLs', () => {
		const validUrls = [
			'https://example.com',
			'http://localhost:3000',
			'https://subdomain.example.org/path?param=value'
		];

		validUrls.forEach((url) => {
			expect(validateUrl(url)).toBe(true);
		});
	});

	it('should reject dangerous URLs', () => {
		const dangerousUrls = [
			 
			'javascript:alert(1)',
			 
			'data:text/html,<script>alert(1)</script>',
			'file:///etc/passwd',
			'ftp://example.com',
			'invalid-url'
		];

		dangerousUrls.forEach((url) => {
			expect(validateUrl(url)).toBe(false);
		});
	});

	it('should validate domain whitelist', () => {
		const allowedDomains = ['example.com', 'trusted.org'];

		expect(validateUrl('https://example.com/path', allowedDomains)).toBe(true);
		expect(validateUrl('https://sub.example.com/path', allowedDomains)).toBe(true);
		expect(validateUrl('https://malicious.com/path', allowedDomains)).toBe(false);
	});
});

describe('SQL Injection Prevention', () => {
	it('should escape SQL injection attempts', () => {
		const maliciousInputs = [
			"'; DROP TABLE users; --",
			"admin'; UPDATE users SET role='admin' WHERE id=1; --",
			"' OR '1'='1",
			"' UNION SELECT * FROM passwords --"
		];

		maliciousInputs.forEach((input) => {
			const escaped = escapeForSQL(input);
			expect(escaped).not.toContain("';");
			expect(escaped).not.toContain('--');
		});
	});
});

describe('NoSQL Injection Prevention', () => {
	it('should sanitize NoSQL injection attempts', () => {
		const maliciousQuery = {
			username: 'admin',
			password: { $ne: null },
			__proto__: { isAdmin: true },
			constructor: { prototype: { isAdmin: true } }
		};

		const sanitized = sanitizeForNoSQL(maliciousQuery);

		expect(sanitized).not.toHaveProperty('__proto__');
		expect(sanitized).not.toHaveProperty('constructor');
		expect(sanitized).not.toHaveProperty('prototype');
		expect(typeof sanitized.password).toBe('string');
	});

	it('should handle nested objects and arrays', () => {
		const complexQuery = {
			users: [
				{ name: 'user1', data: { $ne: null } },
				{ name: 'user2', __proto__: { admin: true } }
			]
		};

		const sanitized = sanitizeForNoSQL(complexQuery);
		expect(Array.isArray(sanitized.users)).toBe(true);
		expect(sanitized.users).toHaveLength(2);
		expect(sanitized.users[1]).not.toHaveProperty('__proto__');
	});
});

describe('Secure Nonce Generation', () => {
	it('should generate unique nonces', () => {
		const nonce1 = generateSecureNonce();
		const nonce2 = generateSecureNonce();

		expect(nonce1).not.toBe(nonce2);
		expect(nonce1.length).toBeGreaterThan(0);
		expect(nonce2.length).toBeGreaterThan(0);
	});

	it('should generate URL-safe nonces', () => {
		const nonce = generateSecureNonce();
		expect(nonce).toMatch(/^[A-Za-z0-9]*$/);
	});
});

describe('Advanced Rate Limiter', () => {
	let rateLimiter: AdvancedRateLimiter;

	beforeEach(() => {
		vi.useFakeTimers();
		rateLimiter = new AdvancedRateLimiter(3, 60000, 1000, 10000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should allow requests within limit', () => {
		const identifier = 'test-user';

		expect(rateLimiter.canAttempt(identifier).allowed).toBe(true);
		expect(rateLimiter.canAttempt(identifier).allowed).toBe(true);
		expect(rateLimiter.canAttempt(identifier).allowed).toBe(true);
	});

	it('should block requests after limit exceeded', () => {
		const identifier = 'test-user';

		// Use up all attempts
		rateLimiter.canAttempt(identifier);
		rateLimiter.canAttempt(identifier);
		rateLimiter.canAttempt(identifier);

		// Next attempt should be blocked
		const result = rateLimiter.canAttempt(identifier);
		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBeGreaterThan(0);
	});

	it('should implement exponential backoff', () => {
		const identifier = 'test-user';

		// Exceed limit multiple times
		for (let i = 0; i < 5; i++) {
			rateLimiter.canAttempt(identifier);
		}

		const firstBlock = rateLimiter.canAttempt(identifier);
		expect(firstBlock.allowed).toBe(false);

		// Wait and try again to trigger higher backoff
		vi.advanceTimersByTime(2000);
		const secondBlock = rateLimiter.canAttempt(identifier);
		expect(secondBlock.retryAfter).toBeGreaterThan(firstBlock.retryAfter || 0);
	});

	it('should reset after window expires', () => {
		const identifier = 'test-user';

		// Exceed limit
		for (let i = 0; i < 4; i++) {
			rateLimiter.canAttempt(identifier);
		}

		// Fast-forward past window
		vi.advanceTimersByTime(70000);

		// Should be allowed again
		expect(rateLimiter.canAttempt(identifier).allowed).toBe(true);
	});
});

describe('Security Logger', () => {
	let logger: SecurityLogger;

	beforeEach(() => {
		logger = new SecurityLogger();
		vi.clearAllMocks();
	});

	it('should log security events', () => {
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		logger.log({
			type: 'test_event',
			severity: 'medium',
			details: { test: 'data' }
		});

		const events = logger.getRecentEvents();
		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('test_event');
		expect(events[0].severity).toBe('medium');

		consoleSpy.mockRestore();
	});

	it('should filter events by type and severity', () => {
		logger.log({ type: 'login_attempt', severity: 'low', details: {} });
		logger.log({ type: 'login_attempt', severity: 'high', details: {} });
		logger.log({ type: 'xss_attempt', severity: 'high', details: {} });

		expect(logger.getEventsByType('login_attempt')).toHaveLength(2);
		expect(logger.getEventsBySeverity('high')).toHaveLength(2);
		expect(logger.getEventsBySeverity('low')).toHaveLength(1);
	});

	it('should limit stored events', () => {
		// Add more than max events
		for (let i = 0; i < 1200; i++) {
			logger.log({
				type: 'test_event',
				severity: 'low',
				details: { counter: i }
			});
		}

		const events = logger.getRecentEvents(1200);
		expect(events.length).toBeLessThanOrEqual(1000);
	});
});

describe('Enhanced Fingerprinting', () => {
	it('should generate consistent fingerprints', () => {
		// Mock navigator and screen objects
		Object.defineProperty(global, 'navigator', {
			value: {
				userAgent: 'test-agent',
				language: 'en-US',
				platform: 'test-platform',
				cookieEnabled: true
			},
			writable: true
		});

		Object.defineProperty(global, 'screen', {
			value: {
				width: 1920,
				height: 1080
			},
			writable: true
		});

		const fingerprint1 = getEnhancedFingerprint();
		const fingerprint2 = getEnhancedFingerprint();

		expect(fingerprint1).toBe(fingerprint2);
		expect(fingerprint1.length).toBeGreaterThan(0);
	});
});

describe('Secure Local Storage', () => {
	let secureStorage: SecureLocalStorage;

	beforeEach(() => {
		vi.useFakeTimers();
		secureStorage = new SecureLocalStorage('test-key');
		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should encrypt and decrypt data', () => {
		const testData = { username: 'testuser', role: 'admin' };

		secureStorage.setItem('test', testData);
		const retrieved = secureStorage.getItem('test');

		expect(retrieved).toEqual(testData);
	});

	it('should handle expiration', () => {
		const testData = { test: 'data' };

		// Set with 1ms expiration
		secureStorage.setItem('test', testData, 1);

		// Wait for expiration
		vi.advanceTimersByTime(10);

		const retrieved = secureStorage.getItem('test');
		expect(retrieved).toBeNull();
	});

	it('should handle corrupted data gracefully', () => {
		// Manually set corrupted data
		localStorage.setItem('test', 'corrupted-data');

		const retrieved = secureStorage.getItem('test');
		expect(retrieved).toBeNull();

		// Should also clean up corrupted data (removeItem called)
		expect(localStorage.removeItem).toHaveBeenCalledWith('test');
	});

	it('should return null for non-existent items', () => {
		const retrieved = secureStorage.getItem('non-existent');
		expect(retrieved).toBeNull();
	});
});
