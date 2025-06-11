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

// Request queue for serializing requests
interface QueuedRequest<T> {
	id: string;
	execute: () => Promise<T>;
	resolve: (value: T) => void;
	reject: (error: unknown) => void;
}

class RequestQueue {
	private queue: QueuedRequest<unknown>[] = [];
	private processing = false;
	private readonly delayBetweenRequests = 100; // ms delay between requests

	async add<T>(id: string, execute: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const queuedRequest: QueuedRequest<T> = { id, execute, resolve, reject };
			this.queue.push(queuedRequest as QueuedRequest<unknown>);
			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.processing || this.queue.length === 0) {
			return;
		}

		this.processing = true;

		while (this.queue.length > 0) {
			const request = this.queue.shift()!;

			try {
				const result = await this.executeWithRetry(request.execute, 3);
				request.resolve(result);
			} catch (error) {
				request.reject(error);
			}

			// Add delay between requests to prevent auto-cancellation
			if (this.queue.length > 0) {
				await new Promise((resolve) => setTimeout(resolve, this.delayBetweenRequests));
			}
		}

		this.processing = false;
	}

	private async executeWithRetry<T>(execute: () => Promise<T>, maxRetries: number): Promise<T> {
		let lastError: unknown;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				return await execute();
			} catch (error: unknown) {
				lastError = error;

				// Check if it's an auto-cancellation error
				const isAutoCancelled =
					error &&
					((error as Error).message?.includes('autocancelled') ||
						(error as Error).message?.includes('auto-cancelled') ||
						(error as { status?: number }).status === 0);

				if (isAutoCancelled && attempt < maxRetries) {
					const delay = Math.min(1000, 100 * Math.pow(2, attempt - 1)); // Exponential backoff
					console.warn(
						`Request auto-cancelled (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
					continue;
				}

				// If it's not auto-cancellation or we've exhausted retries, throw the error
				throw error;
			}
		}

		throw lastError;
	}
}

export const fieldService = {
	// Request deduplication cache
	_pendingRequests: new Map<
		string,
		Promise<{ items: Field[]; totalItems: number; totalPages: number }>
	>(),
	// Request queue for serializing requests
	_requestQueue: new RequestQueue(),

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
	 * List fields by template with request deduplication and queuing
	 */
	listByTemplate: async (
		templateId: string,
		page: number = 1,
		limit: number = 50
	): Promise<{ items: Field[]; totalItems: number; totalPages: number }> => {
		const cacheKey = `${templateId}-${page}-${limit}`;

		// Check if there's already a pending request for this template
		if (fieldService._pendingRequests.has(cacheKey)) {
			const existingRequest = fieldService._pendingRequests.get(cacheKey);
			if (existingRequest) {
				return existingRequest;
			}
		}

		// Create the request promise using the queue
		const requestPromise = fieldService._requestQueue.add(
			`listByTemplate-${cacheKey}`,
			async () => {
				const resultList = await pb.collection('fields').getList(page, limit, {
					filter: `template="${templateId}"`,
					sort: 'created'
				});

				return {
					items: resultList.items as unknown as Field[],
					totalItems: resultList.totalItems,
					totalPages: resultList.totalPages
				};
			}
		);

		// Store the pending request
		fieldService._pendingRequests.set(cacheKey, requestPromise);

		// Clean up the pending request when done
		requestPromise.finally(() => {
			fieldService._pendingRequests.delete(cacheKey);
		});

		return requestPromise;
	}
};
