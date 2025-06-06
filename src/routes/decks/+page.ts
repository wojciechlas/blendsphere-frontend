import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// This could be used to preload data if needed
	// For now, we'll handle loading in the component itself
	return {
		// Could include user preferences, initial filters, etc.
	};
};
