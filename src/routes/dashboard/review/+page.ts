import type { PageLoad } from './$types';
import { requireAuth } from '$lib/utils/auth-guards';

export const load: PageLoad = async ({ url }) => {
	requireAuth(url);

	// Get deck ID from query parameters
	const deckId = url.searchParams.get('deckId');

	return {
		deckId
	};
};
