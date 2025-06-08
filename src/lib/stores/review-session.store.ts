import { get, writable } from 'svelte/store';
import type { Flashcard } from '$lib/services/flashcard.service.js';
import { srsAlgorithmService, RecallRating } from '$lib/services/srs-algorithm.service.js';
import { currentUser } from '$lib/pocketbase.js';

export interface ReviewSession {
	id: string;
	userId: string;
	deckId: string | null;
	startTime: Date;
	endTime: Date | null;
	isComplete: boolean;
	totalCards: number;
	completedCards: number;
	totalCorrect: number;
	totalIncorrect: number;
	averageTimePerCard: number;
	reviewHistory: ReviewHistoryItem[];
}

export interface ReviewHistoryItem {
	flashcardId: string;
	rating: RecallRating;
	timeSpent: number; // milliseconds
	previousInterval: number;
	newInterval: number;
	timestamp: Date;
}

export interface ReviewSessionState {
	session: ReviewSession | null;
	isLoading: boolean;
	error: string | null;
	cards: Flashcard[];
	currentCardIndex: number;
	isFlipped: boolean;
	startTime: Date | null;
	currentCardStartTime: Date | null;
	reviewHistory: ReviewHistoryItem[];
	dailyLimit: number;
	cardsLeft: number;
}

// Initial state
const initialState: ReviewSessionState = {
	session: null,
	isLoading: false,
	error: null,
	cards: [],
	currentCardIndex: 0,
	isFlipped: false,
	startTime: null,
	currentCardStartTime: null,
	reviewHistory: [],
	dailyLimit: 50, // Default value, should be loaded from user settings
	cardsLeft: 0
};

// Create the writable store
const reviewSessionStore = writable<ReviewSessionState>(initialState);

