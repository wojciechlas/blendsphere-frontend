import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';

/**
 * Authentication guard for protected routes
 * Redirects to login if user is not authenticated
 */
export function requireAuth(url: URL) {
    if (!pb.authStore.isValid) {
        throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
    }
}

/**
 * Guest guard for authentication pages
 * Redirects to dashboard if user is already authenticated
 */
export function requireGuest() {
    if (pb.authStore.isValid) {
        throw redirect(302, '/dashboard');
    }
}
