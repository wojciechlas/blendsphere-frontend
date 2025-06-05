import { requireAuth } from '$lib/utils/auth-guards';
import { templateService } from '$lib/services/template.service';
import { deckService } from '$lib/services/deck.service';
import { fieldService, type Field } from '$lib/services/field.service';
import { currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	requireAuth(url);

	const searchParams = url.searchParams;
	const templateId = searchParams.get('templateId');

	try {
		const user = get(currentUser);
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Load templates and decks in parallel
		const [templatesResult, decksResult] = await Promise.all([
			templateService.list(1, 100, { user: user.id }),
			deckService.listByUser(user.id, 1, 100)
		]);

		// Load fields for all templates in parallel to avoid auto-cancellation
		const allFields: Field[] = [];
		if (templatesResult.items.length > 0) {
			const fieldPromises = templatesResult.items.map((template) =>
				fieldService
					.listByTemplate(template.id)
					.then((result) => result.items)
					.catch((error) => {
						console.warn(`Failed to load fields for template ${template.id}:`, error);
						return [];
					})
			);

			const fieldsResults = await Promise.all(fieldPromises);
			fieldsResults.forEach((fields) => allFields.push(...fields));
		}

		// Load selected template if provided
		let selectedTemplate = null;
		if (templateId) {
			try {
				selectedTemplate = await templateService.getById(templateId);
			} catch (error) {
				console.warn('Failed to load selected template:', error);
			}
		}

		return {
			templates: templatesResult.items,
			decks: decksResult.items,
			fields: allFields,
			selectedTemplate,
			title: 'Create Flashcard - BlendSphere'
		};
	} catch (error) {
		console.error('Error loading flashcard creator:', error);

		return {
			templates: [],
			decks: [],
			fields: [],
			selectedTemplate: null,
			title: 'Create Flashcard - BlendSphere'
		};
	}
};