// Create and export actions to manipulate the store
export const reviewSessionActions = {
	/**
	 * Initialize a new review session
	 */
	async initializeSession(deckId: string | null = null) {
		reviewSessionStore.update((state) => ({
			...state,
			isLoading: true,
			error: null
		}));

		try {
			// Get due cards (either for specific deck or all decks)
			const userId = get(currentUser)?.id;

			if (!userId) {
				reviewSessionStore.update((state) => ({
					...state,
					isLoading: false,
					error: 'User not authenticated'
				}));
				return false;
			}

			// Use the updated SRS algorithm service to get due cards directly from PocketBase
			// This ensures NEW cards are properly included and uses consistent data source
			console.log('Using SRS algorithm service for due cards retrieval from PocketBase');

			const dueCards = await srsAlgorithmService.getDueCards(userId, deckId || undefined);

			// Filter out any potentially invalid cards (safety check)
			const validCards = dueCards.filter((card) => {
				if (!card || !card.id) {
					console.warn('🚨 DEBUG - Found invalid card without ID:', card);
					return false;
				}
				return true;
			});

			console.log(
				`📋 DEBUG - Retrieved ${dueCards.length} cards, ${validCards.length} valid after filtering`
			);

			// Check if we have cards to review
			if (validCards.length === 0) {
				reviewSessionStore.update((state) => ({
					...state,
					isLoading: false,
					error: 'No cards due for review'
				}));
				return false;
			}

			// Create a new session
			const session: ReviewSession = {
				id: crypto.randomUUID(),
				userId: userId,
				deckId,
				startTime: new Date(),
				endTime: null,
				isComplete: false,
				totalCards: validCards.length,
				completedCards: 0,
				totalCorrect: 0,
				totalIncorrect: 0,
				averageTimePerCard: 0,
				reviewHistory: []
			};

			// Update the store
			reviewSessionStore.update((state) => ({
				...state,
				session,
				cards: validCards,
				currentCardIndex: 0,
				isFlipped: false,
				startTime: new Date(),
				currentCardStartTime: new Date(),
				isLoading: false,
				cardsLeft: validCards.length
			}));

			return true;
		} catch (error) {
			reviewSessionStore.update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Unknown error initializing session'
			}));
			return false;
		}
	},

	/**
	 * Flip the current card
	 */
	flipCard() {
		reviewSessionStore.update((state) => ({
			...state,
			isFlipped: !state.isFlipped
		}));
	},
	/**
	 * Rate the current card and move to the next
	 * Flow:
	 * 1. User rates flashcard
	 * 2. Rating is sent to SRS service
	 * 3. SRS service sends back updated flashcard
	 * 4. If the updated next review date is today or none, the flashcard goes to the end of review list
	 * 5. Else the reviewed flashcard is removed from review list
	 * 6. User keeps reviewing cards until the review list is empty
	 */
	async rateCard(rating: RecallRating): Promise<boolean> {
		const state = get(reviewSessionStore);

		// Validate session and card index
		if (!state.session || state.currentCardIndex >= state.cards.length) {
			return false;
		}

		const currentCard = state.cards[state.currentCardIndex];
		const timeSpent = state.currentCardStartTime
			? new Date().getTime() - state.currentCardStartTime.getTime()
			: 0;

		try {
			// Step 1 & 2: Send rating to SRS service
			console.log('🔄 DEBUG - About to process review for flashcard:', currentCard.id);
			const updatedCard = await srsAlgorithmService.processFlashcardReview(currentCard, rating);

			if (!updatedCard) {
				throw new Error('No updated card returned from SRS service');
			}

			console.log('✅ DEBUG - Successfully processed review for flashcard:', updatedCard.id);

			// Step 3: Process the updated flashcard
			const isCorrect = rating >= 3; // GOOD or EASY ratings are considered correct

			// Create review history item
			const historyItem: ReviewHistoryItem = {
				flashcardId: currentCard.id,
				rating,
				timeSpent,
				previousInterval: currentCard.stability || 0,
				newInterval: updatedCard.stability || 0,
				timestamp: new Date()
			};

			// Step 4: Determine if card should stay in session
			const shouldKeepInSession = this._shouldKeepCardInSession(updatedCard);

			// Debug logging
			console.log('🔍 DEBUG - Card Processing:');
			console.log('Original card next review:', currentCard.nextReview);
			console.log('Updated card next review:', updatedCard.nextReview);
			console.log('Rating:', rating);
			console.log('Should keep in session:', shouldKeepInSession);
			console.log('Cards before processing:', state.cards.length);

			// Update store with the new review state
			reviewSessionStore.update((state) => {
				const { newCards, newCardIndex, updatedSession } = this._processCardReview(
					state,
					updatedCard,
					historyItem,
					isCorrect,
					shouldKeepInSession
				);

				// Debug logging after processing
				console.log('Cards after processing:', newCards.length);
				console.log('New card index:', newCardIndex);

				// Step 5: Check if session is complete (no more cards left)
				const isComplete = newCards.length === 0;

				// Create final session object with correct isComplete status
				const finalSession = updatedSession
					? {
							...updatedSession,
							isComplete,
							endTime: isComplete ? new Date() : updatedSession.endTime
						}
					: null;

				console.log('Session complete:', isComplete);
				console.log('Final session isComplete:', finalSession?.isComplete);

				return {
					...state,
					session: finalSession,
					reviewHistory: [...state.reviewHistory, historyItem],
					cards: newCards,
					currentCardIndex: newCardIndex,
					isFlipped: false,
					currentCardStartTime: isComplete ? null : new Date(),
					cardsLeft: newCards.length
				};
			});

			return true;
		} catch (error) {
			reviewSessionStore.update((state) => ({
				...state,
				error: error instanceof Error ? error.message : 'Error updating card'
			}));
			return false;
		}
	},

	/**
	 * Helper method to determine if a card should remain in the review session
	 * Cards stay in session if their next review date is today or earlier (or null)
	 */
	_shouldKeepCardInSession(updatedCard: Flashcard): boolean {
		const now = new Date();
		const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
		const nextReviewDate = updatedCard.nextReview ? new Date(updatedCard.nextReview) : null;

		// Keep cards in session if:
		// 1. The next review date is today or earlier
		// 2. There's no next review date set (safety check)
		return !nextReviewDate || nextReviewDate <= todayEnd;
	},

	/**
	 * Helper method to process card review and update the cards array
	 */
	_processCardReview(
		state: ReviewSessionState,
		updatedCard: Flashcard,
		historyItem: ReviewHistoryItem,
		isCorrect: boolean,
		shouldKeepInSession: boolean
	): {
		newCards: Flashcard[];
		newCardIndex: number;
		updatedSession: ReviewSession | null;
	} {
		// Calculate session statistics
		const totalTimeSpent =
			state.reviewHistory.reduce((sum, item) => sum + item.timeSpent, 0) + historyItem.timeSpent;

		// Only increment completedCards when a card is actually removed from the session
		// Cards that stay in session (need more review) should not count as "completed"
		const completedCards = state.session
			? state.session.completedCards + (shouldKeepInSession ? 0 : 1)
			: shouldKeepInSession
				? 0
				: 1;

		const averageTimePerCard = completedCards > 0 ? totalTimeSpent / completedCards : 0;

		// Update session
		const updatedSession = state.session
			? {
					...state.session,
					completedCards,
					totalCorrect: state.session.totalCorrect + (isCorrect ? 1 : 0),
					totalIncorrect: state.session.totalIncorrect + (isCorrect ? 0 : 1),
					averageTimePerCard,
					reviewHistory: [...state.session.reviewHistory, historyItem]
				}
			: null;

		let newCards: Flashcard[];
		let newCardIndex: number;

		if (shouldKeepInSession) {
			// Card stays in session - move it to the end of the review queue
			const cardToMove = updatedCard;
			newCards = [
				...state.cards.slice(0, state.currentCardIndex),
				...state.cards.slice(state.currentCardIndex + 1),
				cardToMove
			];

			// Current index stays the same to show the next card
			// If we were at the end, wrap to the beginning
			newCardIndex = state.currentCardIndex;
			if (newCardIndex >= newCards.length) {
				newCardIndex = 0;
			}
		} else {
			// Card is removed from session - not due again today
			newCards = [
				...state.cards.slice(0, state.currentCardIndex),
				...state.cards.slice(state.currentCardIndex + 1)
			];

			// Current index stays the same to show the next card
			// If we were at the end, wrap to the beginning
			newCardIndex = state.currentCardIndex;
			if (newCardIndex >= newCards.length && newCards.length > 0) {
				newCardIndex = 0;
			}
		}

		return { newCards, newCardIndex, updatedSession };
	},

	/**
	 * Reset the session state
	 */
	resetSession() {
		reviewSessionStore.set(initialState);
	},

	/**
	 * Get summary statistics for the completed session
	 */
	getSessionSummary() {
		const state = get(reviewSessionStore);
		if (!state.session) return null;

		// Calculate rating distribution
		const ratingDistribution = [0, 0, 0, 0];
		state.reviewHistory.forEach((item) => {
			ratingDistribution[item.rating - 1]++;
		});

		// Calculate percentage distribution
		const ratingPercentages = ratingDistribution.map((count) =>
			state.reviewHistory.length > 0 ? (count / state.reviewHistory.length) * 100 : 0
		);

		// Calculate upcoming review forecast
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const threeDays = new Date();
		threeDays.setDate(threeDays.getDate() + 3);

		const sevenDays = new Date();
		sevenDays.setDate(sevenDays.getDate() + 7);

		// Count cards by next review date
		const dueTomorrow = state.cards.filter((card) => {
			const nextReview = card.nextReview ? new Date(card.nextReview) : null;
			return nextReview && nextReview <= tomorrow;
		}).length;

		const dueThreeDays = state.cards.filter((card) => {
			const nextReview = card.nextReview ? new Date(card.nextReview) : null;
			return nextReview && nextReview > tomorrow && nextReview <= threeDays;
		}).length;

		const dueLater = state.cards.filter((card) => {
			const nextReview = card.nextReview ? new Date(card.nextReview) : null;
			return nextReview && nextReview > threeDays;
		}).length;

		return {
			cardsReviewed: state.session.completedCards,
			totalTime: state.session.endTime
				? (state.session.endTime.getTime() - state.session.startTime.getTime()) / 1000
				: 0,
			averageTimePerCard: state.session.averageTimePerCard / 1000, // Convert to seconds
			correctPercentage:
				state.session.completedCards > 0
					? (state.session.totalCorrect / state.session.completedCards) * 100
					: 0,
			ratingDistribution,
			ratingPercentages,
			forecast: {
				dueTomorrow,
				dueThreeDays,
				dueLater
			}
		};
	},

	/**
	 * Get summary statistics for the completed session asynchronously
	 * This version uses the SRS API to get more accurate forecast data
	 */
	async getSessionSummaryAsync() {
		const state = get(reviewSessionStore);
		if (!state.session) return null;

		// Calculate rating distribution
		const ratingDistribution = [0, 0, 0, 0];
		state.reviewHistory.forEach((item) => {
			ratingDistribution[item.rating - 1]++;
		});

		// Calculate percentage distribution
		const ratingPercentages = ratingDistribution.map((count) =>
			state.reviewHistory.length > 0 ? (count / state.reviewHistory.length) * 100 : 0
		);

		// Get forecast from the SRS API
		const userId = get(currentUser)?.id;

		if (!userId) {
			// Fallback to local estimation if no user
			return this.getSessionSummary();
		}

		let forecast;

		try {
			const forecastData = await srsAlgorithmService.getReviewForecast(userId, 7);

			// Process the forecast data into the format expected by the UI
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowStr = tomorrow.toISOString().split('T')[0];

			// Calculate forecast buckets with safe object access
			let dueTomorrow = 0;
			if (forecastData && typeof forecastData === 'object' && tomorrowStr in forecastData) {
				const value = forecastData[tomorrowStr as keyof typeof forecastData];
				dueTomorrow = typeof value === 'number' ? value : 0;
			}

			// Sum up cards due in the next three days
			let dueThreeDays = 0;
			for (let i = 1; i <= 3; i++) {
				const date = new Date();
				date.setDate(date.getDate() + i);
				const dateStr = date.toISOString().split('T')[0];
				if (forecastData && typeof forecastData === 'object' && dateStr in forecastData) {
					const value = forecastData[dateStr as keyof typeof forecastData];
					dueThreeDays += typeof value === 'number' ? value : 0;
				}
			}

			// Sum up cards due later
			let dueLater = 0;
			for (let i = 4; i <= 7; i++) {
				const date = new Date();
				date.setDate(date.getDate() + i);
				const dateStr = date.toISOString().split('T')[0];
				if (forecastData && typeof forecastData === 'object' && dateStr in forecastData) {
					const value = forecastData[dateStr as keyof typeof forecastData];
					dueLater += typeof value === 'number' ? value : 0;
				}
			}

			forecast = {
				dueTomorrow,
				dueThreeDays,
				dueLater
			};
		} catch (error) {
			console.error('Error fetching review forecast from SRS API, using local estimation:', error);

			// Fallback to local estimation if SRS API fails
			// Calculate upcoming review forecast
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const threeDays = new Date();
			threeDays.setDate(threeDays.getDate() + 3);

			// Count cards by next review date
			const dueTomorrow = state.cards.filter((card) => {
				const nextReview = card.nextReview ? new Date(card.nextReview) : null;
				return nextReview && nextReview <= tomorrow;
			}).length;

			const dueThreeDays = state.cards.filter((card) => {
				const nextReview = card.nextReview ? new Date(card.nextReview) : null;
				return nextReview && nextReview > tomorrow && nextReview <= threeDays;
			}).length;

			const dueLater = state.cards.filter((card) => {
				const nextReview = card.nextReview ? new Date(card.nextReview) : null;
				return nextReview && nextReview > threeDays;
			}).length;

			forecast = {
				dueTomorrow,
				dueThreeDays,
				dueLater
			};
		}

		return {
			cardsReviewed: state.session.completedCards,
			totalTime: state.session.endTime
				? (state.session.endTime.getTime() - state.session.startTime.getTime()) / 1000
				: 0,
			averageTimePerCard: state.session.averageTimePerCard / 1000, // Convert to seconds
			correctPercentage:
				state.session.completedCards > 0
					? (state.session.totalCorrect / state.session.completedCards) * 100
					: 0,
			ratingDistribution,
			ratingPercentages,
			forecast
		};
	}
};

export { reviewSessionStore };
