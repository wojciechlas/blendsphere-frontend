import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';

export const load: PageLoad = async () => {
    // Check if user is authenticated
    if (!pb.authStore.isValid || !pb.authStore.model) {
        throw redirect(302, '/login');
    }

    return {
        user: pb.authStore.model
    };
};
