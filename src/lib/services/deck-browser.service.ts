// Enhanced deck service for Deck Browser
import { pb } from '../pocketbase';
import type {
	Deck,
	DeckWithStats,
	DeckStats,
	DeckFilters,
	FlashcardWithSRS,
	FlashcardFilters,
	Flashcard
} from '../types/deck-browser';

export class DeckBrowserService {
	/**
	 * Get user's decks with statistics
	 */
	async getUserDecksWithStats(userId: string): Promise<DeckWithStats[]> {
		try {
			const decks = await pb.collection('decks').getFullList({
				filter: `user="${userId}"`,
				sort: '-updated',
				expand: 'flashcards_via_deck'
			});

			const decksWithStats: DeckWithStats[] = [];

			for (const deck of decks) {
				const stats = await this.calculateDeckStats(deck.id);
				decksWithStats.push({
					...(deck as unknown as Deck),
					stats
				});
			}

			return decksWithStats;
		} catch (error) {
			console.error('Error fetching user decks with stats:', error);
			throw error;
		}
	}

	/**
	 * Calculate statistics for a deck
	 */
	async calculateDeckStats(deckId: string): Promise<DeckStats> {
		try {
			const flashcards = await pb.collection('flashcards').getFullList({
				filter: `deck="${deckId}"`
			});

			const now = new Date();
			const stats: DeckStats = {
				totalCards: flashcards.length,
				dueCards: 0,
				newCards: 0,
				learningCards: 0,
				reviewCards: 0,
				masteredCards: 0,
				completionPercentage: 0
			};

			let lastStudiedDate: Date | null = null;

			flashcards.forEach((cardRecord) => {
				const card = cardRecord as unknown as Flashcard;
				// Count by state
				switch (card.state) {
					case 'NEW':
						stats.newCards++;
						break;
					case 'LEARNING':
						stats.learningCards++;
						break;
					case 'REVIEW':
						stats.reviewCards++;
						break;
					case 'MASTERED':
						stats.masteredCards++;
						break;
				}

				// Check if card is due
				if (card.nextReview && new Date(card.nextReview) <= now) {
					stats.dueCards++;
				}

				// Track last studied date
				if (card.lastReview) {
					const reviewDate = new Date(card.lastReview);
					if (!lastStudiedDate || reviewDate > lastStudiedDate) {
						lastStudiedDate = reviewDate;
					}
				}
			});

			// Calculate completion percentage
			if (stats.totalCards > 0) {
				stats.completionPercentage = Math.round(
					((stats.masteredCards + stats.reviewCards) / stats.totalCards) * 100
				);
			}

			// Set last studied date
			if (lastStudiedDate) {
				stats.lastStudied = (lastStudiedDate as Date).toISOString();
			}

			return stats;
		} catch (error) {
			console.error('Error calculating deck stats:', error);
			return {
				totalCards: 0,
				dueCards: 0,
				newCards: 0,
				learningCards: 0,
				reviewCards: 0,
				masteredCards: 0,
				completionPercentage: 0
			};
		}
	}

	/**
	 * Search decks by name or description
	 */
	async searchDecks(query: string, userId: string): Promise<DeckWithStats[]> {
		try {
			const searchFilter = `user="${userId}" && (name~"${query}" || description~"${query}")`;
			const decks = await pb.collection('decks').getFullList({
				filter: searchFilter,
				sort: '-updated'
			});

			const decksWithStats: DeckWithStats[] = [];

			for (const deck of decks) {
				const stats = await this.calculateDeckStats(deck.id);
				decksWithStats.push({
					...(deck as unknown as Deck),
					stats
				});
			}

			return decksWithStats;
		} catch (error) {
			console.error('Error searching decks:', error);
			throw error;
		}
	}

