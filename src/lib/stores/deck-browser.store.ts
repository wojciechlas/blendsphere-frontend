// Deck Browser store for state management
import { writable, derived } from 'svelte/store';
import type {
	DeckBrowserState,
	DeckWithStats,
	FlashcardWithSRS,
	DeckFilters,
	FlashcardFilters
} from '../types/deck-browser';

// Initial state
const initialState: DeckBrowserState = {
	// Layout state
	currentView: 'decks',
	isMobile: false,

	// Selection state
	selectedDeckId: null,
	selectedFlashcardId: null,

	// Data state
	decks: [],
	flashcards: [],

	// UI state
	deckListScrollPosition: 0,
	flashcardListScrollPosition: 0,
	previewScrollPosition: 0,

	// Loading states
	isLoadingDecks: false,
	isLoadingFlashcards: false,
	isLoadingPreview: false,

	// Search and filters
	searchQuery: '',
	deckFilters: {
		status: 'active',
		hasNewCards: false,
		hasReviewCards: false,
		sortBy: 'updated',
		sortOrder: 'desc'
	},
	flashcardFilters: {
		state: 'all',
		isDue: null,
		sortBy: 'created',
		sortOrder: 'desc'
	},

	// Error states
	deckError: null,
	flashcardError: null
};

// Create the main store
export const deckBrowserStore = writable<DeckBrowserState>(initialState);

// Derived stores for easier access to specific parts of state
export const selectedDeck = derived(
	deckBrowserStore,
	($store) => $store.decks.find((deck) => deck.id === $store.selectedDeckId) || null
);

export const selectedFlashcard = derived(
	deckBrowserStore,
	($store) => $store.flashcards.find((card) => card.id === $store.selectedFlashcardId) || null
);

export const filteredDecks = derived(deckBrowserStore, ($store) => {
	let filtered = [...$store.decks];

	// Apply search filter
	if ($store.searchQuery.trim()) {
		const query = $store.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(deck) =>
				deck.name.toLowerCase().includes(query) || deck.description?.toLowerCase().includes(query)
		);
	}

	// Apply status filter
	if ($store.deckFilters.status !== 'all') {
		filtered = filtered.filter((deck) => {
			if ($store.deckFilters.status === 'active') {
				return !deck.archived;
			} else if ($store.deckFilters.status === 'archived') {
				return deck.archived;
			}
			return true;
		});
	}

	// Apply content filters
	if ($store.deckFilters.hasNewCards) {
		filtered = filtered.filter((deck) => deck.stats.newCards > 0);
	}

	if ($store.deckFilters.hasReviewCards) {
		filtered = filtered.filter((deck) => deck.stats.dueCards > 0);
	}

	// Apply sorting
	filtered.sort((a, b) => {
		let aValue: string | number | Date;
		let bValue: string | number | Date;

		switch ($store.deckFilters.sortBy) {
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
				aValue = a.updated;
				bValue = b.updated;
		}

		if ($store.deckFilters.sortOrder === 'asc') {
			return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
		} else {
			return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
		}
	});

	return filtered;
});

export const filteredFlashcards = derived(deckBrowserStore, ($store) => {
	let filtered = [...$store.flashcards];

	// Apply state filter
	if ($store.flashcardFilters.state !== 'all') {
		filtered = filtered.filter((card) => {
			switch ($store.flashcardFilters.state) {
				case 'NEW':
					return card.srsData.state === 'NEW';
				case 'LEARNING':
					return card.srsData.state === 'LEARNING';
				case 'REVIEW':
					return card.srsData.state === 'REVIEW';
				case 'RELEARNING':
					return card.srsData.state === 'RELEARNING';
				case 'MASTERED':
					return card.srsData.state === 'MASTERED';
				default:
					return true;
			}
		});
	}

	// Apply due filter
	if ($store.flashcardFilters.isDue !== null) {
		const now = new Date();
		filtered = filtered.filter((card) => {
			const isDue = card.srsData.nextReview ? new Date(card.srsData.nextReview) <= now : false;
			return $store.flashcardFilters.isDue ? isDue : !isDue;
		});
	}

	// Apply sorting
	filtered.sort((a, b) => {
		let aValue: string | number | Date;
		let bValue: string | number | Date;

		switch ($store.flashcardFilters.sortBy) {
			case 'created':
				aValue = new Date(a.created);
				bValue = new Date(b.created);
				break;
			case 'nextReview':
				aValue = a.srsData.nextReview ? new Date(a.srsData.nextReview) : new Date();
				bValue = b.srsData.nextReview ? new Date(b.srsData.nextReview) : new Date();
				break;
			case 'difficulty':
				aValue = a.srsData.difficulty || 0;
				bValue = b.srsData.difficulty || 0;
				break;
			case 'lastReview':
				aValue = a.srsData.lastReview ? new Date(a.srsData.lastReview) : new Date(0);
				bValue = b.srsData.lastReview ? new Date(b.srsData.lastReview) : new Date(0);
				break;
			default:
				aValue = a.created;
				bValue = b.created;
		}

		if ($store.flashcardFilters.sortOrder === 'asc') {
			return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
		} else {
			return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
		}
	});

	return filtered;
});

