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
	return 'http://localhost:8000';
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

// Interface for review log returned by the SRS API
export interface ReviewLog {
	id: string;
	flashcard_id: string;
	rating: number;
	review_time: string;
	previous_difficulty: number;
	new_difficulty: number;
	previous_stability: number;
	new_stability: number;
	previous_retrievability: number;
	new_retrievability: number;
	previous_state: string;
	new_state: string;
	next_review_date: string;
}

/**
 * Make direct API call to SRS service
 */
const callSrsApi = async (endpoint: string, data?: unknown): Promise<unknown> => {
	const baseUrl = getSrsApiUrl();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	// Include authentication token if available
	if (pb.authStore.token) {
		headers['Authorization'] = `Bearer ${pb.authStore.token}`;
	}

	const options: RequestInit = {
		method: data ? 'POST' : 'GET',
		headers
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	const response = await fetch(`${baseUrl}${endpoint}`, options);

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('Authentication required. Please log in again.');
		}
		if (response.status === 403) {
			throw new Error('Access forbidden. You do not have permission to perform this action.');
		}
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
	 * Submit flashcard review to SRS API for processing
	 * Uses the new /flashcards/review endpoint that handles both SRS calculation and PocketBase update
	 */
	submitFlashcardReview: async (
		flashcard: Flashcard,
		rating: RecallRating
	): Promise<{ flashcard: Flashcard; review_log: ReviewLog }> => {
		try {
			const requestData = {
				flashcard_id: flashcard.id.toString(), // Convert to string as expected by API
				rating: rating
			};

			const result = await callSrsApi('/flashcards/review', requestData);
			return result as { flashcard: Flashcard; review_log: ReviewLog };
		} catch (error) {
			console.error('Error submitting flashcard review to API:', error);
			throw error;
		}
	},

	/**
	 * @deprecated Use submitFlashcardReview instead
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
	 * Process a flashcard review: uses the new integrated SRS API endpoint
	 * This method now delegates to the new /flashcards/review endpoint which handles both
	 * SRS calculation and PocketBase update in a single operation
	 * Falls back to local calculations + PocketBase update if API is unavailable
	 */
	processFlashcardReview: async (
		flashcard: Flashcard,
		rating: RecallRating
	): Promise<Flashcard> => {
		console.log('processFlashcardReview called with:', { flashcardId: flashcard.id, rating });

		try {
			// Try to use the new integrated endpoint that handles both SRS calculation and database update
			const result = await srsAlgorithmService.submitFlashcardReview(flashcard, rating);

			console.log('SRS API result:', result);
			console.log('Updated flashcard from API:', result.flashcard);
			console.log('Review log from API:', result.review_log);

			// Map field names from SRS API response to match frontend Flashcard interface
			const apiFlashcard = result.flashcard as Record<string, unknown>;

			// Create properly mapped flashcard object
			const updatedFlashcard: Flashcard = {
				...flashcard, // Keep original flashcard structure and fields
				// Override with API response data, mapping field names correctly
				// IMPORTANT: Keep the original string ID, don't use the numeric card_id from API
				id: flashcard.id, // Always use original flashcard ID (string format)
				nextReview: (apiFlashcard.due as string) || (apiFlashcard.nextReview as string), // API uses "due", frontend uses "nextReview"
				lastReview: (apiFlashcard.last_review as string) || (apiFlashcard.lastReview as string), // API uses "last_review", frontend uses "lastReview"
				difficulty: (apiFlashcard.difficulty as number) || flashcard.difficulty,
				stability: (apiFlashcard.stability as number) || flashcard.stability,
				state:
					(apiFlashcard.state as 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING') || flashcard.state,
				step: (apiFlashcard.step as number) || flashcard.step
			};

			console.log('🔧 Fixed field mapping:');
			console.log('  - nextReview:', updatedFlashcard.nextReview);
			console.log('  - lastReview:', updatedFlashcard.lastReview);
			console.log('  - difficulty:', updatedFlashcard.difficulty);
			console.log('  - stability:', updatedFlashcard.stability);

			// Return the updated flashcard with correct field mapping
			return updatedFlashcard;
		} catch (apiError) {
			console.warn('⚠️ SRS API unavailable, falling back to local calculations:', apiError);
			// Fallback: Use local SRS calculations and update PocketBase directly
			return await srsAlgorithmService.processFlashcardReviewFallback(flashcard, rating);
		}
	},

	/**
	 * Fallback method for processing flashcard reviews when SRS API is unavailable
	 * Uses local SRS calculations and updates PocketBase directly
	 */
	processFlashcardReviewFallback: async (
		flashcard: Flashcard,
		rating: RecallRating
	): Promise<Flashcard> => {
		try {
			console.log('🔄 Using fallback SRS calculations for flashcard:', flashcard.id);

			// Use local SRS calculation
			const srsData = await srsAlgorithmService.calculateNextReviewLocal(flashcard, rating);

			// Create updated flashcard with new SRS data
			const updatedFlashcard: Flashcard = {
				...flashcard,
				nextReview: srsData.nextReviewDate,
				lastReview: new Date().toISOString(),
				difficulty: srsData.difficulty,
				stability: srsData.stability,
				state: srsData.state,
				step: srsData.step || flashcard.step
			};

			// Update flashcard in PocketBase
			await flashcardService.update(flashcard.id, {
				nextReview: updatedFlashcard.nextReview,
				lastReview: updatedFlashcard.lastReview,
				difficulty: updatedFlashcard.difficulty,
				stability: updatedFlashcard.stability,
				state: updatedFlashcard.state,
				step: updatedFlashcard.step
			});

			console.log('✅ Fallback review processing completed successfully');
			return updatedFlashcard;
		} catch (error) {
			console.error('❌ Fallback review processing failed:', error);
			throw error;
		}
	},

	/**
	 * Local SRS calculation implementation (simplified FSRS algorithm)
	 * Used as fallback when SRS API is unavailable
	 */
	calculateNextReviewLocal: async (
		flashcard: Flashcard,
		rating: RecallRating
	): Promise<{
		nextReviewDate: string;
		difficulty: number;
		stability: number;
		state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
		step?: number;
	}> => {
		const now = new Date();
		const currentDifficulty = flashcard.difficulty || 0;
		const currentStability = flashcard.stability || 1;
		let newDifficulty = currentDifficulty;
		let newStability = currentStability;
		let newState: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' =
			(flashcard.state as 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING') || 'NEW';
		let step = flashcard.step || 0;

		// Simplified FSRS-like algorithm
		switch (rating) {
			case 1: // AGAIN
				newDifficulty = Math.min(10, currentDifficulty + 0.8);
				newStability = Math.max(0.1, currentStability * 0.8);
				newState = 'RELEARNING';
				step = 0;
				break;
			case 2: // HARD
				newDifficulty = Math.min(10, currentDifficulty + 0.15);
				newStability = currentStability * 1.2;
				newState = flashcard.state === 'NEW' ? 'LEARNING' : 'REVIEW';
				break;
			case 3: // GOOD
				newDifficulty = Math.max(0, currentDifficulty - 0.1);
				newStability = currentStability * 1.3;
				newState = flashcard.state === 'NEW' ? 'LEARNING' : 'REVIEW';
				break;
			case 4: // EASY
				newDifficulty = Math.max(0, currentDifficulty - 0.2);
				newStability = currentStability * 1.6;
				newState = 'REVIEW';
				break;
		}

		// Calculate next review date based on stability
		const intervalDays = Math.max(1, Math.round(newStability));
		const nextReview = new Date(now);
		nextReview.setDate(nextReview.getDate() + intervalDays);

		return {
			nextReviewDate: nextReview.toISOString(),
			difficulty: newDifficulty,
			stability: newStability,
			state: newState,
			step
		};
	},

	/**
	 * Get due cards for a user - fetches directly from PocketBase
	 * Includes NEW cards and cards that are due for review
	 */
	getDueCards: async (userId: string, deckId?: string, limit?: number): Promise<Flashcard[]> => {
		try {
			console.log('📋 DEBUG - Fetching due cards for user:', userId, 'deck:', deckId);
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

			console.log('📋 DEBUG - Filter expression:', fullFilter);

			const resultList = await pb.collection('flashcards').getList(1, limit || 50, {
				filter: fullFilter,
				sort: 'created', // Sort by creation date for NEW cards
				expand: 'deck,template'
				// Remove requestKey to avoid stale cache data that might contain deleted flashcard IDs
				// requestKey: `due-cards-${userId}-${deckId || 'all'}-${limit || 50}`
			});

			console.log(`📋 DEBUG - Found ${resultList.items.length} cards matching filter`);

			// Convert field IDs to labels for each flashcard
			const flashcards = resultList.items as unknown as Flashcard[];
			const convertedFlashcards: Flashcard[] = [];

			for (const flashcard of flashcards) {
				console.log(`📋 DEBUG - Processing flashcard: ${flashcard.id}`);
				try {
					const convertedData = await flashcardService.convertFieldIdsToLabels(
						flashcard.data,
						flashcard.template
					);

					convertedFlashcards.push({
						...flashcard,
						data: convertedData
					});
					console.log(`📋 DEBUG - Successfully processed flashcard: ${flashcard.id}`);
				} catch (error) {
					console.error(
						`❌ DEBUG - Error converting field IDs to labels for flashcard ${flashcard.id}:`,
						error
					);
					// Keep original flashcard if conversion fails
					convertedFlashcards.push(flashcard);
				}
			}

			console.log(`📋 DEBUG - Returning ${convertedFlashcards.length} converted flashcards`);
			console.log(
				'📋 DEBUG - Flashcard IDs:',
				convertedFlashcards.map((f) => f.id)
			);
			return convertedFlashcards;
		} catch (error) {
			console.error('❌ DEBUG - Error fetching due cards from PocketBase:', error);
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
				fields: 'id' // Only fetch the ID to minimize data transfer
				// Remove requestKey to avoid stale cache data
				// requestKey: `due-count-${userId}-${deckId || 'all'}`
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
				expand: 'deck,template'
				// Remove requestKey to avoid stale cache data
				// requestKey: `cards-by-state-${userId}-${state}-${deckId || 'all'}`
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
					expand: 'deck,template'
					// Remove requestKey to avoid stale cache data
					// requestKey: `fallback-${state}-${userId}-${deckId || 'all'}`
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
				expand: 'deck,template'
				// Remove requestKey to avoid stale cache data
				// requestKey: `upcoming-due-${userId}-${days}-${deckId || 'all'}`
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
						expand: 'deck,template'
						// Remove requestKey to avoid stale cache data
						// requestKey: `fallback-upcoming-${userId}-${days}`
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
	 * Uses the existing getUpcomingDueCards method to calculate forecast data
	 */
	getReviewForecast: async (
		userId: string,
		days: number = 7
	): Promise<{ [date: string]: number }> => {
		try {
			// Use getUpcomingDueCards to get cards due in the specified period
			const upcomingCards = await srsAlgorithmService.getUpcomingDueCards(userId, days);

			// Group cards by date
			const forecast: { [date: string]: number } = {};

			upcomingCards.forEach((card) => {
				if (card.nextReview) {
					const reviewDate = new Date(card.nextReview);
					const dateStr = reviewDate.toISOString().split('T')[0];
					forecast[dateStr] = (forecast[dateStr] || 0) + 1;
				}
			});

			return forecast;
		} catch (error) {
			console.error('Error generating review forecast:', error);
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
