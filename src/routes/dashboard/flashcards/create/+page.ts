import { requireAuth } from '$lib/utils/auth-guards';
import { templateService } from '$lib/services/template.service';
import { deckService } from '$lib/services/deck.service';
import { fieldService, type Field } from '$lib/services/field.service';
import { flashcardService } from '$lib/services/flashcard.service';
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
			// Try to load both user's templates and public templates
			Promise.all([
				templateService
					.list(1, 50, { user: user.id })
					.catch(() => ({ items: [], totalItems: 0, totalPages: 0 })),
				templateService
					.list(1, 50, { isPublic: true })
					.catch(() => ({ items: [], totalItems: 0, totalPages: 0 }))
			]).then(([userTemplates, publicTemplates]) => {
				// Combine and deduplicate templates
				const allTemplates = [...userTemplates.items, ...publicTemplates.items];
				const uniqueTemplates = allTemplates.filter(
					(template, index, arr) => arr.findIndex((t) => t.id === template.id) === index
				);
				return {
					items: uniqueTemplates,
					totalItems: uniqueTemplates.length,
					totalPages: Math.ceil(uniqueTemplates.length / 50)
				};
			}),
			deckService
				.listByUser(user.id, 1, 100)
				.catch(() => ({ items: [], totalItems: 0, totalPages: 0 }))
		]);

		// Load fields for all templates and associate them with templates
		const allFields: Field[] = [];
		if (templatesResult.items.length > 0) {
			const fieldPromises = templatesResult.items.map((template) =>
				fieldService
					.listByTemplate(template.id)
					.then((result) => {
						// Associate fields with the template
						template.fields = result.items;
						return result.items;
					})
					.catch((error) => {
						console.warn(`Failed to load fields for template ${template.id}:`, error);
						// Set empty fields array for this template
						template.fields = [];
						return [];
					})
			);

			const fieldsResults = await Promise.all(fieldPromises);
			fieldsResults.forEach((fields) => allFields.push(...fields));
		}

		// Load card counts for all decks
		if (decksResult.items.length > 0) {
			const cardCountPromises = decksResult.items.map((deck) =>
				flashcardService
					.listByDeck(deck.id, 1, 1) // Only need count, so fetch minimal data
					.then((result) => {
						deck.cardCount = result.totalItems;
						return result.totalItems;
					})
					.catch((error) => {
						console.warn(`Failed to load cards count for deck ${deck.id}:`, error);
						deck.cardCount = 0;
						return 0;
					})
			);

			await Promise.all(cardCountPromises);
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

		// Try to load at least public templates if user templates fail
		try {
			const publicTemplatesResult = await templateService.list(1, 50, { isPublic: true });
			return {
				templates: publicTemplatesResult.items,
				decks: [],
				fields: [],
				selectedTemplate: null,
				title: 'Create Flashcard - BlendSphere'
			};
		} catch (fallbackError) {
			console.error('Failed to load even public templates:', fallbackError);
			return {
				templates: [],
				decks: [],
				fields: [],
				selectedTemplate: null,
				title: 'Create Flashcard - BlendSphere'
			};
		}
	}
};
