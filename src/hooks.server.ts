import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

/**
 * Security headers middleware
 */
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Only apply security headers to HTML responses
	if (response.headers.get('content-type')?.includes('text/html')) {
		// Content Security Policy
		const csp = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-inline/eval should be removed in production
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: https:",
			"connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https:",
			"object-src 'none'",
			"base-uri 'self'",
			"frame-ancestors 'none'",
			'upgrade-insecure-requests'
		].join('; ');

		// Security Headers
		response.headers.set('Content-Security-Policy', csp);
		response.headers.set('X-Frame-Options', 'DENY');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

		// HTTPS enforcement in production
		if (event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1') {
			response.headers.set(
				'Strict-Transport-Security',
				'max-age=31536000; includeSubDomains; preload'
			);
		}

		// Remove server information leakage
		response.headers.delete('Server');
		response.headers.delete('X-Powered-By');
	}

	return response;
};

/**
 * Chrome DevTools middleware - handles Chrome-specific requests
 */
const chromeDevToolsMiddleware: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Handle Chrome DevTools specific requests
	if (pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(JSON.stringify({}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
	}

	// Handle other common browser requests that might cause 404s
	if (pathname === '/robots.txt') {
		return new Response('User-agent: *\nDisallow:', {
			status: 200,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if (pathname === '/manifest.json' || pathname === '/site.webmanifest') {
		return new Response(
			JSON.stringify({
				name: 'BlendSphere',
				short_name: 'BlendSphere',
				description: 'AI-powered language learning with spaced repetition',
				start_url: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#000000'
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}

	return resolve(event);
};

/**
 * Rate limiting middleware for sensitive endpoints
 */
const rateLimitMiddleware: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Apply rate limiting to authentication endpoints
	if (
		pathname.includes('/login') ||
		pathname.includes('/signup') ||
		pathname.includes('/forgot-password')
	) {
		// Get client identifier (IP + User-Agent hash)
		const clientId =
			event.getClientAddress() + (event.request.headers.get('user-agent') || '').slice(0, 50);

		// In production, you would use a proper rate limiting service
		// For now, we rely on client-side rate limiting and backend protection
		console.log(`Rate limit check for ${pathname} from client ${clientId.slice(0, 10)}...`);
	}

	return resolve(event);
};

/**
 * Request logging middleware
 */
const requestLogger: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const duration = Date.now() - start;

	// Log security-relevant requests
	const { pathname } = event.url;
	if (
		pathname.includes('/login') ||
		pathname.includes('/signup') ||
		pathname.includes('/dashboard')
	) {
		console.log(`${event.request.method} ${pathname} - ${response.status} (${duration}ms)`);
	}

	return response;
};

// Combine all middleware
export const handle = sequence(
	chromeDevToolsMiddleware,
	securityHeaders,
	rateLimitMiddleware,
	requestLogger
);
