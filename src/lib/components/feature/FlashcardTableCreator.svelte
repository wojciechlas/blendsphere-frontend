<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import SparklesIcon from '@tabler/icons-svelte/icons/sparkles';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import ThumbUpIcon from '@tabler/icons-svelte/icons/thumb-up';
	import ThumbDownIcon from '@tabler/icons-svelte/icons/thumb-down';
	import FlashcardPreview from './FlashcardPreview.svelte';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import type {
		FlashcardCreationSession,
		FlashcardRow,
		FlashcardCell,
		GenerationFieldData
	} from '$lib/types/flashcard-creator.js';
	import { aiService, AIServiceException } from '$lib/services/ai.service.js';
	import { flashcardService } from '$lib/services/flashcard.service.js';
	import { toast } from 'svelte-sonner';

	interface Props {
		template: Template;
		fields: Field[];
		deck?: Deck;
		session: FlashcardCreationSession;
	}

	let { template, fields, deck, session }: Props = $props();

	// Preview modal state
	let previewModalOpen = $state(false);
	let previewRowData = $state<FlashcardRow | null>(null);

	// Helper functions for safe object access
	function safeGetCell(
		cells: Record<string, FlashcardCell>,
		fieldId: string
	): FlashcardCell | undefined {
		return Object.prototype.hasOwnProperty.call(cells, fieldId) ? cells[fieldId] : undefined;
	}

	function safeSetCell(
		cells: Record<string, FlashcardCell>,
		fieldId: string,
		value: FlashcardCell
	): void {
		if (typeof fieldId === 'string' && fieldId.length > 0) {
			cells[fieldId] = value;
		}
	}

	// Get template fields filtered for this template
	let templateFields = $derived(
		fields.filter((f) => f.template === template.id).sort((a, b) => (a.order || 0) - (b.order || 0))
	);

	let batchContext = $state(session.batchContext || '');
	let flashcardRows = $state<FlashcardRow[]>(session.cards || []);
	let isGenerating = $state(false);
	let generationError = $state<string | null>(null);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);

	// Initialize with empty rows if none exist
	$effect(() => {
		if (flashcardRows.length === 0) {
			flashcardRows = [createEmptyRow()];
		}
	});

	// Auto-save session every 30 seconds
	$effect(() => {
		const interval = setInterval(() => {
			if (flashcardRows.length > 0) {
				updateSession();
			}
		}, 30000);

		return () => clearInterval(interval);
	});

	// Get ready cards (cards with all required fields filled)
	let readyCards = $derived(() => {
		return flashcardRows.filter((row) => {
			// Check if all required fields have content
			return templateFields.every((field) => {
				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);
				return cell && cell.content.trim().length > 0;
			});
		});
	});

	function createEmptyRow(): FlashcardRow {
		const cells: Record<string, FlashcardCell> = {};

		templateFields.forEach((field) => {
			const fieldIdSafe = String(field.id);
			safeSetCell(cells, fieldIdSafe, {
				fieldId: fieldIdSafe,
				content: '',
				aiGenerated: false,
				isAIGenerated: false,
				feedback: undefined
			});
		});

		// Create front and back cells based on template fields
		const frontField = templateFields.find((f) => f.isInput) || templateFields[0];
		const backField = templateFields.find((f) => !f.isInput) || templateFields[1];

		const frontFieldId = frontField?.id ? String(frontField.id) : 'front';
		const backFieldId = backField?.id ? String(backField.id) : 'back';

		return {
			id: crypto.randomUUID(),
			front: safeGetCell(cells, frontFieldId) || {
				fieldId: 'front',
				content: '',
				aiGenerated: false,
				isAIGenerated: false,
				feedback: undefined
			},
			back: safeGetCell(cells, backFieldId) || {
				fieldId: 'back',
				content: '',
				aiGenerated: false,
				isAIGenerated: false,
				feedback: undefined
			},
			cells,
			isSelected: false,
			status: 'manual',
			metadata: {
				createdAt: new Date(),
				aiGenerated: false,
				saved: false
			}
		};
	}

	function addRow() {
		flashcardRows = [...flashcardRows, createEmptyRow()];
		updateSession();
	}

	function removeRow(rowId: string) {
		flashcardRows = flashcardRows.filter((row) => row.id !== rowId);
		updateSession();
	}

	function updateRowCell(rowId: string, fieldId: string, content: string) {
		flashcardRows = flashcardRows.map((row) => {
			if (row.id === rowId) {
				const updatedCells = { ...row.cells };
				const fieldIdSafe = String(fieldId);

				const existingCell = safeGetCell(updatedCells, fieldIdSafe);
				if (existingCell) {
					safeSetCell(updatedCells, fieldIdSafe, {
						...existingCell,
						content,
						isAIGenerated: false // Mark as manually edited
					});
				}

				return {
					...row,
					cells: updatedCells,
					// Update front/back cells if they match this field
					front:
						fieldId === row.front.fieldId
							? safeGetCell(updatedCells, fieldIdSafe) || row.front
							: row.front,
					back:
						fieldId === row.back.fieldId
							? safeGetCell(updatedCells, fieldIdSafe) || row.back
							: row.back
				};
			}
			return row;
		});
		updateSession();
	}

	function updateSession() {
		session.cards = flashcardRows;
		session.batchContext = batchContext;
		session.updated = new Date().toISOString();
	}

	// Save ready cards to the selected deck
	async function saveReadyCards() {
		if (!deck) {
			toast.error('Please select a deck before saving');
			return;
		}

		const cardsToSave = readyCards();
		if (cardsToSave.length === 0) {
			toast.error('No ready cards to save. Please complete at least one flashcard.');
			return;
		}

		isSaving = true;
		saveError = null;

		try {
			// Save flashcards to PocketBase using the flashcard service
			const savedCards = await flashcardService.createFromRows(cardsToSave, deck.id, template.id);

			// Mark saved cards as saved in the session
			flashcardRows = flashcardRows.map((row) => {
				if (cardsToSave.includes(row)) {
					return {
						...row,
						status: 'saved' as const,
						metadata: {
							...row.metadata,
							saved: true,
							savedAt: new Date()
						}
					};
				}
				return row;
			});

			updateSession();
			toast.success(`${savedCards.length} cards saved to ${deck.name}`);

			// Return the saved cards for parent component handling
			return savedCards;
		} catch (error) {
			console.error('Error saving flashcards:', error);
			saveError = error instanceof Error ? error.message : 'Failed to save flashcards';
			toast.error(saveError);
			throw error;
		} finally {
			isSaving = false;
		}
	}

	// Save draft session to local storage
	function saveDraft() {
		try {
			const draftData = {
				sessionId: session.id,
				templateId: template.id,
				deckId: deck?.id,
				batchContext,
				flashcardRows,
				timestamp: new Date().toISOString()
			};

			localStorage.setItem(`flashcard-session-${session.id}`, JSON.stringify(draftData));
			toast.success('Draft saved locally');
		} catch (error) {
			console.error('Error saving draft:', error);
			toast.error('Failed to save draft');
		}
	}

	// Clear all cards and reset to default state
	function clearAll() {
		flashcardRows = [createEmptyRow()];
		batchContext = '';
		updateSession();
		toast.info('All cards cleared');
	}

	// Count eligible cards for input field generation
	let eligibleInputCards = $derived(() => {
		return flashcardRows.filter((row) => {
			// Check if the row has at least one input field with content
			const hasInputContent = templateFields.some((field) => {
				if (!field.isInput) return false;
				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);
				return cell && cell.content.trim().length > 0;
			});

			// Check if the row has at least one non-input field that's empty
			const hasEmptyOutputFields = templateFields.some((field) => {
				if (field.isInput) return false;
				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);
				return !cell || !cell.content.trim();
			});

			return hasInputContent && hasEmptyOutputFields;
		});
	});

	async function generateForInputCards() {
		const eligibleCards = eligibleInputCards();

		if (eligibleCards.length === 0) {
			generationError =
				'No eligible cards found. Cards need input content and empty output fields.';
			return;
		}

		isGenerating = true;
		generationError = null;

		try {
			// Create generation items only for empty output fields in eligible cards
			const items: GenerationFieldData[] = [];

			eligibleCards.forEach((row: FlashcardRow) => {
				templateFields.forEach((field) => {
					// Only generate for non-input fields that are empty
					if (field.isInput) return;

					const fieldIdSafe = String(field.id);
					const cell = safeGetCell(row.cells, fieldIdSafe);

					// Skip if field already has content
					if (cell && cell.content.trim()) return;

					// Get input field content for context
					const inputFields = templateFields.filter((f) => f.isInput);
					const inputContent = inputFields
						.map((inputField) => {
							const inputFieldId = String(inputField.id);
							const inputCell = safeGetCell(row.cells, inputFieldId);
							return inputCell?.content || '';
						})
						.join(', ');

					items.push({
						fieldId: field.id,
						value: inputContent || field.label || field.name
					});
				});
			});

			if (items.length === 0) {
				generationError =
					'No fields to generate. All eligible cards already have complete content.';
				return;
			}

			// Build request using the service helper
			const request = aiService.buildRequest(template, items, batchContext.trim());

			// Call the unified AI service
			const response = await aiService.generate(request);

			if (response.error) {
				generationError = response.error;
				return;
			}

			// Update the flashcard rows with generated content
			// The response.flashcards array contains one flashcard per eligible row
			// Each flashcard has a fields array with all generated fields for that row
			let flashcardIndex = 0;

			flashcardRows = flashcardRows.map((row) => {
				// Only process eligible cards
				if (!eligibleCards.includes(row)) {
					return row;
				}

				const updatedCells = { ...row.cells };
				let wasUpdated = false;

				// Get the flashcard for this row

				const generatedFlashcard = response.flashcards[flashcardIndex];
				if (generatedFlashcard && generatedFlashcard.fields) {
					// For this eligible row, process all fields that need generation
					templateFields.forEach((field) => {
						// Only process non-input fields that were included in the request
						if (field.isInput) return;

						const fieldIdSafe = String(field.id);
						const cell = safeGetCell(row.cells, fieldIdSafe);

						// Skip if field already has content (same logic as request building)
						if (cell && cell.content.trim()) return;

						// Find the generated field for this field ID
						const generatedField = generatedFlashcard.fields.find((f) => f.fieldId === field.id);

						if (generatedField && generatedField.value) {
							safeSetCell(updatedCells, fieldIdSafe, {
								fieldId: fieldIdSafe,
								content: generatedField.value,
								aiGenerated: true,
								isAIGenerated: true,
								feedback: undefined
							});
							wasUpdated = true;
						}
					});
				}

				flashcardIndex++;

				if (wasUpdated) {
					// Update front and back cells
					const frontField = templateFields.find((f) => f.isInput) || templateFields[0];
					const backField = templateFields.find((f) => !f.isInput) || templateFields[1];

					const frontFieldId = frontField?.id ? String(frontField.id) : 'front';
					const backFieldId = backField?.id ? String(backField.id) : 'back';

					return {
						...row,
						cells: updatedCells,
						front: safeGetCell(updatedCells, frontFieldId) || row.front,
						back: safeGetCell(updatedCells, backFieldId) || row.back,
						status: 'ai-generated' as const,
						metadata: {
							...row.metadata,
							aiGenerated: true,
							saved: row.metadata.saved || false
						}
					};
				}

				return row;
			});

			updateSession();
		} catch (error) {
			console.error('AI generation for input cards failed:', error);

			if (error instanceof AIServiceException) {
				generationError = error.error.message;
				toast.error(error.error.message);
			} else {
				generationError =
					error instanceof Error ? error.message : 'Failed to generate fields for input cards';
				toast.error('Failed to generate fields for input cards');
			}
		} finally {
			isGenerating = false;
		}
	}

	async function generateBatchCards() {
		if (!batchContext.trim()) {
			generationError = 'Please provide context for AI generation';
			return;
		}

		isGenerating = true;
		generationError = null;

		try {
			const cardCount = Math.max(flashcardRows.length, 5); // Generate at least 5 cards

			// Create generation items for each card we want to generate
			const items: GenerationFieldData[] = [];

			for (let i = 0; i < cardCount; i++) {
				// For each template field, create a generation item
				templateFields.forEach((field) => {
					const existingRow = flashcardRows[i];
					const fieldIdSafe = String(field.id);
					const existingContent =
						existingRow && existingRow.cells
							? safeGetCell(existingRow.cells, fieldIdSafe)?.content
							: undefined;

					items.push({
						fieldId: field.id,
						value: existingContent || `${field.label || field.name} for card ${i + 1}`
					});
				});
			}

			// Build request using the service helper
			const request = aiService.buildRequest(template, items, batchContext.trim());

			// Call the unified AI service
			const response = await aiService.generate(request);

			if (response.error) {
				generationError = response.error;
				return;
			}

			// Process the results and update flashcard rows
			// The response.flashcards array contains one flashcard per card
			// Each flashcard has a fields array with all generated fields for that card
			const newRows: FlashcardRow[] = [];

			for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
				const existingRow = flashcardRows[cardIndex];
				const cells: Record<string, FlashcardCell> = {};

				// Get the flashcard for this card
				const generatedFlashcard = response.flashcards[cardIndex];

				// Populate cells with AI-generated content
				templateFields.forEach((field) => {
					const fieldIdSafe = String(field.id);
					let content = '';
					let aiGenerated = false;

					if (generatedFlashcard && generatedFlashcard.fields) {
						// Find the generated field for this field ID
						const generatedField = generatedFlashcard.fields.find((f) => f.fieldId === field.id);

						if (generatedField && generatedField.value) {
							content = generatedField.value;
							aiGenerated = true;
						} else {
							// Keep existing content if generation failed
							content =
								existingRow && existingRow.cells
									? safeGetCell(existingRow.cells, fieldIdSafe)?.content || ''
									: '';
						}
					} else {
						// Keep existing content if no flashcard generated
						content =
							existingRow && existingRow.cells
								? safeGetCell(existingRow.cells, fieldIdSafe)?.content || ''
								: '';
					}

					safeSetCell(cells, fieldIdSafe, {
						fieldId: fieldIdSafe,
						content,
						aiGenerated,
						isAIGenerated: aiGenerated,
						feedback: undefined
					});
				});

				// Create front and back cells for display
				const frontField = templateFields.find((f) => f.isInput) || templateFields[0];
				const backField = templateFields.find((f) => !f.isInput) || templateFields[1];

				const frontFieldId = frontField?.id ? String(frontField.id) : 'front';
				const backFieldId = backField?.id ? String(backField.id) : 'back';

				newRows.push({
					id: existingRow?.id || crypto.randomUUID(),
					front: safeGetCell(cells, frontFieldId) || {
						fieldId: 'front',
						content: '',
						aiGenerated: false,
						isAIGenerated: false,
						feedback: undefined
					},
					back: safeGetCell(cells, backFieldId) || {
						fieldId: 'back',
						content: '',
						aiGenerated: false,
						isAIGenerated: false,
						feedback: undefined
					},
					cells,
					isSelected: false,
					status: 'ai-generated' as const,
					metadata: {
						createdAt: new Date(),
						aiGenerated: true,
						saved: false
					}
				});
			}

			flashcardRows = newRows;
			updateSession();
		} catch (error) {
			console.error('AI generation failed:', error);
			generationError = error instanceof Error ? error.message : 'Failed to generate cards';
		} finally {
			isGenerating = false;
		}
	}

	async function regenerateRowWithAI(rowId: string) {
		const row = flashcardRows.find((r) => r.id === rowId);
		if (!row) return;

		isGenerating = true;
		generationError = null;

		try {
			// Create generation items for non-input fields of this specific row
			const items: GenerationFieldData[] = [];

			templateFields.forEach((field) => {
				if (field.isInput) return; // Skip input fields

				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);

				// Get input field content for context
				const inputFields = templateFields.filter((f) => f.isInput);
				const inputContent = inputFields
					.map((inputField) => {
						const inputFieldId = String(inputField.id);
						const inputCell = safeGetCell(row.cells, inputFieldId);
						return inputCell?.content || '';
					})
					.join(', ');

				items.push({
					fieldId: field.id,
					value: inputContent || cell?.content || field.label || field.name
				});
			});

			if (items.length === 0) {
				toast.error('No fields to regenerate for this row');
				return;
			}

			// Build request using the service helper
			const request = aiService.buildRequest(template, items, batchContext.trim());

			// Call AI service
			const response = await aiService.generate(request);

			if (response.error) {
				toast.error(`Generation failed: ${response.error}`);
				return;
			}

			// Update the specific row with regenerated content
			flashcardRows = flashcardRows.map((r) => {
				if (r.id === rowId) {
					const updatedCells = { ...r.cells };
					let wasUpdated = false;

					// Get the first (and should be only) flashcard from the response
					const generatedFlashcard = response.flashcards[0];

					if (generatedFlashcard && generatedFlashcard.fields) {
						templateFields.forEach((field) => {
							if (field.isInput) return;

							// Find the generated field for this field ID
							const generatedField = generatedFlashcard.fields.find((f) => f.fieldId === field.id);

							if (generatedField && generatedField.value) {
								const fieldIdSafe = String(field.id);
								safeSetCell(updatedCells, fieldIdSafe, {
									fieldId: fieldIdSafe,
									content: generatedField.value,
									aiGenerated: true,
									isAIGenerated: true,
									feedback: undefined
								});
								wasUpdated = true;
							}
						});
					}

					if (wasUpdated) {
						// Update front and back cells
						const frontField = templateFields.find((f) => f.isInput) || templateFields[0];
						const backField = templateFields.find((f) => !f.isInput) || templateFields[1];

						const frontFieldId = frontField?.id ? String(frontField.id) : 'front';
						const backFieldId = backField?.id ? String(backField.id) : 'back';

						return {
							...r,
							cells: updatedCells,
							front: safeGetCell(updatedCells, frontFieldId) || r.front,
							back: safeGetCell(updatedCells, backFieldId) || r.back,
							status: 'ai-generated' as const,
							metadata: {
								...r.metadata,
								aiGenerated: true,
								saved: r.metadata.saved || false
							}
						};
					}
				}
				return r;
			});

			updateSession();
			toast.success('Row content regenerated successfully');
		} catch (error) {
			console.error('AI regeneration failed:', error);

			if (error instanceof AIServiceException) {
				generationError = error.error.message;
				toast.error(error.error.message);
			} else {
				generationError =
					error instanceof Error ? error.message : 'Failed to regenerate row content';
				toast.error('Failed to regenerate row content');
			}
		} finally {
			isGenerating = false;
		}
	}

	function previewCard(rowId: string) {
		const row = flashcardRows.find((r) => r.id === rowId);
		if (!row) return;

		previewRowData = row;
		previewModalOpen = true;
	}

	function provideFeedback(rowId: string, fieldId: string, rating: 'positive' | 'negative') {
		flashcardRows = flashcardRows.map((row) => {
			if (row.id === rowId) {
				const fieldIdSafe = String(fieldId);
				const existingCell = safeGetCell(row.cells, fieldIdSafe);
				if (existingCell) {
					const updatedCells = { ...row.cells };
					safeSetCell(updatedCells, fieldIdSafe, {
						...existingCell,
						feedback: {
							rating,
							comment: '',
							timestamp: new Date().toISOString()
						}
					});
					return {
						...row,
						cells: updatedCells
					};
				}
			}
			return row;
		});
		updateSession();
	}

	// Convert FlashcardRow to preview data format
	function convertRowToPreviewData(row: FlashcardRow): Record<string, unknown> {
		const previewData: Record<string, unknown> = {};

		// Convert cells to field label-based data (Field interface uses 'label', not 'name')
		templateFields.forEach((field) => {
			const fieldIdSafe = String(field.id);
			const cell = safeGetCell(row.cells, fieldIdSafe);
			if (cell) {
				previewData[field.label] = cell.content;
			}
		});

		return previewData;
	}
