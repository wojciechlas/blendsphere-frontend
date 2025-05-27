import { pb } from '../pocketbase';
import type { RecordModel } from 'pocketbase';

export interface Deck extends RecordModel {
	name: string;
	description?: string;
	user: string;
	isPublic: boolean;
}

export const deckService = {
	/**
	 * Create a new deck
	 */
	create: async (deckData: Omit<Deck, 'id' | 'created' | 'updated'>): Promise<Deck> => {
		try {
			const deck = await pb.collection('decks').create(deckData);
			return deck as unknown as Deck;
		} catch (error) {
			console.error('Error creating deck:', error);
			throw error;
		}
	},

	/**
	 * Get deck by ID
	 */
	getById: async (id: string): Promise<Deck> => {
		try {
			const deck = await pb.collection('decks').getOne(id);
			return deck as unknown as Deck;
		} catch (error) {
			console.error('Error fetching deck:', error);
			throw error;
		}
	},

	/**
	 * Update a deck
	 */
	update: async (id: string, deckData: Partial<Deck>): Promise<Deck> => {
		try {
			const deck = await pb.collection('decks').update(id, deckData);
			return deck as unknown as Deck;
		} catch (error) {
			console.error('Error updating deck:', error);
			throw error;
		}
	},

	/**
	 * Delete a deck
	 */
	delete: async (id: string): Promise<boolean> => {
		try {
			await pb.collection('decks').delete(id);
			return true;
		} catch (error) {
			console.error('Error deleting deck:', error);
			throw error;
		}
	},

	/**
	 * List decks by user
	 */
	listByUser: async (
		userId: string,
		page: number = 1,
		limit: number = 20
	): Promise<{ items: Deck[]; totalItems: number; totalPages: number }> => {
		try {
			const resultList = await pb.collection('decks').getList(page, limit, {
				filter: `user="${userId}"`,
				sort: '-created'
			});

			return {
				items: resultList.items as unknown as Deck[],
				totalItems: resultList.totalItems,
				totalPages: resultList.totalPages
			};
		} catch (error) {
			console.error('Error listing decks by user:', error);
			throw error;
		}
	},

	/**
	 * List public decks
	 */
	listPublic: async (
		page: number = 1,
		limit: number = 20
	): Promise<{ items: Deck[]; totalItems: number; totalPages: number }> => {
		try {
			const resultList = await pb.collection('decks').getList(page, limit, {
				filter: 'isPublic=true',
				sort: '-created'
			});

			return {
				items: resultList.items as unknown as Deck[],
				totalItems: resultList.totalItems,
				totalPages: resultList.totalPages
			};
		} catch (error) {
			console.error('Error listing public decks:', error);
			throw error;
		}
	}
};
