import { requireGuest } from '$lib/utils/auth-guards';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
    requireGuest();

    return {
        title: 'Login - BlendSphere'
    };
};
