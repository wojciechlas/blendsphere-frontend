<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import TemplateSelector from './TemplateSelector.svelte';
	import FlashcardTableCreator from './FlashcardTableCreator.svelte';
	import SaveToDeckModal from './SaveToDeckModal.svelte';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import type { FlashcardCreationSession, FlashcardRow } from '$lib/types/flashcard-creator.js';

	interface Props {
		templates: Template[];
		fields: Field[];
		initialTemplate?: Template;
		availableDecks: Deck[];
	}

	let { templates, fields, initialTemplate, availableDecks }: Props = $props();

	const dispatch = createEventDispatcher<{
		cardsCreated: { cards: unknown[]; deckId: string; template: Template };
		cancel: void;
	}>();

	// Session management
	let session = $state<FlashcardCreationSession>({
		id: crypto.randomUUID(),
		templateId: initialTemplate?.id || null,
		template: initialTemplate || null,
		selectedTemplate: initialTemplate || null,
		flashcardRows: [],
		cards: [],
		selectedDeckId: null, // No deck selected initially
		metadata: {
			tags: [],
			difficulty: 'beginner'
		},
		createdAt: new Date(),
		batchContext: '',
		currentStep: initialTemplate ? 'create-refine' : 'template-selection',
		created: new Date().toISOString(),
		updated: new Date().toISOString()
	});

	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Computed properties
	let currentStep = $derived(session.currentStep);
	let progress = $derived(() => {
		switch (currentStep) {
			case 'template-selection':
				return 33;
			case 'create-refine':
				return 66;
			case 'saving':
				return 100;
			default:
				return 0;
		}
	});

	// Step indicators
	let steps = $derived([
		{
			id: 'template-selection',
			label: 'Select Template',
			completed: currentStep !== 'template-selection',
			current: currentStep === 'template-selection'
		},
		{
			id: 'create-refine',
			label: 'Create & Refine Cards',
			completed: currentStep === 'saving',
			current: currentStep === 'create-refine'
		},
		{
			id: 'saving',
			label: 'Save to Deck',
			completed: false,
			current: currentStep === 'saving'
		}
	]);

	let showTemplateSelector = $state(true); // Control modal visibility

	// Handle step transitions
	function handleTemplateSelect(template: Template) {
		session.selectedTemplate = template;
		session.templateId = template.id;
		session.currentStep = 'create-refine';
		session.updated = new Date().toISOString();
		showTemplateSelector = false;
	}

	function handleCardsCreated(cards: FlashcardRow[]) {
		session.cards = cards;
		session.currentStep = 'saving';
		session.updated = new Date().toISOString();
	}

	function handleBackToTemplateSelection() {
		session.currentStep = 'template-selection';
		session.selectedTemplate = null;
		session.templateId = null;
		session.updated = new Date().toISOString();
		showTemplateSelector = true;
	}

	function handleBackToCreation() {
		session.currentStep = 'create-refine';
		session.updated = new Date().toISOString();
	}

	// General step change handler
	function handleStepChange(step: 'template-selection' | 'create-refine' | 'saving') {
		session.currentStep = step;
		session.updated = new Date().toISOString();
		if (step === 'template-selection') {
			showTemplateSelector = true;
		}
	}

	// Handle final card saving
	async function handleCardsSaved(
		event: CustomEvent<{
			deckId: string;
			selectedCards: FlashcardRow[];
			tags: string[];
			difficulty: string;
		}>
	) {
		isLoading = true;
		error = null;

		try {
			const { deckId, selectedCards, tags, difficulty } = event.detail;

			// Convert FlashcardRows to createable flashcards
			const flashcardsToCreate = selectedCards.map((row) => ({
				front: row.front.content,
				back: row.back.content,
				tags,
				difficulty
				// Add other necessary fields based on your flashcard service requirements
			}));

			// Save flashcards using your existing service
			// await flashcardService.createMultiple(deckId, flashcardsToCreate);

			// Dispatch success event to parent
			dispatch('cardsCreated', {
				cards: flashcardsToCreate,
				deckId,
				template: session.selectedTemplate!
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save flashcards';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<div class="space-y-6">
	<!-- Progress Bar -->
	<div class="space-y-2">
		<div class="flex items-center justify-between text-sm">
			<span class="font-medium">Create Flashcards</span>
			<span class="text-muted-foreground">{progress()}%</span>
		</div>
		<Progress value={progress()} class="h-2" />
	</div>

	<!-- Step Indicators -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			{#each steps as step, index (step.id)}
				<div class="flex items-center">
					<div
						class={cn(
							'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
							step.completed
								? 'bg-primary border-primary text-primary-foreground'
								: step.current
									? 'border-primary text-primary'
									: 'border-muted text-muted-foreground'
						)}
					>
						{#if step.completed}
							<CheckIcon class="h-4 w-4" />
						{:else}
							<span class="text-sm font-medium">{index + 1}</span>
						{/if}
					</div>
					<span
						class={cn(
							'ml-2 text-sm font-medium',
							step.completed || step.current ? 'text-foreground' : 'text-muted-foreground'
						)}
					>
						{step.label}
					</span>
					{#if index < steps.length - 1}
						<div class={cn('mx-4 h-px w-12', step.completed ? 'bg-primary' : 'bg-muted')}></div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Navigation Buttons -->
		<div class="flex gap-2">
			{#if currentStep === 'create-refine'}
				<Button variant="outline" onclick={handleBackToTemplateSelection} class="gap-2">
					<ArrowLeftIcon class="h-4 w-4" />
					Back to Templates
				</Button>
			{:else if currentStep === 'saving'}
				<Button variant="outline" onclick={handleBackToCreation} class="gap-2">
					<ArrowLeftIcon class="h-4 w-4" />
					Back to Cards
				</Button>
			{/if}

			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
		</div>
	</div>

	<!-- Content Area -->
	<Card.Root>
		<Card.Content class="p-6">
			{#if currentStep === 'template-selection'}
				<!-- Step 1: Template Selection -->
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-xl font-semibold">Choose a Template</h2>
						<p class="text-muted-foreground mt-2">
							Select a template to structure your flashcard content.
						</p>
					</div>

					<TemplateSelector
						open={showTemplateSelector}
						{templates}
						onSelect={handleTemplateSelect}
						onClose={() => (showTemplateSelector = false)}
						selectedTemplateId={session.templateId || undefined}
					/>
				</div>
			{:else if currentStep === 'create-refine' && session.selectedTemplate}
				<!-- Step 2: Create & Refine Cards -->
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-xl font-semibold">Create & Refine Cards</h2>
						<p class="text-muted-foreground mt-2">
							Use AI to generate flashcards and refine them as needed.
						</p>
					</div>

					<FlashcardTableCreator
						template={session.selectedTemplate}
						{fields}
						{session}
						onCardsCreated={handleCardsCreated}
					/>
				</div>
			{:else if currentStep === 'saving'}
				<!-- Step 3: Save to Deck -->
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-xl font-semibold">Save to Deck</h2>
						<p class="text-muted-foreground mt-2">
							Review and save your flashcards to the selected deck.
						</p>
					</div>

					<SaveToDeckModal
						{availableDecks}
						cards={session.cards}
						template={session.selectedTemplate}
						on:save={handleCardsSaved}
						on:cancel={() => handleStepChange('create-refine')}
						{isLoading}
					/>
				</div>
			{/if}

			<!-- Error Display -->
			{#if error}
				<div class="bg-destructive/10 border-destructive/20 mt-4 rounded-lg border p-3">
					<p class="text-destructive text-sm">{error}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
