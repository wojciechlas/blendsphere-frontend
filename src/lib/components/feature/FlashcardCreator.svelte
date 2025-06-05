<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toast } from 'svelte-sonner';
	import FlashcardTableCreator from './FlashcardTableCreator.svelte';
	import DeckSelector from './DeckSelector.svelte';
	import TemplateSelector from './TemplateSelector.svelte';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import EditIcon from '@tabler/icons-svelte/icons/edit';
	import SaveIcon from '@tabler/icons-svelte/icons/device-floppy';
	import BookIcon from '@tabler/icons-svelte/icons/book';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import type { FlashcardRow, FlashcardCell } from '$lib/types/flashcard-creator.js';

	interface Props {
		templates: Template[];
		fields: Field[];
		initialTemplate?: Template;
		availableDecks: Deck[];
	}

	let { templates, fields, initialTemplate, availableDecks }: Props = $props();

	// Single-step state management
	let selectedTemplate = $state<Template | null>(initialTemplate || null);
	let selectedDeck = $state<Deck | null>(null);
	let selectedDeckId = $state<string>('');
	let batchContext = $state('');
	let flashcardRows = $state<FlashcardRow[]>([]);

	// Modal states
	let showTemplateSelector = $state(false);
	let showDeckSelector = $state(false);

	// Loading states
	let error = $state<string | null>(null);

	// Get template fields
	let templateFields = $derived(() => {
		if (!selectedTemplate) return [];
		return fields.filter((field) => field.template === selectedTemplate!.id);
	});

	// Count ready cards
	let readyCards = $derived(() => {
		const tFields = templateFields();
		return flashcardRows.filter((row) =>
			tFields.every((field: Field) => {
				const fieldIdSafe = String(field.id);
				// Safe object access with validated key
				const cell =
					row.cells && Object.prototype.hasOwnProperty.call(row.cells, fieldIdSafe)
						? row.cells[fieldIdSafe]
						: null;
				return cell && cell.content.trim();
			})
		);
	});

	// Initialize session when template is selected
	$effect(() => {
		if (selectedTemplate && flashcardRows.length === 0) {
			addNewRow();
		}
	});

	// Template selection handlers
	function handleTemplateSelect(template: Template) {
		selectedTemplate = template;
		showTemplateSelector = false;
		// Reset flashcard rows when template changes
		flashcardRows = [];
		addNewRow();
	}

	function handleChangeTemplate() {
		showTemplateSelector = true;
	}

	// Deck selection handlers
	function handleDeckSelect(deck: Deck) {
		selectedDeck = deck;
		selectedDeckId = deck.id;
		showDeckSelector = false;
	}

	function handleChangeDeck() {
		showDeckSelector = true;
	}

	function handleCreateNewDeck() {
		showDeckSelector = false;
		// TODO: Implement create new deck functionality
		toast.info('Create new deck functionality coming soon');
	}

	// Flashcard row management
	function addNewRow() {
		if (!selectedTemplate) return;

		const newId = crypto.randomUUID();
		const cells: Record<string, FlashcardCell> = {};
		const tFields = templateFields();

		// Initialize cells for all template fields
		tFields.forEach((field: Field) => {
			cells[field.id] = {
				fieldId: field.id,
				content: '',
				aiGenerated: false,
				isAIGenerated: false
			};
		});

		const frontField = tFields.find((f: Field) => f.isInput);
		const backField = tFields.find((f: Field) => !f.isInput);

		const newRow: FlashcardRow = {
			id: newId,
			front: cells[frontField?.id || ''] || {
				fieldId: '',
				content: '',
				aiGenerated: false,
				isAIGenerated: false
			},
			back: cells[backField?.id || ''] || {
				fieldId: '',
				content: '',
				aiGenerated: false,
				isAIGenerated: false
			},
			cells,
			isSelected: true,
			status: 'manual',
			metadata: {
				createdAt: new Date(),
				aiGenerated: false,
				saved: false
			}
		};

		flashcardRows = [...flashcardRows, newRow];
	}

	// Save draft
	function saveDraft() {
		// TODO: Implement draft saving
		toast.info('Draft saved');
	}

	// Clear all
	function clearAll() {
		flashcardRows = [];
		batchContext = '';
		if (selectedTemplate) {
			addNewRow();
		}
		toast.info('All cards cleared');
	}
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
	<!-- Settings Panel (Left Side) -->
	<div class="space-y-4 lg:col-span-1">
		<!-- Template Selection -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Template</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if selectedTemplate}
					<div class="space-y-2">
						<div class="rounded-lg border p-3">
							<div class="font-medium">{selectedTemplate.name}</div>
							{#if selectedTemplate.description}
								<div class="text-muted-foreground mt-1 text-sm">
									{selectedTemplate.description}
								</div>
							{/if}
							<div class="mt-2 flex gap-2">
								<Badge variant="secondary" class="text-xs">
									{templateFields().length} fields
								</Badge>
								{#if selectedTemplate.learningLanguage}
									<Badge variant="outline" class="text-xs">
										{selectedTemplate.nativeLanguage} → {selectedTemplate.learningLanguage}
									</Badge>
								{/if}
							</div>
						</div>
						<Button variant="outline" size="sm" onclick={handleChangeTemplate} class="w-full gap-2">
							<EditIcon class="h-4 w-4" />
							Change Template
						</Button>
					</div>
				{:else}
					<div class="space-y-3 text-center">
						<div class="text-muted-foreground text-sm">No template selected</div>
						<Button onclick={() => (showTemplateSelector = true)} size="sm" class="w-full gap-2">
							<BookIcon class="h-4 w-4" />
							Select Template
						</Button>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Deck Selection -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Destination Deck</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if selectedDeck}
					<div class="space-y-2">
						<div class="rounded-lg border p-3">
							<div class="font-medium">{selectedDeck.name}</div>
							{#if selectedDeck.description}
								<div class="text-muted-foreground mt-1 text-sm">
									{selectedDeck.description}
								</div>
							{/if}
							<div class="text-muted-foreground mt-2 text-xs">
								{selectedDeck.cards?.length || 0} cards
							</div>
						</div>
						<div class="flex gap-1">
							<Button variant="outline" size="sm" onclick={handleChangeDeck} class="flex-1 gap-2">
								<EditIcon class="h-4 w-4" />
								Change
							</Button>
						</div>
					</div>
				{:else}
					<div class="space-y-3 text-center">
						<div class="text-muted-foreground text-sm">No deck selected</div>
						<div class="flex flex-col gap-2">
							<Button onclick={() => (showDeckSelector = true)} size="sm" class="w-full">
								Select Deck
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={handleCreateNewDeck}
								class="w-full gap-2"
							>
								<PlusIcon class="h-4 w-4" />
								New Deck
							</Button>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Main Content Area (Right Side) -->
	<div class="space-y-6 lg:col-span-3">
		{#if !selectedTemplate}
			<!-- Template Selection Prompt -->
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<div class="space-y-4">
						<BookIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<div>
							<h3 class="text-lg font-medium">Select a Template</h3>
							<p class="text-muted-foreground mt-2 text-sm">
								Choose a template to get started with creating flashcards
							</p>
						</div>
						<Button onclick={() => (showTemplateSelector = true)} class="gap-2">
							<BookIcon class="h-4 w-4" />
							Browse Templates
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Flashcard Creator Interface -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div>
							<Card.Title>Create Flashcards: {selectedTemplate.name}</Card.Title>
							<Card.Description>
								{#if selectedDeck}
									Cards will be saved to "{selectedDeck.name}"
								{:else}
									Select a deck to save your cards
								{/if}
							</Card.Description>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="space-y-6">
					<!-- Batch Context -->
					<div class="space-y-2">
						<Label for="batch-context">Batch Context (Optional)</Label>
						<Textarea
							id="batch-context"
							bind:value={batchContext}
							placeholder="Provide overall context for this batch to improve AI generation quality..."
							rows={2}
							class="min-h-[60px]"
						/>
						<p class="text-muted-foreground text-xs">
							💡 Provide overall context for this batch to improve AI generation quality
						</p>
					</div>

					<!-- Flashcard Table Integration -->
					{#if selectedTemplate && templateFields().length > 0}
						<FlashcardTableCreator
							template={selectedTemplate}
							fields={templateFields()}
							deck={selectedDeck ?? undefined}
							session={{
								id: crypto.randomUUID(),
								templateId: selectedTemplate.id,
								template: selectedTemplate,
								selectedTemplate: selectedTemplate,
								flashcardRows: flashcardRows,
								cards: flashcardRows,
								selectedDeckId: selectedDeckId,
								metadata: { tags: [], difficulty: 'beginner' },
								createdAt: new Date(),
								created: new Date().toISOString(),
								updated: new Date().toISOString(),
								currentStep: 'create-refine',
								batchContext: batchContext
							}}
						/>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Unified Action Bar -->

			<Card.Root>
				<Card.Content>
					<div class="flex items-center justify-between">
						<div class="flex gap-2">
							<Button variant="outline" onclick={saveDraft} class="gap-2">
								<SaveIcon class="h-4 w-4" />
								Save Draft
							</Button>
							<Button variant="outline" onclick={clearAll} class="gap-2">Clear All</Button>
						</div>

						<div class="flex items-center gap-4">
							<!-- Status Summary -->
							<div class="text-muted-foreground text-sm">
								{readyCards().length} of {flashcardRows.length} cards ready
							</div>

							<!-- Info about save actions being in the table -->
							<div class="text-muted-foreground text-xs">
								Use "Save Ready Cards" button in the table above to save completed flashcards
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Error Display -->
		{#if error}
			<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
				<p class="text-destructive text-sm">{error}</p>
			</div>
		{/if}
	</div>
</div>

<!-- Template Selector Modal -->
<TemplateSelector
	bind:open={showTemplateSelector}
	{templates}
	onSelect={handleTemplateSelect}
	onClose={() => (showTemplateSelector = false)}
	selectedTemplateId={selectedTemplate?.id}
/>

<!-- Deck Selector Modal -->
<DeckSelector
	bind:open={showDeckSelector}
	decks={availableDecks}
	onSelect={handleDeckSelect}
	onCreateNew={handleCreateNewDeck}
	onClose={() => (showDeckSelector = false)}
	selectedDeckId={selectedDeck?.id}
/>