// Actions
export const deckBrowserActions = {
	// Layout actions
	setCurrentView: (view: DeckBrowserState['currentView']) => {
		deckBrowserStore.update((state) => ({
			...state,
			currentView: view
		}));
	},

	setIsMobile: (isMobile: boolean) => {
		deckBrowserStore.update((state) => ({
			...state,
			isMobile
		}));
	},

	// Selection actions
	selectDeck: (deckId: string | null) => {
		deckBrowserStore.update((state) => ({
			...state,
			selectedDeckId: deckId,
			selectedFlashcardId: null // Clear flashcard selection when deck changes
		}));
	},

	selectFlashcard: (flashcardId: string | null) => {
		deckBrowserStore.update((state) => ({
			...state,
			selectedFlashcardId: flashcardId
		}));
	},

	// Data actions
	setDecks: (decks: DeckWithStats[]) => {
		deckBrowserStore.update((state) => ({
			...state,
			decks,
			deckError: null
		}));
	},

	setFlashcards: (flashcards: FlashcardWithSRS[]) => {
		deckBrowserStore.update((state) => ({
			...state,
			flashcards,
			flashcardError: null
		}));
	},

	// Loading actions
	setLoadingDecks: (isLoading: boolean) => {
		deckBrowserStore.update((state) => ({
			...state,
			isLoadingDecks: isLoading
		}));
	},

	setLoadingFlashcards: (isLoading: boolean) => {
		deckBrowserStore.update((state) => ({
			...state,
			isLoadingFlashcards: isLoading
		}));
	},

	setLoadingPreview: (isLoading: boolean) => {
		deckBrowserStore.update((state) => ({
			...state,
			isLoadingPreview: isLoading
		}));
	},

	// Search and filter actions
	setSearchQuery: (query: string) => {
		deckBrowserStore.update((state) => ({
			...state,
			searchQuery: query
		}));
	},

	setDeckFilters: (filters: Partial<DeckFilters>) => {
		deckBrowserStore.update((state) => ({
			...state,
			deckFilters: {
				...state.deckFilters,
				...filters
			}
		}));
	},

	setFlashcardFilters: (filters: Partial<FlashcardFilters>) => {
		deckBrowserStore.update((state) => ({
			...state,
			flashcardFilters: {
				...state.flashcardFilters,
				...filters
			}
		}));
	},

	// Error actions
	setDeckError: (error: string | null) => {
		deckBrowserStore.update((state) => ({
			...state,
			deckError: error
		}));
	},

	setFlashcardError: (error: string | null) => {
		deckBrowserStore.update((state) => ({
			...state,
			flashcardError: error
		}));
	},

	// Scroll position actions
	setDeckListScrollPosition: (position: number) => {
		deckBrowserStore.update((state) => ({
			...state,
			deckListScrollPosition: position
		}));
	},

	setFlashcardListScrollPosition: (position: number) => {
		deckBrowserStore.update((state) => ({
			...state,
			flashcardListScrollPosition: position
		}));
	},

	setPreviewScrollPosition: (position: number) => {
		deckBrowserStore.update((state) => ({
			...state,
			previewScrollPosition: position
		}));
	},

	// Reset actions
	reset: () => {
		deckBrowserStore.set(initialState);
	}
};
