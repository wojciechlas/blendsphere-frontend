// Types for Deck Browser feature
import type { RecordModel } from 'pocketbase';

export interface Deck extends RecordModel {
	name: string;
	description?: string;
	user: string;
	isPublic: boolean;
	status: 'active' | 'archived';
}

export interface DeckStats {
	totalCards: number;
	dueCards: number;
	newCards: number;
	learningCards: number;
	reviewCards: number;
	masteredCards: number;
	completionPercentage: number;
	lastStudied?: string;
}

export interface DeckWithStats extends Deck {
	stats: DeckStats;
}

export interface Flashcard extends RecordModel {
	deck: string;
	template: string;
	data: Record<string, unknown>;
	state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' | 'MASTERED';
	difficulty?: number;
	stability?: number;
	retrievability?: number;
	lastReview?: string;
	nextReview?: string;
}

export interface FlashcardWithSRS extends Flashcard {
	isDue: boolean;
	daysUntilReview?: number;
	reviewCount: number;
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

export interface DeckFilters {
	status: 'all' | 'active' | 'archived';
	hasNewCards: boolean;
	hasReviewCards: boolean;
	sortBy: 'name' | 'created' | 'updated' | 'lastStudied';
	sortOrder: 'asc' | 'desc';
}

export interface FlashcardFilters {
	state: 'all' | 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' | 'MASTERED';
	isDue: boolean | null;
	sortBy: 'created' | 'nextReview' | 'difficulty' | 'lastReview';
	sortOrder: 'asc' | 'desc';
}

export interface DeckBrowserState {
	// Layout state
	currentView: 'decks' | 'flashcards' | 'preview';
	isMobile: boolean;

	// Selection state
	selectedDeckId: string | null;
	selectedFlashcardId: string | null;

	// Data state
	decks: DeckWithStats[];
	flashcards: FlashcardWithSRS[];

	// UI state
	deckListScrollPosition: number;
	flashcardListScrollPosition: number;
	previewScrollPosition: number;

	// Loading states
	isLoadingDecks: boolean;
	isLoadingFlashcards: boolean;
	isLoadingPreview: boolean;

	// Search and filters
	searchQuery: string;
	deckFilters: DeckFilters;
	flashcardFilters: FlashcardFilters;

	// Error states
	deckError: string | null;
	flashcardError: string | null;
}
