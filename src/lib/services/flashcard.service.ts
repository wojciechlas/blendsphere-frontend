import { pb } from '../pocketbase';
import type { RecordModel } from 'pocketbase';
import type { FlashcardRow } from '$lib/types/flashcard-creator.js';
import { fieldService, type Field } from './field.service.js';

export interface Flashcard extends RecordModel {
	deck: string;
	template: string;
	data: Record<string, unknown>; // Template field values
	state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
	difficulty?: number;
	stability?: number;
	retrievability?: number;
	lastReview?: string;
	nextReview?: string;
}

export interface FlashcardWithTemplate extends Flashcard {
	expand?: {
		template?: {
			id: string;
			name: string;
			frontLayout: string;
			backLayout: string;
			styles: Record<string, unknown>;
		};
	};
}

export const flashcardService = {
	/**
	 * Convert flashcard data from field IDs to field labels for template rendering
	 */
	convertFieldIdsToLabels: async (
		flashcardData: Record<string, unknown>,
		templateId: string
	): Promise<Record<string, unknown>> => {
		try {
			// Get all fields for this template
			const fieldsResult = await fieldService.listByTemplate(templateId);
			const fields = fieldsResult.items;

			// Create a mapping from field ID to field label
			const fieldIdToLabel: Record<string, string> = {};
			fields.forEach((field: Field) => {
				fieldIdToLabel[field.id] = field.label.toLowerCase().replace(/\s+/g, '_');
			});

			// Convert the flashcard data from field IDs to field labels
			const convertedData: Record<string, unknown> = {};
			Object.entries(flashcardData).forEach(([key, value]) => {
				// Safe object access with validated key
				const label =
					key && Object.prototype.hasOwnProperty.call(fieldIdToLabel, key)
						? fieldIdToLabel[key]
						: null;
				if (label && typeof label === 'string') {
					convertedData[label] = value;
				} else {
					// Keep the original key if no mapping found
					if (key && typeof key === 'string') {
						convertedData[key] = value;
					}
				}
			});

			return convertedData;
		} catch (error) {
			console.error('Error converting field IDs to labels:', error);
			// Return original data if conversion fails
			return flashcardData;
		}
	},

	/**
	 * Create a new flashcard
	 */
	create: async (
		flashcardData: Omit<Flashcard, 'id' | 'created' | 'updated'>
	): Promise<Flashcard> => {
		try {
			const flashcard = await pb.collection('flashcards').create(flashcardData);
			return flashcard as unknown as Flashcard;
		} catch (error) {
			console.error('Error creating flashcard:', error);
			throw error;
		}
	},

	/**
	 * Get flashcard by ID
	 */
	getById: async (id: string): Promise<Flashcard> => {
		try {
			const flashcard = await pb.collection('flashcards').getOne(id);
			return flashcard as unknown as Flashcard;
		} catch (error) {
			console.error('Error fetching flashcard:', error);
			throw error;
		}
	},

	/**
	 * Get flashcard by ID with data converted from field IDs to field labels
	 */
	getByIdWithConvertedData: async (id: string): Promise<Flashcard> => {
		try {
			const flashcard = await pb.collection('flashcards').getOne(id, {
				expand: 'template'
			});
			const flashcardWithTemplate = flashcard as unknown as FlashcardWithTemplate;

			const convertedData = await flashcardService.convertFieldIdsToLabels(
				flashcardWithTemplate.data,
				flashcardWithTemplate.template
			);

			return {
				...flashcardWithTemplate,
				data: convertedData
			};
		} catch (error) {
			console.error('Error fetching flashcard with converted data:', error);
			throw error;
		}
	},

	/**
	 * Update a flashcard
	 */
	update: async (id: string, flashcardData: Partial<Flashcard>): Promise<Flashcard> => {
		try {
			const flashcard = await pb.collection('flashcards').update(id, flashcardData);
			return flashcard as unknown as Flashcard;
		} catch (error) {
			console.error('Error updating flashcard:', error);
			throw error;
		}
	},

	/**
	 * Delete a flashcard
	 */
	delete: async (id: string): Promise<boolean> => {
		try {
			await pb.collection('flashcards').delete(id);
			return true;
		} catch (error) {
			console.error('Error deleting flashcard:', error);
			throw error;
		}
	},

	/**
	 * List flashcards in a deck
	 */
	listByDeck: async (
		deckId: string,
		page: number = 1,
		limit: number = 50
	): Promise<{ items: Flashcard[]; totalItems: number; totalPages: number }> => {
		try {
			const resultList = await pb.collection('flashcards').getList(page, limit, {
				filter: `deck="${deckId}"`,
				sort: 'created'
			});

			return {
				items: resultList.items as unknown as Flashcard[],
				totalItems: resultList.totalItems,
				totalPages: resultList.totalPages
			};
		} catch (error) {
			console.error('Error listing flashcards:', error);
			throw error;
		}
	},

	/**
	 * Create multiple flashcards in batch
	 */
	createBatch: async (
		flashcardsData: Omit<Flashcard, 'id' | 'created' | 'updated'>[]
	): Promise<Flashcard[]> => {
		try {
			const promises = flashcardsData.map((flashcard) =>
				pb.collection('flashcards').create(flashcard)
			);
			const results = await Promise.all(promises);
			return results as unknown as Flashcard[];
		} catch (error) {
			console.error('Error creating flashcards batch:', error);
			throw error;
		}
	},

	/**
	 * Convert FlashcardRows to Flashcard data for creation
	 */
	convertRowsToFlashcards: (
		rows: FlashcardRow[],
		deckId: string,
		templateId: string
	): Omit<Flashcard, 'id' | 'created' | 'updated'>[] => {
		return rows.map((row) => {
			// Convert row cells to template field data
			const data = Object.fromEntries(
				Object.entries(row.cells)
					.filter(([, cell]) => cell && cell.content)
					.map(([fieldId, cell]) => [fieldId, cell.content])
			);

			return {
				deck: deckId,
				template: templateId,
				data,
				state: 'NEW' as const,
				difficulty: 0,
				stability: 0,
				retrievability: 0
			};
		});
	},

	/**
	 * Create flashcards from FlashcardRows
	 */
	createFromRows: async (
		rows: FlashcardRow[],
		deckId: string,
		templateId: string
	): Promise<Flashcard[]> => {
		const flashcardsData = flashcardService.convertRowsToFlashcards(rows, deckId, templateId);
		return flashcardService.createBatch(flashcardsData);
	}
};
