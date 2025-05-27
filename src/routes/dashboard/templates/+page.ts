import { requireAuth } from '$lib/utils/auth-guards';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	requireAuth(url);

	return {
		title: 'Templates - BlendSphere'
	};
};
