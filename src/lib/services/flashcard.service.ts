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
	 * Create multiple flashcards using PocketBase batch API
	 */
	createBatch: async (
		flashcardsData: Omit<Flashcard, 'id' | 'created' | 'updated'>[]
	): Promise<Flashcard[]> => {
		try {
			const maxBatchSize = 50;
			const results: Flashcard[] = [];

			// Process in chunks of maxBatchSize to respect PocketBase limits
			for (let i = 0; i < flashcardsData.length; i += maxBatchSize) {
				const chunk = flashcardsData.slice(i, i + maxBatchSize);

				// Create batch request
				const batch = pb.createBatch();

				// Add all flashcards in this chunk to the batch
				chunk.forEach((flashcardData) => {
					batch.collection('flashcards').create(flashcardData);
				});

				// Send batch request
				const batchResult = await batch.send();

				// Extract created flashcards from batch result
				const batchFlashcards = batchResult.map((result) => result as unknown as Flashcard);
				results.push(...batchFlashcards);

				// Small delay between batches to be respectful to the server
				if (i + maxBatchSize < flashcardsData.length) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

			return results;
		} catch (error) {
			console.error('Error creating flashcards batch:', error);
			throw error;
		}
	},

	/**
	 * Create multiple flashcards in smaller batches with retry logic using PocketBase batch API
	 */
	createBatchWithRetry: async (
		flashcardsData: Omit<Flashcard, 'id' | 'created' | 'updated'>[],
		options: {
			batchSize?: number;
			retryAttempts?: number;
			delayBetweenBatches?: number;
			onProgress?: (completed: number, total: number) => void;
		} = {}
	): Promise<Flashcard[]> => {
		const { batchSize = 20, retryAttempts = 3, delayBetweenBatches = 100, onProgress } = options;

		try {
			const results: Flashcard[] = [];

			// Split into smaller chunks
			for (let i = 0; i < flashcardsData.length; i += batchSize) {
				const chunk = flashcardsData.slice(i, i + batchSize);

				// Try to create this chunk with retry logic
				let attempt = 0;
				let chunkResults: Flashcard[] = [];

				while (attempt < retryAttempts) {
					try {
						// Create batch request for this chunk
						const batch = pb.createBatch();

						// Add all flashcards in this chunk to the batch
						chunk.forEach((flashcardData) => {
							batch.collection('flashcards').create(flashcardData);
						});

						// Send batch request
						const batchResult = await batch.send();

						// Extract created flashcards from batch result
						chunkResults = batchResult.map((result) => result as unknown as Flashcard);

						break; // Success, exit retry loop
					} catch (error) {
						attempt++;
						console.warn(`Batch creation attempt ${attempt} failed:`, error);

						if (attempt < retryAttempts) {
							// Wait longer before retry
							await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches * attempt));
							chunkResults = []; // Reset results for retry
						} else {
							throw error; // Final attempt failed
						}
					}
				}

				results.push(...chunkResults);

				// Report progress if callback provided
				if (onProgress) {
					onProgress(results.length, flashcardsData.length);
				}

				// Delay between batches to avoid rate limiting
				if (i + batchSize < flashcardsData.length) {
					await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
				}
			}

			return results;
		} catch (error) {
			console.error('Error creating flashcards batch with retry:', error);
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
	 * Create flashcards from FlashcardRows with progress tracking
	 */
	createFromRows: async (
		rows: FlashcardRow[],
		deckId: string,
		templateId: string,
		onProgress?: (completed: number, total: number) => void
	): Promise<Flashcard[]> => {
		const flashcardsData = flashcardService.convertRowsToFlashcards(rows, deckId, templateId);

		// Use batch creation with retry for better reliability
		return flashcardService.createBatchWithRetry(flashcardsData, {
			batchSize: 20,
			retryAttempts: 3,
			delayBetweenBatches: 100,
			onProgress
		});
	}
};
