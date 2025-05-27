import { pb } from '../pocketbase';
import type { RecordModel } from 'pocketbase';
import { Language, LanguageLevel } from '$lib/components/schemas';
import type { TemplateStyles } from '$lib/schemas/template.schemas';

export interface Template extends RecordModel {
	name: string;
	description?: string;
	version: string;
	author: string;
	nativeLanguage: Language;
	learningLanguage: Language;
	languageLevel: LanguageLevel;
	frontLayout: string; // HTML with placeholders
	backLayout: string; // HTML with placeholders
	styles: TemplateStyles;
	user: string;
	isPublic: boolean;
}

export const templateService = {
	/**
	 * Create a new template
	 */
	create: async (templateData: Omit<Template, 'id' | 'created' | 'updated'>): Promise<Template> => {
		try {
			const template = await pb.collection('templates').create(templateData);
			return template as unknown as Template;
		} catch (error) {
			console.error('Error creating template:', error);
			throw error;
		}
	},

	/**
	 * Get template by ID
	 */
	getById: async (id: string): Promise<Template> => {
		try {
			const template = await pb.collection('templates').getOne(id);
			return template as unknown as Template;
		} catch (error) {
			console.error('Error fetching template:', error);
			throw error;
		}
	},

	/**
	 * Update a template
	 */
	update: async (id: string, templateData: Partial<Template>): Promise<Template> => {
		try {
			const template = await pb.collection('templates').update(id, templateData);
			return template as unknown as Template;
		} catch (error) {
			console.error('Error updating template:', error);
			throw error;
		}
	},

	/**
	 * Delete a template
	 */
	delete: async (id: string): Promise<boolean> => {
		try {
			await pb.collection('templates').delete(id);
			return true;
		} catch (error) {
			console.error('Error deleting template:', error);
			throw error;
		}
	},

	/**
	 * List templates
	 * Can filter by user's own templates or public templates
	 */
	list: async (
		page: number = 1,
		limit: number = 20,
		filter: {
			user?: string;
			isPublic?: boolean;
		} = {}
	): Promise<{ items: Template[]; totalItems: number; totalPages: number }> => {
		try {
			let filterString = '';

			if (filter.user) {
				filterString += `user="${filter.user}"`;
			}

			if (filter.isPublic !== undefined) {
				if (filterString) filterString += ' && ';
				filterString += `isPublic=${filter.isPublic}`;
			}

			const resultList = await pb.collection('templates').getList(page, limit, {
				filter: filterString || undefined,
				sort: '-created'
			});

			return {
				items: resultList.items as unknown as Template[],
				totalItems: resultList.totalItems,
				totalPages: resultList.totalPages
			};
		} catch (error) {
			console.error('Error listing templates:', error);
			throw error;
		}
	},

	/**
	 * Clone a template (create a copy for the current user)
	 */
	clone: async (templateId: string, newName?: string): Promise<Template> => {
		try {
			// First get the template to clone
			const sourceTemplate = await templateService.getById(templateId);

			// Create a new template with the same data but a new owner
			const cloneData = {
				name: newName || `Copy of ${sourceTemplate.name}`,
				description: sourceTemplate.description,
				version: sourceTemplate.version,
				author: sourceTemplate.author,
				nativeLanguage: sourceTemplate.nativeLanguage,
				learningLanguage: sourceTemplate.learningLanguage,
				languageLevel: sourceTemplate.languageLevel,
				frontLayout: sourceTemplate.frontLayout,
				backLayout: sourceTemplate.backLayout,
				styles: sourceTemplate.styles,
				user: pb.authStore.record?.id || '',
				isPublic: false // Default to private for cloned templates
			};

			const newTemplate = await templateService.create(cloneData);

			// TODO: Also clone the associated fields
			// This would require importing and using the field service
			// For now, fields will need to be cloned separately

			return newTemplate;
		} catch (error) {
			console.error('Error cloning template:', error);
			throw error;
		}
	}
};
