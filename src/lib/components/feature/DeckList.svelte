<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import FilterIcon from '@tabler/icons-svelte/icons/filter';
	import SortAscendingIcon from '@tabler/icons-svelte/icons/sort-ascending';
	import SortDescendingIcon from '@tabler/icons-svelte/icons/sort-descending';
	import ClockIcon from '@tabler/icons-svelte/icons/clock';
	import BrainIcon from '@tabler/icons-svelte/icons/brain';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import BookIcon from '@tabler/icons-svelte/icons/book';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';

	import type { DeckWithStats, DeckFilters } from '$lib/types/deck-browser.js';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		decks: DeckWithStats[];
		selectedDeckId: string | null;
		searchQuery: string;
		filters: DeckFilters;
		isLoading: boolean;
		error: string | null;
	}

	let {
		decks = [],
		selectedDeckId = null,
		searchQuery = '',
		filters,
		isLoading = false,
		error = null
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		deckSelect: { deck: DeckWithStats; deckId: string };
		searchChange: { query: string };
		filtersChange: { filters: Partial<DeckFilters> };
		createDeck: void;
	}>();

	// Local state for UI
	let searchInput = $state(searchQuery);
	let isFilterOpen = $state(false);

	// Handle search input with debouncing
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchInput = target.value;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			dispatch('searchChange', { query: searchInput });
		}, 300);
	}

	function handleDeckClick(deck: DeckWithStats) {
		if (selectedDeckId === deck.id) return;
		dispatch('deckSelect', { deck, deckId: deck.id });
	}

	function handleFilterChange(key: keyof DeckFilters, value: string | boolean) {
		dispatch('filtersChange', { filters: { [key]: value } });
	}

	function toggleSortOrder() {
		const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
		handleFilterChange('sortOrder', newOrder);
	}

	function formatLastStudied(dateString: string | undefined): string {
		if (!dateString) return 'Never';

		const date = new Date(dateString);
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return `${Math.floor(diffDays / 30)} months ago`;
	}

	function getStateVariant(
		completionPercentage: number
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (completionPercentage >= 80) return 'default';
		if (completionPercentage >= 50) return 'secondary';
		if (completionPercentage >= 20) return 'outline';
		return 'destructive';
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header with search and filters -->
	<div
		class="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b p-4 backdrop-blur"
	>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-foreground text-lg font-semibold">My Decks</h2>
			<Button variant="outline" size="sm" onclick={() => dispatch('createDeck')}>
				<PlusIcon class="mr-2 h-4 w-4" />
				New Deck
			</Button>
		</div>

		<!-- Search bar -->
		<div class="relative mb-3">
			<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
			<Input
				type="text"
				placeholder="Search decks..."
				value={searchInput}
				oninput={handleSearchInput}
				class="pl-9"
			/>
		</div>

		<!-- Filters and sorting -->
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
							<legend class="text-sm font-medium">Status</legend>
							<div class="mt-1 space-y-2">
								{#each [{ value: 'all', label: 'All Decks' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }] as option (option.value)}
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											name="status"
											value={option.value}
											checked={filters.status === option.value}
											onchange={() => handleFilterChange('status', option.value)}
											class="text-primary"
										/>
										<span class="text-sm">{option.label}</span>
									</label>
								{/each}
							</div>
						</fieldset>

						<Separator />

						<fieldset>
							<legend class="text-sm font-medium">Content Filters</legend>
							<div class="mt-1 space-y-2">
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={filters.hasNewCards}
										onchange={(e) => handleFilterChange('hasNewCards', e.currentTarget.checked)}
										class="text-primary"
									/>
									<span class="text-sm">Has new cards</span>
								</label>
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={filters.hasReviewCards}
										onchange={(e) => handleFilterChange('hasReviewCards', e.currentTarget.checked)}
										class="text-primary"
									/>
									<span class="text-sm">Has cards due for review</span>
								</label>
							</div>
						</fieldset>

						<Separator />

						<fieldset>
							<legend class="text-sm font-medium">Sort by</legend>
							<div class="mt-1 space-y-2">
								{#each [{ value: 'name', label: 'Name' }, { value: 'created', label: 'Date Created' }, { value: 'updated', label: 'Last Modified' }, { value: 'lastStudied', label: 'Last Studied' }] as option (option.value)}
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

	<!-- Deck list content -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if error}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="text-destructive mb-2">Failed to load decks</div>
				<p class="text-muted-foreground mb-4 text-sm">{error}</p>
				<Button variant="outline" onclick={() => window.location.reload()}>Try Again</Button>
			</div>
		{:else if isLoading}
			<!-- Loading skeletons -->
			<div class="space-y-4">
				{#each Array(6).fill(0), i (i)}
					<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
					<Card>
						<CardHeader class="pb-3">
							<Skeleton class="h-5 w-3/4" />
							<Skeleton class="h-4 w-1/2" />
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								<Skeleton class="h-2 w-full" />
								<div class="flex justify-between">
									<Skeleton class="h-6 w-16" />
									<Skeleton class="h-6 w-20" />
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{:else if decks.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<BookIcon class="text-muted-foreground mb-4 h-12 w-12" />
				<h3 class="mb-2 text-lg font-semibold">No decks found</h3>
				<p class="text-muted-foreground mb-4 text-sm">
					{searchQuery
						? 'Try adjusting your search terms or filters.'
						: 'Create your first deck to get started.'}
				</p>
				<Button onclick={() => dispatch('createDeck')}>
					<PlusIcon class="mr-2 h-4 w-4" />
					Create Your First Deck
				</Button>
			</div>
		{:else}
			<!-- Deck cards -->
			<div class="space-y-4">
				{#each decks as deck (deck.id)}
					<Card
						class={cn(
							'cursor-pointer transition-all duration-200 hover:shadow-md',
							selectedDeckId === deck.id && 'ring-primary bg-accent/50 ring-2'
						)}
						onclick={() => handleDeckClick(deck)}
					>
						<CardHeader class="pb-3">
							<div class="flex items-start justify-between">
								<div class="min-w-0 flex-1">
									<CardTitle class="truncate text-base font-semibold">
										{deck.name}
									</CardTitle>
									{#if deck.description}
										<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
											{deck.description}
										</p>
									{/if}
								</div>
								<Badge
									variant={getStateVariant(deck.stats.completionPercentage)}
									class="ml-2 shrink-0"
								>
									{deck.stats.completionPercentage}%
								</Badge>
							</div>
						</CardHeader>

						<CardContent class="pt-0">
							<!-- Progress bar -->
							<div class="mb-3">
								<Progress value={deck.stats.completionPercentage} class="h-2" />
							</div>

							<!-- Stats row -->
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-4">
									<div class="text-muted-foreground flex items-center gap-1">
										<BookIcon class="h-4 w-4" />
										<span>{deck.stats.totalCards}</span>
									</div>

									{#if deck.stats.dueCards > 0}
										<div class="text-primary flex items-center gap-1">
											<ClockIcon class="h-4 w-4" />
											<span>{deck.stats.dueCards}</span>
										</div>
									{/if}

									{#if deck.stats.newCards > 0}
										<div class="flex items-center gap-1 text-blue-600">
											<EyeIcon class="h-4 w-4" />
											<span>{deck.stats.newCards}</span>
										</div>
									{/if}

									{#if deck.stats.masteredCards > 0}
										<div class="flex items-center gap-1 text-green-600">
											<BrainIcon class="h-4 w-4" />
											<span>{deck.stats.masteredCards}</span>
										</div>
									{/if}
								</div>

								<div class="text-muted-foreground text-xs">
									{formatLastStudied(deck.stats.lastStudied)}
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>
