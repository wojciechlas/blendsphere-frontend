/**
 * Spaced Repetition System (SRS) Algorithm Service
 *
 * This service implements the SRS algorithm for scheduling flashcard reviews
 * based on user performance ratings.
 *
 * It fetches flashcards directly from PocketBase and delegates SRS calculations
 * to the backend API endpoint for computing next review dates and parameters.
 */

import type { Flashcard } from './flashcard.service.js';
import { flashcardService } from './flashcard.service.js';
import { pb } from '$lib/pocketbase.js';
import { browser } from '$app/environment';

// Get SRS API URL from environment, fallback to localhost
const getSrsApiUrl = (): string => {
	if (browser && import.meta.env.VITE_SRS_API_URL) {
		return import.meta.env.VITE_SRS_API_URL;
	}
	return 'http://localhost:8001';
};

// Enum for recall rating levels
export enum RecallRating {
	AGAIN = 1, // Complete failure to recall
	HARD = 2, // Significant difficulty recalling
	GOOD = 3, // Correct recall with effort
	EASY = 4 // Perfect recall with little/no hesitation
}

// Interface for review data
export interface ReviewData {
	flashcardId: string;
	rating: RecallRating;
	timeSpent: number; // milliseconds
}

// Interface for study session data
export interface StudySessionData {
	newDifficulty: number;
	newInterval: number;
	newStability: number;
	newRetrievability: number;
	nextReview: string; // ISO date string
}

/**
 * Make direct API call to SRS service
 */
