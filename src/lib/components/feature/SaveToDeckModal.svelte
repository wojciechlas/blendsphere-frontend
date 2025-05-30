<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import BookIcon from '@tabler/icons-svelte/icons/book';
	import TagIcon from '@tabler/icons-svelte/icons/tag';
	import SaveIcon from '@tabler/icons-svelte/icons/device-floppy';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { FlashcardRow } from '$lib/types/flashcard-creator.js';

	interface Props {
		availableDecks: Deck[];
		cards: FlashcardRow[];
		template: Template | null;
		isLoading: boolean;
	}

	let { availableDecks, cards, template, isLoading }: Props = $props();

	const dispatch = createEventDispatcher<{
		save: { deckId: string; selectedCards: FlashcardRow[]; tags: string[]; difficulty: string };
		cancel: void;
	}>();

	// Form state
	let selectedDeckId = $state<string>('');
	let selectedCards = $state<Set<string>>(new Set(cards.map((c) => c.id)));
	let addTags = $state('');
	let setDifficulty = $state('medium');

	// Difficulty options
	const difficultyOptions = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'hard', label: 'Hard' }
	];

	// Derived state
	const selectedCardsArray = $derived(cards.filter((card) => selectedCards.has(card.id)));

	const tagsArray = $derived(
		addTags
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0)
	);

	const canSave = $derived(selectedDeckId !== '' && selectedCards.size > 0 && !isLoading);

	// Event handlers
	function handleSave() {
		if (!canSave || selectedDeckId === '') return;

		dispatch('save', {
			deckId: selectedDeckId,
			selectedCards: selectedCardsArray,
			tags: tagsArray,
			difficulty: setDifficulty
		});
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function toggleCard(cardId: string) {
		const newSelected = new Set(selectedCards);
		if (newSelected.has(cardId)) {
			newSelected.delete(cardId);
		} else {
			newSelected.add(cardId);
		}
		selectedCards = newSelected;
	}

	function toggleAllCards() {
		if (selectedCards.size === cards.length) {
			selectedCards = new Set();
		} else {
			selectedCards = new Set(cards.map((c) => c.id));
		}
	}
</script>

<Card.Root class="w-full max-w-4xl">
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<SaveIcon class="h-5 w-5" />
			Save Flashcards to Deck
		</Card.Title>
		<Card.Description>
			Choose a deck and configure options for saving your flashcards.
		</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		<!-- Template Info -->
		{#if template}
			<div class="rounded-lg border p-4">
				<div class="text-muted-foreground flex items-center gap-2 text-sm">
					<BookIcon class="h-4 w-4" />
					Using template: <span class="font-medium">{template.name}</span>
				</div>
			</div>
		{/if}

		<!-- Deck Selection -->
		<div class="space-y-2">
			<Label for="deck-select">Select Deck</Label>
			<Select.Root type="single" bind:value={selectedDeckId}>
				<Select.Trigger id="deck-select">
					{#if selectedDeckId}
						{availableDecks.find((d) => d.id === selectedDeckId)?.name || 'Select a deck'}
					{:else}
						Select a deck
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each availableDecks as deck (deck.id)}
						<Select.Item value={deck.id}>{deck.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Cards Selection -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Label>Cards to Save ({selectedCards.size} of {cards.length})</Label>
				<Button variant="outline" size="sm" onclick={toggleAllCards}>
					{selectedCards.size === cards.length ? 'Deselect All' : 'Select All'}
				</Button>
			</div>

			<div class="max-h-64 overflow-y-auto rounded-lg border">
				{#each cards as card (card.id)}
					<div class="flex items-start gap-3 border-b p-4 last:border-b-0">
						<Checkbox
							checked={selectedCards.has(card.id)}
							onCheckedChange={() => toggleCard(card.id)}
						/>
						<div class="min-w-0 flex-1">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<div class="text-muted-foreground mb-1 text-sm font-medium">Front</div>
									<div class="text-sm">{card.front.content}</div>
								</div>
								<div>
									<div class="text-muted-foreground mb-1 text-sm font-medium">Back</div>
									<div class="text-sm">{card.back.content}</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<Separator />

		<!-- Additional Options -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Tags -->
			<div class="space-y-2">
				<Label for="tags-input">
					<TagIcon class="mr-1 inline h-4 w-4" />
					Tags (comma-separated)
				</Label>
				<Input id="tags-input" bind:value={addTags} placeholder="beginner, vocabulary, lesson-1" />
				{#if tagsArray.length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each tagsArray as tag (tag)}
							<Badge variant="secondary">{tag}</Badge>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Difficulty -->
			<div class="space-y-2">
				<Label>Difficulty</Label>
				<Select.Root type="single" bind:value={setDifficulty}>
					<Select.Trigger>
						{difficultyOptions.find((d) => d.value === setDifficulty)?.label || 'Medium'}
					</Select.Trigger>
					<Select.Content>
						{#each difficultyOptions as option (option.value)}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</Card.Content>

	<Card.Footer class="flex justify-end gap-2">
		<Button variant="outline" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
		<Button onclick={handleSave} disabled={!canSave}>
			{#if isLoading}
				Saving...
			{:else}
				Save {selectedCards.size} Card{selectedCards.size === 1 ? '' : 's'}
			{/if}
		</Button>
	</Card.Footer>
</Card.Root>
