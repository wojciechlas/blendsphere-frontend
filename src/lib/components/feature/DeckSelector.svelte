<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import type { Deck } from '$lib/services/deck.service.js';

	interface Props {
		open: boolean;
		decks: Deck[];
		onSelect: (deck: Deck) => void;
		onClose: () => void;
		onCreateNew: () => void;
		selectedDeckId?: string;
	}

	let {
		open = $bindable(),
		decks,
		onSelect,
		onClose,
		onCreateNew,
		selectedDeckId
	}: Props = $props();

	let searchQuery = $state('');
	let selectedDeck = $state<Deck | null>(null);

	// Filter decks based on search query
	let filteredDecks = $derived(
		decks.filter(
			(deck) =>
				deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Separate recent and all decks
	let recentDecks = $derived(
		filteredDecks
			.filter((deck) => deck.lastAccessed)
			.sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime())
			.slice(0, 4)
	);

	let allDecks = $derived(
		filteredDecks.filter((deck) => !recentDecks.some((recent) => recent.id === deck.id))
	);

	const handleDeckSelect = (deck: Deck) => {
		selectedDeck = deck;
	};

	const handleContinue = () => {
		if (selectedDeck) {
			onSelect(selectedDeck);
			open = false;
		}
	};

	const handleClose = () => {
		selectedDeck = null;
		searchQuery = '';
		onClose();
		open = false;
	};

	// Reset selection when modal opens
	$effect(() => {
		if (open) {
			selectedDeck = selectedDeckId ? decks.find((d) => d.id === selectedDeckId) || null : null;
			searchQuery = '';
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Choose Destination Deck</Dialog.Title>
			<Dialog.Description>
				Select the deck where you want to add your new flashcard.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<!-- Search Input -->
			<div class="relative">
				<SearchIcon
					class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
				/>
				<Input bind:value={searchQuery} placeholder="Search decks..." class="pl-10" />
			</div>

			<!-- Recent Decks -->
			{#if recentDecks.length > 0}
				<div class="space-y-3">
					<h3 class="text-foreground text-sm font-medium">Recent Decks</h3>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each recentDecks as deck (deck.id)}
							<button
								type="button"
								class={cn(
									'flex flex-col items-start rounded-lg border p-4 text-left transition-colors',
									selectedDeck?.id === deck.id
										? 'border-primary bg-primary/5 ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50 hover:bg-muted/50'
								)}
								onclick={() => handleDeckSelect(deck)}
							>
								<div class="text-foreground font-medium">{deck.name}</div>
								{#if deck.description}
									<div class="text-muted-foreground mt-1 line-clamp-2 text-sm">
										{deck.description}
									</div>
								{/if}
								<div class="mt-2 flex items-center gap-2">
									<Badge variant="secondary" class="text-xs">
										{deck.cardCount || 0} cards
									</Badge>
									{#if deck.language}
										<Badge variant="outline" class="text-xs">
											{deck.language}
										</Badge>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- All Decks -->
			{#if allDecks.length > 0}
				<div class="space-y-3">
					<h3 class="text-foreground text-sm font-medium">All Decks</h3>
					<div
						class="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
					>
						{#each allDecks as deck (deck.id)}
							<button
								type="button"
								class={cn(
									'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
									selectedDeck?.id === deck.id
										? 'border-primary bg-primary/5 ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50 hover:bg-muted/50'
								)}
								onclick={() => handleDeckSelect(deck)}
							>
								<div class="text-foreground text-sm font-medium">{deck.name}</div>
								<div class="mt-1 flex items-center gap-2">
									<Badge variant="secondary" class="text-xs">
										{deck.cardCount || 0} cards
									</Badge>
									{#if deck.language}
										<Badge variant="outline" class="text-xs">
											{deck.language}
										</Badge>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if filteredDecks.length === 0}
				<div class="text-muted-foreground py-8 text-center">
					<div class="text-lg font-medium">No decks found</div>
					<div class="mt-1 text-sm">
						{searchQuery
							? 'Try adjusting your search terms'
							: 'Create your first deck to get started'}
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="flex justify-between">
			<Button variant="outline" onclick={onCreateNew} class="gap-2">
				<PlusIcon class="h-4 w-4" />
				Create New Deck
			</Button>
			<div class="flex gap-2">
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleContinue} disabled={!selectedDeck}>Continue</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
