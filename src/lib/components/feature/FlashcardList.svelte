<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	import FilterIcon from '@tabler/icons-svelte/icons/filter';
	import SortAscendingIcon from '@tabler/icons-svelte/icons/sort-ascending';
	import SortDescendingIcon from '@tabler/icons-svelte/icons/sort-descending';
	import ClockIcon from '@tabler/icons-svelte/icons/clock';
	import BookIcon from '@tabler/icons-svelte/icons/book';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import StudyIcon from '@tabler/icons-svelte/icons/book-2';
	import EditIcon from '@tabler/icons-svelte/icons/edit';

	import type {
		DeckWithStats,
		FlashcardWithSRS,
		FlashcardFilters
	} from '$lib/types/deck-browser.js';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		selectedDeck: DeckWithStats | null;
		flashcards: FlashcardWithSRS[];
		selectedFlashcardId: string | null;
		filters: FlashcardFilters;
		isLoading: boolean;
		error: string | null;
		isMobile?: boolean;
	}

	let {
		selectedDeck = null,
		flashcards = [],
		selectedFlashcardId = null,
		filters,
		isLoading = false,
		error = null,
		isMobile = false
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		flashcardSelect: { flashcard: FlashcardWithSRS; flashcardId: string };
		filtersChange: { filters: Partial<FlashcardFilters> };
		backToDeckList: void;
		startStudy: { deckId: string };
		editDeck: { deckId: string };
	}>();

	let isFilterOpen = $state(false);

	function handleFlashcardClick(flashcard: FlashcardWithSRS) {
		if (selectedFlashcardId === flashcard.id) return;
		dispatch('flashcardSelect', { flashcard, flashcardId: flashcard.id });
	}

	function handleFilterChange(key: keyof FlashcardFilters, value: string | boolean) {
		dispatch('filtersChange', { filters: { [key]: value } });
	}

	function toggleSortOrder() {
		const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
		handleFilterChange('sortOrder', newOrder);
	}

	function getStateColor(state: string): string {
		switch (state) {
			case 'NEW':
				return 'text-blue-600';
			case 'LEARNING':
				return 'text-orange-600';
			case 'REVIEW':
				return 'text-green-600';
			case 'RELEARNING':
				return 'text-red-600';
			case 'MASTERED':
				return 'text-emerald-600';
			default:
				return 'text-muted-foreground';
		}
	}

	function getStateBadgeVariant(
		state: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (state) {
			case 'NEW':
				return 'outline';
			case 'LEARNING':
				return 'secondary';
			case 'REVIEW':
				return 'default';
			case 'RELEARNING':
				return 'destructive';
			case 'MASTERED':
				return 'default';
			default:
				return 'outline';
		}
	}

	function formatNextReview(flashcard: FlashcardWithSRS): string {
		if (!flashcard.nextReview) return 'Not scheduled';

		const nextDate = new Date(flashcard.nextReview);
		// const now = new Date(); - Not used, keeping the date comparison logic in daysUntilReview

		if (flashcard.isDue) return 'Due now';

		if (flashcard.daysUntilReview !== undefined) {
			if (flashcard.daysUntilReview === 0) return 'Due today';
			if (flashcard.daysUntilReview === 1) return 'Due tomorrow';
			return `Due in ${flashcard.daysUntilReview} days`;
		}

		return nextDate.toLocaleDateString();
	}

	function getFlashcardPreview(flashcard: FlashcardWithSRS): string {
		// Extract text content from the flashcard data
		if (flashcard.data && typeof flashcard.data === 'object') {
			const values = Object.values(flashcard.data);
			const textContent = values.find((v) => typeof v === 'string' && v.length > 0);
			if (textContent && typeof textContent === 'string') {
				return textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
			}
		}
		return 'No preview available';
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header with deck info -->
	{#if selectedDeck}
		<div
			class="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b p-4 backdrop-blur"
		>
			<!-- Mobile back button -->
			{#if isMobile}
				<Button
					variant="ghost"
					size="sm"
					class="mb-3 -ml-2"
					onclick={() => dispatch('backToDeckList')}
				>
					<ArrowLeftIcon class="mr-2 h-4 w-4" />
					Back to Decks
				</Button>
			{/if}

			<!-- Deck header -->
			<div class="mb-4 flex items-start justify-between">
				<div class="min-w-0 flex-1">
					<h2 class="text-foreground truncate text-lg font-semibold">
						{selectedDeck.name}
					</h2>
					{#if selectedDeck.description}
						<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
							{selectedDeck.description}
						</p>
					{/if}
				</div>
				<div class="ml-4 flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => dispatch('editDeck', { deckId: selectedDeck.id })}
					>
						<EditIcon class="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						onclick={() => dispatch('startStudy', { deckId: selectedDeck.id })}
						disabled={selectedDeck.stats.dueCards === 0}
					>
						<StudyIcon class="mr-2 h-4 w-4" />
						Study
					</Button>
				</div>
			</div>

			<!-- Deck stats -->
			<div class="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div class="text-center">
					<div class="text-foreground text-2xl font-bold">
						{selectedDeck.stats.totalCards}
					</div>
					<div class="text-muted-foreground text-xs">Total Cards</div>
				</div>
				<div class="text-center">
					<div class="text-primary text-2xl font-bold">
						{selectedDeck.stats.dueCards}
					</div>
					<div class="text-muted-foreground text-xs">Due Now</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-blue-600">
						{selectedDeck.stats.newCards}
					</div>
					<div class="text-muted-foreground text-xs">New</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">
						{selectedDeck.stats.masteredCards}
					</div>
					<div class="text-muted-foreground text-xs">Mastered</div>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="mb-4">
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Progress</span>
					<span class="font-medium">{selectedDeck.stats.completionPercentage}%</span>
				</div>
				<Progress value={selectedDeck.stats.completionPercentage} class="h-2" />
			</div>

			<!-- Filters -->
			<div class="flex items-center gap-2">
				<Popover.Root bind:open={isFilterOpen}>
					<Popover.Trigger>
						<Button variant="outline" size="sm">
							<FilterIcon class="mr-2 h-4 w-4" />
							Filters
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-80">
						<div class="space-y-4">
							<fieldset>
								<legend class="text-sm font-medium">Card State</legend>
								<div class="mt-1 space-y-2">
									{#each [{ value: 'all', label: 'All Cards' }, { value: 'NEW', label: 'New' }, { value: 'LEARNING', label: 'Learning' }, { value: 'REVIEW', label: 'Review' }, { value: 'RELEARNING', label: 'Relearning' }, { value: 'MASTERED', label: 'Mastered' }] as option (option.value)}
										<label class="flex cursor-pointer items-center space-x-2">
											<input
												type="radio"
												name="state"
												value={option.value}
												checked={filters.state === option.value}
												onchange={() => handleFilterChange('state', option.value)}
												class="text-primary"
											/>
											<span class="text-sm">{option.label}</span>
										</label>
									{/each}
								</div>
							</fieldset>

							<Separator />

							<fieldset>
								<legend class="text-sm font-medium">Review Status</legend>
								<div class="mt-1 space-y-2">
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											name="isDue"
											checked={filters.isDue === false}
											onchange={() => handleFilterChange('isDue', false)}
											class="text-primary"
										/>
										<span class="text-sm">All Cards</span>
									</label>
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											name="isDue"
											checked={filters.isDue === true}
											onchange={() => handleFilterChange('isDue', true)}
											class="text-primary"
										/>
										<span class="text-sm">Due for Review</span>
									</label>
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											name="isDue"
											checked={filters.isDue === false}
											onchange={() => handleFilterChange('isDue', false)}
											class="text-primary"
										/>
										<span class="text-sm">Not Due</span>
									</label>
								</div>
							</fieldset>

							<Separator />

							<fieldset>
								<legend class="text-sm font-medium">Sort by</legend>
								<div class="mt-1 space-y-2">
									{#each [{ value: 'created', label: 'Date Created' }, { value: 'nextReview', label: 'Next Review' }, { value: 'difficulty', label: 'Difficulty' }, { value: 'lastReview', label: 'Last Review' }] as option (option.value)}
										<label class="flex cursor-pointer items-center space-x-2">
											<input
												type="radio"
												name="sortBy"
												value={option.value}
												checked={filters.sortBy === option.value}
												onchange={() => handleFilterChange('sortBy', option.value)}
												class="text-primary"
											/>
											<span class="text-sm">{option.label}</span>
										</label>
									{/each}
								</div>
							</fieldset>
						</div>
					</Popover.Content>
				</Popover.Root>

				<Button variant="outline" size="sm" onclick={toggleSortOrder}>
					{#if filters.sortOrder === 'asc'}
						<SortAscendingIcon class="h-4 w-4" />
					{:else}
						<SortDescendingIcon class="h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>

		<!-- Flashcard list content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if error}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div class="text-destructive mb-2">Failed to load flashcards</div>
					<p class="text-muted-foreground mb-4 text-sm">{error}</p>
					<Button variant="outline" onclick={() => window.location.reload()}>Try Again</Button>
				</div>
			{:else if isLoading}
				<!-- Loading skeletons -->
				<div class="space-y-3">
					{#each Array(8), i (i)}
						<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
						<Card>
							<CardContent class="p-4">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<Skeleton class="mb-2 h-4 w-3/4" />
										<Skeleton class="h-3 w-1/2" />
									</div>
									<Skeleton class="h-6 w-16" />
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{:else if flashcards.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<BookIcon class="text-muted-foreground mb-4 h-12 w-12" />
					<h3 class="mb-2 text-lg font-semibold">No flashcards found</h3>
					<p class="text-muted-foreground mb-4 text-sm">
						This deck doesn't have any flashcards yet, or your filters are too restrictive.
					</p>
					<Button variant="outline">Create Flashcard</Button>
				</div>
			{:else}
				<!-- Flashcard items -->
				<div class="space-y-3">
					{#each flashcards as flashcard (flashcard.id)}
						<Card
							class={cn(
								'cursor-pointer transition-all duration-200 hover:shadow-sm',
								selectedFlashcardId === flashcard.id && 'ring-primary bg-accent/50 ring-2',
								flashcard.isDue && 'border-l-primary border-l-4'
							)}
							onclick={() => handleFlashcardClick(flashcard)}
						>
							<CardContent class="p-4">
								<div class="flex items-center justify-between">
									<div class="min-w-0 flex-1">
										<div class="mb-1 flex items-center gap-2">
											<Badge variant={getStateBadgeVariant(flashcard.state)} class="text-xs">
												{flashcard.state}
											</Badge>
											{#if flashcard.isDue}
												<Badge variant="destructive" class="text-xs">
													<ClockIcon class="mr-1 h-3 w-3" />
													Due
												</Badge>
											{/if}
										</div>

										<p class="mb-1 truncate text-sm font-medium">
											{getFlashcardPreview(flashcard)}
										</p>

										<div class="text-muted-foreground flex items-center gap-3 text-xs">
											<span class={getStateColor(flashcard.state)}>
												{formatNextReview(flashcard)}
											</span>
											{#if flashcard.reviewCount > 0}
												<span>
													Reviewed {flashcard.reviewCount} time{flashcard.reviewCount === 1
														? ''
														: 's'}
												</span>
											{/if}
											{#if flashcard.difficulty}
												<span>
													Difficulty: {Math.round(flashcard.difficulty * 100)}%
												</span>
											{/if}
										</div>
									</div>

									<div class="ml-4 flex items-center">
										{#if selectedFlashcardId === flashcard.id}
											<CheckIcon class="text-primary h-4 w-4" />
										{/if}
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- No deck selected -->
		<div class="flex h-full flex-col items-center justify-center p-8 text-center">
			<BookIcon class="text-muted-foreground mb-4 h-16 w-16" />
			<h3 class="mb-2 text-lg font-semibold">Select a deck</h3>
			<p class="text-muted-foreground text-sm">
				Choose a deck from the list to view its flashcards
			</p>
		</div>
	{/if}
</div>