const callSrsApi = async (endpoint: string, data?: unknown): Promise<unknown> => {
	const baseUrl = getSrsApiUrl();
	const options: RequestInit = {
		method: data ? 'POST' : 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	const response = await fetch(`${baseUrl}${endpoint}`, options);

	if (!response.ok) {
		throw new Error(`SRS API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
};

/**
 * SRS Algorithm Service
 * Now primarily delegates to the backend API, but maintains fallback capability
 */
export const srsAlgorithmService = {
	/**
	 * Calculate next review date and updated stats based on user rating
	 * Makes direct API call to SRS service
	 */
	calculateNextReview: async (
		flashcard: Flashcard,
		rating: RecallRating
	): Promise<StudySessionData> => {
		try {
			const requestData = {
				flashcard_id: flashcard.id,
				difficulty: flashcard.difficulty || 0,
				stability: flashcard.stability || 0,
				retrievability: flashcard.retrievability || 0,
				last_review: flashcard.lastReview,
				rating: rating,
				state: flashcard.state
			};

			const result = await callSrsApi('/srs/calculate', requestData);
			return result as StudySessionData;
		} catch (error) {
			console.error('Error calculating next review via API:', error);
			throw error;
		}
	},

	/**
	 * Process a flashcard review: calculate SRS parameters and update the card
	 * This combines the calculation and database update in one operation
	 */
	processFlashcardReview: async (
		flashcard: Flashcard,
		rating: RecallRating
	): Promise<Flashcard> => {
		try {
			// Get SRS calculations from the API
			const srsData = await srsAlgorithmService.calculateNextReview(flashcard, rating);

			// Prepare the update data
			const updateData: Partial<Flashcard> = {
				state: srsAlgorithmService.getNewState(flashcard, rating),
				difficulty: srsData.newDifficulty,
				stability: srsData.newStability,
				retrievability: srsData.newRetrievability,
				lastReview: new Date().toISOString(),
				nextReview: srsData.nextReview
			};

			// Update the flashcard in PocketBase
			const updatedFlashcard = await pb.collection('flashcards').update(flashcard.id, updateData);

			console.log(`Updated flashcard ${flashcard.id} after review with rating ${rating}`);

			return updatedFlashcard as unknown as Flashcard;
		} catch (error) {
			console.error('Error processing flashcard review:', error);
			throw error;
		}
	} /**
	 * Get due cards for a user - fetches directly from PocketBase
	 * Includes NEW cards and cards that are due for review
	 */,
	getDueCards: async (userId: string, deckId?: string, limit?: number): Promise<Flashcard[]> => {
		try {
			console.log('Fetching due cards for user:', userId, 'deck:', deckId);
			const now = new Date().toISOString();

			// Use same filter approach as getDueCards for consistency
			let ownerFilter = '';
			let fullFilter = '';

			if (deckId) {
				ownerFilter = `deck="${deckId}"`;
			} else {
				// Directly filter by deck owner instead of client-side filtering
				ownerFilter = `deck.user="${userId}"`;
			}

			// Include both NEW cards and cards due for review
			fullFilter = `${ownerFilter} && ((nextReview <= "${now}") || (nextReview = NULL))`;

			console.log('Filter expression:', fullFilter);

			const resultList = await pb.collection('flashcards').getList(1, limit || 50, {
				filter: fullFilter,
				sort: 'created', // Sort by creation date for NEW cards
				expand: 'deck,template',
				requestKey: `due-cards-${userId}-${deckId || 'all'}-${limit || 50}`
			});

			console.log(`Found ${resultList.items.length} cards matching filter`);

			// Convert field IDs to labels for each flashcard
			const flashcards = resultList.items as unknown as Flashcard[];
			const convertedFlashcards: Flashcard[] = [];

			for (const flashcard of flashcards) {
				try {
					const convertedData = await flashcardService.convertFieldIdsToLabels(
						flashcard.data,
						flashcard.template
					);

					convertedFlashcards.push({
						...flashcard,
						data: convertedData
					});
				} catch (error) {
					console.error(
						`Error converting field IDs to labels for flashcard ${flashcard.id}:`,
						error
					);
					// Keep original flashcard if conversion fails
					convertedFlashcards.push(flashcard);
				}
			}

			return convertedFlashcards;
		} catch (error) {
			console.error('Error fetching due cards from PocketBase:', error);
			return []; // Return empty array on error
		}
	},
	/**
	 * Get the count of due cards for a user
	 * Useful for displaying card counts without fetching all cards
	 */
	getDueCardsCount: async (userId: string, deckId?: string): Promise<number> => {
		try {
			const now = new Date().toISOString();

			// Use same filter approach as getDueCards for consistency
			let ownerFilter = '';
			let fullFilter = '';

			if (deckId) {
				ownerFilter = `deck="${deckId}"`;
			} else {
				// Directly filter by deck owner instead of client-side filtering
				ownerFilter = `deck.user="${userId}"`;
			}

			// Include both NEW cards and cards due for review
			fullFilter = `${ownerFilter} && ((nextReview <= "${now}") || (nextReview = NULL))`;

			// Only fetch count data (more efficient)
			const result = await pb.collection('flashcards').getList(1, 1, {
				filter: fullFilter,
				fields: 'id', // Only fetch the ID to minimize data transfer
				requestKey: `due-count-${userId}-${deckId || 'all'}`
			});

			return result.totalItems;
		} catch (error) {
			console.error('Error fetching due cards count from PocketBase:', error);
			return 0;
		}
	} /**
	 * Get cards by state for a user (NEW, LEARNING, REVIEW, RELEARNING)
	 * Useful for displaying learning statistics
	 */,
	getCardsByState: async (
		userId: string,
		state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING',
		deckId?: string
	): Promise<Flashcard[]> => {
		try {
			// Build filter with more efficient server-side filtering
			let filter = `state="${state}"`;

			if (deckId) {
				filter += ` && deck="${deckId}"`;
			} else {
				// Filter by user ownership directly in the query
				filter += ` && deck.user="${userId}"`;
			}

			const resultList = await pb.collection('flashcards').getList(1, 500, {
				filter,
				expand: 'deck,template',
				requestKey: `cards-by-state-${userId}-${state}-${deckId || 'all'}`
			});

			return resultList.items as unknown as Flashcard[];
		} catch (error) {
			console.error(`Error fetching ${state} cards from PocketBase:`, error);

			// Fallback to simpler filter if the relational filter fails
			try {
				let fallbackFilter = `state="${state}"`;

				if (deckId) {
					fallbackFilter += ` && deck="${deckId}"`;
				}

				const fallbackResult = await pb.collection('flashcards').getList(1, 500, {
					filter: fallbackFilter,
					expand: 'deck,template',
					requestKey: `fallback-${state}-${userId}-${deckId || 'all'}`
				});

				// If no specific deck, filter by user ownership client-side
				let finalCards = fallbackResult.items as unknown as Flashcard[];

				if (!deckId) {
					finalCards = finalCards.filter((card) => {
						return card.expand?.deck?.owner === userId;
					});
				}

				return finalCards;
			} catch (fallbackError) {
				console.error(`Fallback for ${state} cards also failed:`, fallbackError);
				return [];
			}
		}
	},

	/**
	 * Get next cards that will be due for review
	 * Useful for showing upcoming review schedule
	 */
	getUpcomingDueCards: async (
		userId: string,
		days: number = 7,
		deckId?: string
	): Promise<Flashcard[]> => {
		try {
			const now = new Date();
			const futureDate = new Date(now);
			futureDate.setDate(futureDate.getDate() + days);

			let filter = `nextReview > "${now.toISOString()}" && nextReview <= "${futureDate.toISOString()}"`;

			if (deckId) {
				filter += ` && deck="${deckId}"`;
			} else {
				// Filter by deck ownership directly in the query instead of using deck.user relation
				filter += ` && deck.user="${userId}"`;
			}

			const resultList = await pb.collection('flashcards').getList(1, 500, {
				filter,
				sort: 'nextReview',
				expand: 'deck,template',
				requestKey: `upcoming-due-${userId}-${days}-${deckId || 'all'}`
			});

			return resultList.items as unknown as Flashcard[];
		} catch (error) {
			console.error('Error fetching upcoming due cards from PocketBase:', error);

			// Fallback to simpler approach if relation filtering fails
			if (!deckId) {
				try {
					const now = new Date();
					const futureDate = new Date(now);
					futureDate.setDate(futureDate.getDate() + days);

					// Simplify the filter to avoid relation queries
					const fallbackFilter = `nextReview > "${now.toISOString()}" && nextReview <= "${futureDate.toISOString()}"`;

					const fallbackResult = await pb.collection('flashcards').getList(1, 500, {
						filter: fallbackFilter,
						sort: 'nextReview',
						expand: 'deck,template',
						requestKey: `fallback-upcoming-${userId}-${days}`
					});

					// Filter by user ownership on the client side
					const filteredCards = fallbackResult.items.filter((item) => {
						const card = item as unknown as Flashcard;
						return card.expand?.deck?.owner === userId;
					});

					return filteredCards as unknown as Flashcard[];
				} catch (fallbackError) {
					console.error('Fallback for upcoming cards also failed:', fallbackError);
					return [];
				}
			}

			return [];
		}
	},

	/**
	 * Get forecast for upcoming reviews
	 * Makes direct API call to SRS service
	 */
	getReviewForecast: async (
		userId: string,
		days: number = 7
	): Promise<{ [date: string]: number }> => {
		try {
			const result = await callSrsApi(`/srs/forecast?user_id=${userId}&days=${days}`);
			return result as { [date: string]: number };
		} catch (error) {
			console.error('Error fetching review forecast from API:', error);
			return {};
		}
	},

	/**
	 * Calculate overdue penalty for cards that are reviewed late
	 */
	calculateOverduePenalty: (card: Flashcard): number => {
		if (!card.nextReview) return 1.0;

		const nextReviewDate = new Date(card.nextReview);
		const now = new Date();

		// If not overdue, no penalty
		if (nextReviewDate > now) return 1.0;

		// Calculate days overdue
		const daysOverdue = Math.floor(
			(now.getTime() - nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Apply a logarithmic penalty that increases with time overdue
		return Math.max(1.0 - Math.log(daysOverdue + 1) / 10, 0.5);
	},

	/**
	 * Get the new state for a flashcard based on rating and current state
	 */
	getNewState: (
		card: Flashcard,
		rating: RecallRating
	): 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' => {
		if (card.state === 'NEW') {
			return rating < RecallRating.GOOD ? 'LEARNING' : 'REVIEW';
		}

		if (card.state === 'LEARNING' || card.state === 'RELEARNING') {
			return rating < RecallRating.GOOD ? card.state : 'REVIEW';
		}

		if (card.state === 'REVIEW') {
			return rating === RecallRating.AGAIN ? 'RELEARNING' : 'REVIEW';
		}

		return card.state;
	},

	/**
	 * Get the description for a rating level
	 */
	getRatingDescription: (rating: RecallRating): string => {
		switch (rating) {
			case RecallRating.AGAIN:
				return 'Again - Complete failure to recall';
			case RecallRating.HARD:
				return 'Hard - Recalled with significant difficulty';
			case RecallRating.GOOD:
				return 'Good - Recalled correctly with some effort';
			case RecallRating.EASY:
				return 'Easy - Perfect recall with no hesitation';
			default:
				return 'Unknown rating';
		}
	},

	/**
	 * Get the color for a rating level (for UI highlighting)
	 */
	getRatingColor: (rating: RecallRating): string => {
		switch (rating) {
			case RecallRating.AGAIN:
				return 'destructive';
			case RecallRating.HARD:
				return 'warning';
			case RecallRating.GOOD:
				return 'default';
			case RecallRating.EASY:
				return 'success';
			default:
				return 'default';
		}
	}
};
