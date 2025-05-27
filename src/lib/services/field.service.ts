import { pb } from '../pocketbase';
import type { RecordModel } from 'pocketbase';

export interface Field extends RecordModel {
	template: string; // Template ID
	type: 'TEXT' | 'IMAGE' | 'AUDIO';
	isInput: boolean; // true for user input fields, false for AI-generated fields
	language: 'EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PL';
	label: string; // Required - display name for the field
	description?: string; // Optional - used as AI prompt context
	example?: string; // Optional - example value to show users in preview
}

export const fieldService = {
	/**
	 * Create a new field
	 */
	create: async (fieldData: Omit<Field, 'id' | 'created' | 'updated'>): Promise<Field> => {
		try {
			const field = await pb.collection('fields').create(fieldData);
			return field as unknown as Field;
		} catch (error) {
			console.error('Error creating field:', error);
			throw error;
		}
	},

	/**
	 * Get field by ID
	 */
	getById: async (id: string): Promise<Field> => {
		try {
			const field = await pb.collection('fields').getOne(id);
			return field as unknown as Field;
		} catch (error) {
			console.error('Error fetching field:', error);
			throw error;
		}
	},

	/**
	 * Update a field
	 */
	update: async (id: string, fieldData: Partial<Field>): Promise<Field> => {
		try {
			const field = await pb.collection('fields').update(id, fieldData);
			return field as unknown as Field;
		} catch (error) {
			console.error('Error updating field:', error);
			throw error;
		}
	},

	/**
	 * Delete a field
	 */
	delete: async (id: string): Promise<boolean> => {
		try {
			await pb.collection('fields').delete(id);
			return true;
		} catch (error) {
			console.error('Error deleting field:', error);
			throw error;
		}
	},

	/**
	 * List fields by template
	 */
	listByTemplate: async (
		templateId: string,
		page: number = 1,
		limit: number = 50
	): Promise<{ items: Field[]; totalItems: number; totalPages: number }> => {
		try {
			const resultList = await pb.collection('fields').getList(page, limit, {
				filter: `template="${templateId}"`,
				sort: 'created'
			});

			return {
				items: resultList.items as unknown as Field[],
				totalItems: resultList.totalItems,
				totalPages: resultList.totalPages
			};
		} catch (error) {
			console.error('Error listing fields by template:', error);
			throw error;
		}
	}
};
