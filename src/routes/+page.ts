import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Check if user is authenticated and redirect to dashboard if logged in
    // Only run on client side to avoid SSR/hydration issues
    if (browser && pb.authStore.isValid && pb.authStore.model) {
        throw redirect(302, '/dashboard');
    }

    // Show home page for guests
    return {
        title: 'BlendSphere - AI-Powered Language Learning'
    };
};
