import { pb } from '../pocketbase';
import type { RecordModel } from 'pocketbase';
import type { FlashcardRow } from '$lib/types/flashcard-creator.js';

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

export const flashcardService = {
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
	 * Get flashcards due for review
	 */
	getDueFlashcards: async (deckId: string, limit: number = 20): Promise<Flashcard[]> => {
		try {
			const now = new Date().toISOString();
			const resultList = await pb.collection('flashcards').getList(1, limit, {
				filter: `deck="${deckId}" && (nextReview <= "${now}" || nextReview = null)`,
				sort: 'nextReview'
			});

			return resultList.items as unknown as Flashcard[];
		} catch (error) {
			console.error('Error getting due flashcards:', error);
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