</script>

<div class="space-y-6">
	<!-- Batch Context Input -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<SparklesIcon class="h-5 w-5" />
				AI Batch Generation
			</Card.Title>
			<Card.Description>
				Provide context for AI to generate multiple flashcards at once.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<Textarea
				bind:value={batchContext}
				placeholder="Enter topic, lesson content, or specific terms you want to create flashcards for..."
				rows={3}
				class="min-h-[80px]"
			/>
			<div class="flex gap-2">
				<Button
					onclick={generateBatchCards}
					disabled={isGenerating || !batchContext.trim()}
					class="gap-2"
				>
					{#if isGenerating}
						<RefreshIcon class="h-4 w-4 animate-spin" />
						Generating...
					{:else}
						<SparklesIcon class="h-4 w-4" />
						Generate Cards
					{/if}
				</Button>

				{#if eligibleInputCards().length > 0}
					<Button
						variant="outline"
						onclick={generateForInputCards}
						disabled={isGenerating}
						class="gap-2"
					>
						{#if isGenerating}
							<RefreshIcon class="h-4 w-4 animate-spin" />
							Generating...
						{:else}
							<SparklesIcon class="h-4 w-4" />
							Generate Fields for Input Cards ({eligibleInputCards().length})
						{/if}
					</Button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Error Display -->
	{#if generationError}
		<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
			<p class="text-destructive text-sm font-medium">AI Generation Error:</p>
			<p class="text-destructive text-sm">{generationError}</p>
		</div>
	{/if}

	{#if saveError}
		<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
			<p class="text-destructive text-sm font-medium">Save Error:</p>
			<p class="text-destructive text-sm">{saveError}</p>
		</div>
	{/if}

	<!-- Flashcard Table -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div class="space-y-2">
					<Card.Title>Flashcard Editor</Card.Title>
					<Card.Description>
						Edit generated cards or create new ones manually. Each row represents one flashcard.
					</Card.Description>
				</div>

				<div class="flex gap-2">
					{#if eligibleInputCards().length > 0}
						<Button
							variant="default"
							onclick={generateForInputCards}
							disabled={isGenerating}
							class="gap-2"
						>
							{#if isGenerating}
								<RefreshIcon class="h-4 w-4 animate-spin" />
								Generating...
							{:else}
								<SparklesIcon class="h-4 w-4" />
								Generate Fields ({eligibleInputCards().length})
							{/if}
						</Button>
					{/if}

					<Button variant="outline" onclick={addRow} class="gap-2">
						<PlusIcon class="h-4 w-4" />
						Add flashcard
					</Button>

					<!-- Save Actions -->
					{#if readyCards().length > 0}
						<Button
							variant="default"
							onclick={saveReadyCards}
							disabled={isSaving || !deck}
							class="gap-2"
						>
							{#if isSaving}
								<RefreshIcon class="h-4 w-4 animate-spin" />
								Saving...
							{:else}
								Save Ready Cards ({readyCards().length})
							{/if}
						</Button>
					{/if}

					<Button variant="outline" onclick={saveDraft} class="gap-2">Save Draft</Button>

					<Button variant="outline" onclick={clearAll} class="gap-2">Clear All</Button>
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-12">#</Table.Head>
							{#each templateFields as field (field.id)}
								<Table.Head>
									{field.label}
									{#if field.isInput}
										<Badge variant="secondary" class="ml-2">Front</Badge>
									{:else}
										<Badge variant="outline" class="ml-2">Back</Badge>
									{/if}
								</Table.Head>
							{/each}
							<Table.Head class="w-24">Status</Table.Head>
							<Table.Head class="w-32">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each flashcardRows as row, index (row.id)}
							<Table.Row>
								<Table.Cell class="font-medium">
									{index + 1}
								</Table.Cell>
								{#each templateFields as field (field.id)}
									<Table.Cell class="max-w-xs">
										<div class="space-y-2">
											{#if field.description && field.description.length > 50}
												<Textarea
													bind:value={row.cells[field.id].content}
													oninput={(e: Event) =>
														updateRowCell(
															row.id,
															field.id,
															(e.currentTarget as HTMLTextAreaElement).value
														)}
													placeholder={`Enter ${field.label.toLowerCase()}...`}
													rows={2}
													class="min-h-[60px]"
												/>
											{:else}
												<Input
													bind:value={row.cells[field.id].content}
													oninput={(e: Event) =>
														updateRowCell(
															row.id,
															field.id,
															(e.currentTarget as HTMLInputElement).value
														)}
													placeholder={`Enter ${field.label.toLowerCase()}...`}
												/>
											{/if}

											<!-- AI Generation Indicator and Feedback -->
											{#if row.cells[field.id].isAIGenerated}
												<div class="flex items-center justify-between">
													<Badge variant="secondary" class="text-xs">AI Generated</Badge>
													<div class="flex gap-1">
														<Button
															variant="ghost"
															size="sm"
															onclick={() => provideFeedback(row.id, field.id, 'positive')}
															class="h-6 w-6 p-0"
														>
															<ThumbUpIcon class="h-3 w-3" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onclick={() => provideFeedback(row.id, field.id, 'negative')}
															class="h-6 w-6 p-0"
														>
															<ThumbDownIcon class="h-3 w-3" />
														</Button>
													</div>
												</div>
											{/if}
										</div>
									</Table.Cell>
								{/each}
								<Table.Cell>
									{@const isComplete = templateFields.every((field) => {
										const fieldIdSafe = String(field.id);
										const cell = safeGetCell(row.cells, fieldIdSafe);
										return cell && cell.content.trim().length > 0;
									})}
									{@const hasSaved = row.status === 'saved' || row.metadata?.saved}

									{#if hasSaved}
										<Badge variant="default" class="gap-1">📝 Saved</Badge>
									{:else if isComplete}
										<Badge variant="secondary" class="gap-1">✅ Ready</Badge>
									{:else if row.status === 'ai-generated'}
										<Badge variant="outline" class="gap-1">🤖 AI Generated</Badge>
									{:else}
										<Badge variant="outline" class="gap-1">⏳ Incomplete</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => regenerateRowWithAI(row.id)}
											class="h-8 w-8 p-0"
											title="Regenerate with AI"
										>
											<RefreshIcon class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onclick={() => previewCard(row.id)}
											class="h-8 w-8 p-0"
											title="Preview card"
										>
											<EyeIcon class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onclick={() => removeRow(row.id)}
											class="h-8 w-8 p-0"
											title="Delete row"
											disabled={flashcardRows.length <= 1}
										>
											<TrashIcon class="h-4 w-4" />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Flashcard Preview Modal -->
{#if previewRowData}
	<FlashcardPreview
		{template}
		data={convertRowToPreviewData(previewRowData)}
		deckName={deck?.name || 'Selected Deck'}
		bind:open={previewModalOpen}
		onClose={() => {
			previewModalOpen = false;
			previewRowData = null;
		}}
	/>
{/if}