	/**
	 * Get flashcards for a deck with SRS information
	 */
	async getFlashcardsWithSRS(deckId: string): Promise<FlashcardWithSRS[]> {
		try {
			const flashcards = await pb.collection('flashcards').getFullList({
				filter: `deck="${deckId}"`,
				sort: '-created',
				expand: 'template'
			});

			const now = new Date();

			return flashcards.map((cardRecord) => {
				const card = cardRecord as unknown as Flashcard;
				const isDue = card.nextReview ? new Date(card.nextReview) <= now : card.state === 'NEW';

				let daysUntilReview: number | undefined;
				if (card.nextReview && !isDue) {
					const nextReview = new Date(card.nextReview);
					const diffTime = nextReview.getTime() - now.getTime();
					daysUntilReview = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				}

				// Get review count from review history (simplified)
				const reviewCount = card.lastReview ? 1 : 0; // This could be enhanced with actual review history

				return {
					...card,
					isDue,
					daysUntilReview,
					reviewCount
				} as FlashcardWithSRS;
			});
		} catch (error) {
			console.error('Error fetching flashcards with SRS:', error);
			throw error;
		}
	}

	/**
	 * Get flashcards for a specific deck
	 */
	async getFlashcards(deckId: string): Promise<FlashcardWithSRS[]> {
		return this.getFlashcardsWithSRS(deckId);
	}

	/**
	 * Filter decks based on criteria
	 */
	filterDecks(
		decks: DeckWithStats[],
		filters: DeckFilters,
		searchQuery: string = ''
	): DeckWithStats[] {
		let filtered = [...decks];

		// Text search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(deck) =>
					deck.name.toLowerCase().includes(query) ||
					(deck.description && deck.description.toLowerCase().includes(query))
			);
		}

		// Status filter
		if (filters.status !== 'all') {
			filtered = filtered.filter((deck) => deck.status === filters.status);
		}

		// New cards filter
		if (filters.hasNewCards) {
			filtered = filtered.filter((deck) => deck.stats.newCards > 0);
		}

		// Review cards filter
		if (filters.hasReviewCards) {
			filtered = filtered.filter((deck) => deck.stats.dueCards > 0);
		}

		// Sorting
		filtered.sort((a, b) => {
			let aValue: string | number | Date;
			let bValue: string | number | Date;

			switch (filters.sortBy) {
				case 'name':
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case 'created':
					aValue = new Date(a.created);
					bValue = new Date(b.created);
					break;
				case 'updated':
					aValue = new Date(a.updated);
					bValue = new Date(b.updated);
					break;
				case 'lastStudied':
					aValue = a.stats.lastStudied ? new Date(a.stats.lastStudied) : new Date(0);
					bValue = b.stats.lastStudied ? new Date(b.stats.lastStudied) : new Date(0);
					break;
				default:
					return 0;
			}

			if (filters.sortOrder === 'asc') {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return filtered;
	}

	/**
	 * Filter flashcards based on criteria
	 */
	filterFlashcards(
		flashcards: FlashcardWithSRS[],
		filters: Partial<FlashcardFilters>
	): FlashcardWithSRS[] {
		let filtered = [...flashcards];

		// State filter
		if (filters.state && filters.state !== 'all') {
			filtered = filtered.filter((card) => card.state === filters.state);
		}

		// Due filter
		if (filters.isDue === true) {
			filtered = filtered.filter((card) => card.isDue);
		} else if (filters.isDue === false) {
			filtered = filtered.filter((card) => !card.isDue);
		}

		// Sorting
		filtered.sort((a, b) => {
			let aValue: string | number | Date;
			let bValue: string | number | Date;

			switch (filters.sortBy) {
				case 'created':
					aValue = new Date(a.created);
					bValue = new Date(b.created);
					break;
				case 'nextReview':
					aValue = a.nextReview ? new Date(a.nextReview) : new Date(0);
					bValue = b.nextReview ? new Date(b.nextReview) : new Date(0);
					break;
				case 'difficulty':
					aValue = a.difficulty || 0;
					bValue = b.difficulty || 0;
					break;
				case 'lastReview':
					aValue = a.lastReview ? new Date(a.lastReview) : new Date(0);
					bValue = b.lastReview ? new Date(b.lastReview) : new Date(0);
					break;
				default:
					return 0;
			}

			if (filters.sortOrder === 'asc') {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return filtered;
	}

	/**
	 * Get current user's decks with statistics
	 */
	async getDecks(): Promise<DeckWithStats[]> {
		// Get current user - this assumes user is already authenticated
		const user = pb.authStore.model;
		if (!user?.id) {
			throw new Error('User not authenticated');
		}

		return this.getUserDecksWithStats(user.id);
	}
}

export const deckBrowserService = new DeckBrowserService();
