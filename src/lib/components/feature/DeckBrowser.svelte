<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		deckBrowserStore,
		deckBrowserActions,
		selectedDeck,
		filteredDecks,
		filteredFlashcards,
		selectedFlashcard
	} from '$lib/stores/deck-browser.store';
	import { deckBrowserService } from '$lib/services/deck-browser.service';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { DeckWithStats, FlashcardWithSRS } from '$lib/types/deck-browser';

	import DeckList from './DeckList.svelte';
	import FlashcardList from './FlashcardList.svelte';
	import FlashcardPreviewPanel from './FlashcardPreviewPanel.svelte';

	// Loading state
	let isInitialLoad = $state(true);

	$effect(() => {
		// Load initial data
		loadDecks();

		// Set up responsive behavior
		const handleResize = () => {
			deckBrowserActions.setIsMobile(window.innerWidth < 1024);
		};

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	async function loadDecks(): Promise<void> {
		deckBrowserActions.setLoadingDecks(true);
		try {
			const decks = await deckBrowserService.getDecks();
			deckBrowserActions.setDecks(decks);
			isInitialLoad = false;
		} catch (error) {
			console.error('Failed to load decks:', error);
			deckBrowserActions.setDeckError(
				error instanceof Error ? error.message : 'Failed to load decks'
			);
		} finally {
			deckBrowserActions.setLoadingDecks(false);
		}
	}

	async function handleDeckSelect(
		event: CustomEvent<{ deck: DeckWithStats; deckId: string }>
	): Promise<void> {
		const { deckId } = event.detail;
		deckBrowserActions.selectDeck(deckId);

		// Load flashcards for the selected deck
		deckBrowserActions.setLoadingFlashcards(true);
		try {
			const flashcards = await deckBrowserService.getFlashcards(deckId);
			deckBrowserActions.setFlashcards(flashcards);
		} catch (error) {
			console.error('Failed to load flashcards:', error);
			deckBrowserActions.setFlashcardError(
				error instanceof Error ? error.message : 'Failed to load flashcards'
			);
		} finally {
			deckBrowserActions.setLoadingFlashcards(false);
		}
	}

	function handleFlashcardSelect(
		event: CustomEvent<{ flashcard: FlashcardWithSRS; flashcardId: string }>
	): void {
		const { flashcardId } = event.detail;
		deckBrowserActions.selectFlashcard(flashcardId);
	}

	function handleSearchChange(event: CustomEvent<{ query: string }>): void {
		deckBrowserActions.setSearchQuery(event.detail.query);
	}

	function handleDeckFiltersChange(event: CustomEvent<{ filters: Record<string, unknown> }>): void {
		deckBrowserActions.setDeckFilters(event.detail.filters);
	}

	function handleFlashcardFiltersChange(
		event: CustomEvent<{ filters: Record<string, unknown> }>
	): void {
		deckBrowserActions.setFlashcardFilters(event.detail.filters);
	}

	function handleCreateDeck(): void {
		// Navigate to deck creation page
		goto('/dashboard/decks/create');
	}
</script>

<div class="deck-browser h-full w-full">
	<!-- Loading State -->
	{#if isInitialLoad && $deckBrowserStore.isLoadingDecks}
		<div class="flex h-full items-center justify-center">
			<div class="flex items-center space-x-2">
				<div
					class="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
				></div>
				<span class="text-muted-foreground">Loading decks...</span>
			</div>
		</div>
		<!-- Error State -->
	{:else if $deckBrowserStore.deckError && $deckBrowserStore.decks.length === 0}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div class="text-destructive mb-2 text-lg font-semibold">Error Loading Decks</div>
				<p class="text-muted-foreground mb-4">{$deckBrowserStore.deckError}</p>
				<Button variant="default" size="default" onclick={() => loadDecks()}>Retry</Button>
			</div>
		</div>
		<!-- Main Content -->
	{:else}
		<div class="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-3">
			<!-- Left Column: Deck List -->
			<div class="lg:col-span-1">
				<DeckList
					decks={$filteredDecks}
					selectedDeckId={$deckBrowserStore.selectedDeckId}
					searchQuery={$deckBrowserStore.searchQuery}
					filters={$deckBrowserStore.deckFilters}
					isLoading={$deckBrowserStore.isLoadingDecks}
					error={$deckBrowserStore.deckError}
					on:deckSelect={handleDeckSelect}
					on:searchChange={handleSearchChange}
					on:filtersChange={handleDeckFiltersChange}
					on:createDeck={handleCreateDeck}
				/>
			</div>

			<!-- Middle Column: Flashcard List -->
			<div class="lg:col-span-1">
				<FlashcardList
					flashcards={$filteredFlashcards}
					selectedFlashcardId={$deckBrowserStore.selectedFlashcardId}
					selectedDeck={$selectedDeck}
					filters={$deckBrowserStore.flashcardFilters}
					isLoading={$deckBrowserStore.isLoadingFlashcards}
					error={$deckBrowserStore.flashcardError}
					on:flashcardSelect={handleFlashcardSelect}
					on:filtersChange={handleFlashcardFiltersChange}
				/>
			</div>

			<!-- Right Column: Flashcard Preview -->
			<div class="hidden lg:col-span-1 lg:block">
				<FlashcardPreviewPanel
					selectedFlashcard={$selectedFlashcard}
					isLoading={$deckBrowserStore.isLoadingPreview}
					error={null}
				/>
			</div>
		</div>

		<!-- Mobile Preview Modal -->
		{#if $selectedFlashcard && $deckBrowserStore.isMobile}
			<div class="bg-background/80 fixed inset-0 z-50 backdrop-blur-sm lg:hidden">
				<div
					class="bg-card fixed top-4 right-4 bottom-4 left-4 overflow-hidden rounded-lg border shadow-lg"
				>
					<div class="flex h-full flex-col">
						<!-- Header with close button -->
						<div class="flex items-center justify-between border-b p-4">
							<h2 class="text-lg font-semibold">Flashcard Preview</h2>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => deckBrowserActions.selectFlashcard(null)}
								aria-label="Close preview"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</Button>
						</div>

						<!-- Preview content -->
						<div class="flex-1 overflow-hidden">
							<FlashcardPreviewPanel
								selectedFlashcard={$selectedFlashcard}
								isLoading={$deckBrowserStore.isLoadingPreview}
								error={null}
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Use responsive Tailwind classes instead of custom CSS in the component markup */
	.deck-browser {
		min-height: calc(100vh - 4rem); /* Adjust based on your header height */
	}
</style>
