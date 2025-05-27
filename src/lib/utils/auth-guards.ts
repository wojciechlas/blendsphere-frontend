import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { browser } from '$app/environment';

/**
 * Authentication guard for protected routes
 * Redirects to login if user is not authenticated
 */
export function requireAuth(url: URL) {
	// Only run auth checks on the client side to avoid SSR/hydration mismatches
	if (browser && (!pb.authStore.isValid || !pb.authStore.model)) {
		throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}
}

/**
 * Guest guard for authentication pages
 * Redirects to dashboard if user is already authenticated
 */
export function requireGuest() {
	// Only run auth checks on the client side to avoid SSR/hydration mismatches
	if (browser && pb.authStore.isValid && pb.authStore.model) {
		throw redirect(302, '/dashboard');
	}
}
