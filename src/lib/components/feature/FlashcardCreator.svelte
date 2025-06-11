<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toast } from 'svelte-sonner';
	import DeckSelector from './DeckSelector.svelte';
	import TemplateSelector from './TemplateSelector.svelte';
	import FlashcardPreview from './FlashcardPreview.svelte';
	import SparklesIcon from '@tabler/icons-svelte/icons/sparkles';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import EditIcon from '@tabler/icons-svelte/icons/edit';
	import SaveIcon from '@tabler/icons-svelte/icons/device-floppy';
	import BookIcon from '@tabler/icons-svelte/icons/book';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import ThumbUpIcon from '@tabler/icons-svelte/icons/thumb-up';
	import ThumbDownIcon from '@tabler/icons-svelte/icons/thumb-down';
	import DotsIcon from '@tabler/icons-svelte/icons/dots';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import ClockIcon from '@tabler/icons-svelte/icons/clock';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import type {
		FlashcardRow,
		FlashcardCell,
		GenerationFieldData
	} from '$lib/types/flashcard-creator.js';
	import { aiService, AIServiceException } from '$lib/services/ai.service.js';
	import { flashcardService } from '$lib/services/flashcard.service.js';

	interface Props {
		templates: Template[];
		fields: Field[];
		initialTemplate?: Template;
		availableDecks: Deck[];
		onDataRefreshNeeded?: () => Promise<void>;
	}

	let { templates, fields, initialTemplate, availableDecks, onDataRefreshNeeded }: Props = $props();

	// Single-step state management
	let selectedTemplate = $state<Template | null>(initialTemplate || null);
	let selectedDeck = $state<Deck | null>(null);
	let batchContext = $state<string>('');
	let flashcardRows = $state<FlashcardRow[]>([]);

	// Modal states
	let showTemplateSelector = $state(false);
	let showDeckSelector = $state(false);
	let previewModalOpen = $state(false);
	let previewRowData = $state<FlashcardRow | null>(null);

	// Loading states
	let isGenerating = $state(false);
	let isSaving = $state(false);

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

	// Get status text for tooltips
	function getStatusText(row: FlashcardRow): string {
		const isComplete = templateFields().every((field) => {
			const fieldIdSafe = String(field.id);
			const cell = safeGetCell(row.cells, fieldIdSafe);
			return cell && cell.content.trim().length > 0;
		});
		const hasSaved = row.status === 'saved' || row.metadata?.saved;

		if (hasSaved) {
			return 'Saved';
		} else if (isComplete) {
			return 'Complete';
		} else if (row.status === 'ai-generated') {
			return 'AI Generated';
		} else {
			return 'Pending';
		}
	}

	// Get template fields
	function templateFields(): Field[] {
		if (!selectedTemplate) {
			console.log('🔍 templateFields: No selectedTemplate');
			return [];
		}

		console.log('🔍 templateFields: selectedTemplate.id =', selectedTemplate.id);
		console.log('🔍 templateFields: fields.length =', fields.length);
		console.log('🔍 templateFields: fields =', fields);

		const filteredFields = fields
			.filter((field) => field.template === selectedTemplate!.id)
			.sort((a, b) => (a.order || 0) - (b.order || 0));

		console.log('🔍 templateFields: filteredFields =', filteredFields);
		return filteredFields;
	}

	// Count ready cards
	function readyCards(): FlashcardRow[] {
		const tFields = templateFields();
		return flashcardRows.filter((row) =>
			tFields.every((field: Field) => {
				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);
				return cell && cell.content.trim();
			})
		);
	}

	// Count eligible cards for input field generation
	function eligibleInputCards(): FlashcardRow[] {
		const tFields = templateFields();
		return flashcardRows.filter((row) => {
			// Check if the row has at least one input field with content
			const hasInputContent = tFields.some((field) => {
				if (!field.isInput) return false;
				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);
				return cell && cell.content.trim().length > 0;
			});

			// Check if the row has at least one non-input field that's empty
			const hasEmptyOutputFields = tFields.some((field) => {
				if (field.isInput) return false;
				const fieldIdSafe = String(field.id);
				const cell = safeGetCell(row.cells, fieldIdSafe);
				return !cell || !cell.content.trim();
			});

			return hasInputContent && hasEmptyOutputFields;
		});
	}

	// Initialize with empty rows if none exist
	$effect(() => {
		if (selectedTemplate && flashcardRows.length === 0) {
			flashcardRows = [createEmptyRow()];
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
		// Refresh data when opening template selector in case new templates were created
		if (onDataRefreshNeeded) {
			onDataRefreshNeeded();
		}
	}

	// Deck selection handlers
	function handleDeckSelect(deck: Deck) {
		selectedDeck = deck;
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
	function createEmptyRow(): FlashcardRow {
		const cells: Record<string, FlashcardCell> = {};
		const tFields = templateFields();

		tFields.forEach((field) => {
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
		const frontField = tFields.find((f) => f.isInput) || tFields[0];
		const backField = tFields.find((f) => !f.isInput) || tFields[1];

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

	function addNewRow() {
		if (!selectedTemplate) return;
		flashcardRows = [...flashcardRows, createEmptyRow()];
	}

	function addRow() {
		flashcardRows = [...flashcardRows, createEmptyRow()];
	}

	function removeRow(rowId: string) {
		flashcardRows = flashcardRows.filter((row) => row.id !== rowId);
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
	}

	// Save ready cards to the selected deck
	async function saveReadyCards() {
		if (!selectedDeck) {
			toast.error('Please select a deck before saving');
			return;
		}

		const cardsToSave = readyCards();
		if (cardsToSave.length === 0) {
			toast.error('No ready cards to save. Please complete at least one flashcard.');
			return;
		}

		isSaving = true;

		try {
			// Save flashcards to PocketBase using the flashcard service
			const savedCards = await flashcardService.createFromRows(
				cardsToSave,
				selectedDeck.id,
				selectedTemplate!.id
			);

			// Mark saved cards as saved in the session
			flashcardRows = flashcardRows.map((row) => {
				if (cardsToSave.includes(row)) {
					return {
						...row,
						status: 'saved' as const,
						metadata: {
							...row.metadata,
							saved: true,
							savedAt: new Date().toISOString()
						}
					};
				}
				return row;
			});

			toast.success(`${savedCards.length} cards saved to ${selectedDeck.name}`);

			// Return the saved cards for parent component handling
			return savedCards;
		} catch (error) {
			console.error('Error saving flashcards:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to save flashcards';
			toast.error(errorMessage);
			throw error;
		} finally {
			isSaving = false;
		}
	}

	// Clear all cards and reset to default state
	function clearAll() {
		flashcardRows = [createEmptyRow()];
		batchContext = '';
		toast.info('All cards cleared');
	}

	// AI generation for input cards
	async function generateForInputCards() {
		const eligibleCards = eligibleInputCards();

		if (eligibleCards.length === 0) {
			toast.error('No eligible cards found. Cards need input content and empty output fields.');
			return;
		}

		isGenerating = true;

		try {
			// Create generation items only for input fields in eligible cards
			const items: GenerationFieldData[] = [];

			eligibleCards.forEach((row: FlashcardRow) => {
				// Find the actual index of this row in the flashcardRows array
				const actualRowIndex = flashcardRows.findIndex((r) => r.id === row.id);
				console.log(`🔍 Processing eligible card at index ${actualRowIndex}:`, row.id);

				// Get input and output fields for analysis
				const inputFields = templateFields().filter((f) => f.isInput);
				const outputFields = templateFields().filter((f) => !f.isInput);

				console.log(`📋 Template fields analysis for flashcard ${actualRowIndex}:`);
				console.log(
					`  - Input fields (${inputFields.length}):`,
					inputFields.map((f) => ({ id: f.id, label: f.label, isInput: f.isInput }))
				);
				console.log(
					`  - Output fields (${outputFields.length}):`,
					outputFields.map((f) => ({ id: f.id, label: f.label, isInput: f.isInput }))
				);

				// Check if this card has empty output fields that need generation
				const hasEmptyOutputFields = outputFields.some((field) => {
					const fieldIdSafe = String(field.id);
					const cell = safeGetCell(row.cells, fieldIdSafe);
					return !cell || !cell.content.trim();
				});

				if (!hasEmptyOutputFields) {
					console.log(
						`⏭️ Skipping flashcard ${actualRowIndex} - all output fields already have content`
					);
					return;
				}

				// Process each input field and send only its data
				inputFields.forEach((field) => {
					const fieldIdSafe = String(field.id);
					const cell = safeGetCell(row.cells, fieldIdSafe);
					const inputContent = cell?.content || '';

					// Only process if we have input content
					if (!inputContent.trim()) {
						console.log(`⏭️ Skipping input field ${field.id} - no content`);
						return;
					}

					console.log(
						`✅ Adding input field ${field.id} (${field.label}) with content:`,
						inputContent
					);
					items.push({
						fieldId: field.id,
						flashcardId: actualRowIndex, // Use actual array index as flashcard ID for mapping responses back
						value: inputContent // Send the actual input field content
					});
				});
			});

			console.log(`🚀 Total input items to send:`, items.length, items);

			if (items.length === 0) {
				toast.error('No input fields with content found for generation.');
				return;
			}

			// Build request using the service helper - now only sending input field data
			const request = aiService.buildRequest(selectedTemplate!, items, batchContext.trim());

			// Call the unified AI service
			console.log('🚀 Sending AI request with input fields only:', request);
			const response = await aiService.generate(request);
			console.log('🎯 AI response received:', response);

			if (response.error) {
				toast.error(`Generation failed: ${response.error}`);
				return;
			}

			// Validate response structure
			if (!response.fields || !Array.isArray(response.fields)) {
				console.error('Invalid response structure:', response);
				toast.error('Invalid response from AI service');
				return;
			}

			// Update the flashcard rows with generated content using flashcardId mapping
			// The response should contain generated output fields for each flashcard
			console.log('🔄 Processing response for eligible cards:', eligibleCards.length);
			flashcardRows = flashcardRows.map((row, rowIndex) => {
				// Only process eligible cards
				if (!eligibleCards.includes(row)) {
					return row;
				}

				console.log(`🔍 Processing row ${rowIndex}...`);
				const updatedCells = { ...row.cells };
				let wasUpdated = false;

				// Find all generated fields for this specific row using flashcardId (array index)
				const generatedFields = response.fields.filter((field) => field.flashcardId === rowIndex);
				console.log(
					`🎯 Found ${generatedFields.length} generated fields for row ${rowIndex}:`,
					generatedFields
				);

				if (generatedFields.length > 0) {
					console.log(
						`📋 Processing ${generatedFields.length} generated fields for row ${rowIndex}`
					);
					// For this eligible row, process all generated fields (should be output fields)
					generatedFields.forEach((generatedField) => {
						// Find the corresponding template field
						const templateField = templateFields().find((f) => f.id === generatedField.fieldId);

						if (!templateField) {
							console.log(
								`⚠️ Template field not found for generated field ${generatedField.fieldId}`
							);
							return;
						}

						// Skip input fields - we should only receive output fields in response
						if (templateField.isInput) {
							console.log(`⚠️ Unexpected input field in response: ${generatedField.fieldId}`);
							return;
						}

						const fieldIdSafe = String(generatedField.fieldId);
						const currentCell = safeGetCell(row.cells, fieldIdSafe);

						// Only update if field is currently empty (safety check)
						if (currentCell && currentCell.content.trim()) {
							console.log(
								`⏭️ Skipping field ${generatedField.fieldId} - already has content:`,
								currentCell.content
							);
							return;
						}

						if (generatedField.value) {
							console.log(
								`✅ Updating field ${generatedField.fieldId} with value:`,
								generatedField.value
							);
							safeSetCell(updatedCells, fieldIdSafe, {
								fieldId: fieldIdSafe,
								content: generatedField.value,
								aiGenerated: true,
								isAIGenerated: true,
								feedback: undefined
							});
							wasUpdated = true;
						} else {
							console.log(`❌ No generated content for field ${generatedField.fieldId}`);
						}
					});
				} else {
					console.log(`❌ No generated fields found for row ${rowIndex}`);
				}

				if (wasUpdated) {
					// Update front and back cells
					const frontField = templateFields().find((f) => f.isInput) || templateFields()[0];
					const backField = templateFields().find((f) => !f.isInput) || templateFields()[1];

					const frontFieldId = frontField?.id ? String(frontField.id) : 'front';
					const backFieldId = backField?.id ? String(backField.id) : 'back';

					const updatedRow = {
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

					console.log(`🎉 Updated row ${rowIndex}:`, updatedRow);
					return updatedRow;
				}

				return row;
			});
		} catch (error) {
			console.error('AI generation for input cards failed:', error);

			if (error instanceof AIServiceException) {
				toast.error(error.error.message);
			} else {
				toast.error('Failed to generate fields for input cards');
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

	// Feedback functionality
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
	}

	// Convert FlashcardRow to preview data format
	function convertRowToPreviewData(row: FlashcardRow): Record<string, unknown> {
		const previewData: Record<string, unknown> = {};

		// Convert cells to field label-based data
		templateFields().forEach((field) => {
			const fieldIdSafe = String(field.id);
			const cell = safeGetCell(row.cells, fieldIdSafe);
			if (cell) {
				// Convert field label to lowercase with underscores (matching template placeholder format)
				const labelKey = field.label.toLowerCase().replace(/\s+/g, '_');
				previewData[labelKey] = cell.content;
			}
		});

		return previewData;
	}

	// Save draft
	function saveDraft() {
		// TODO: Implement draft saving
		toast.info('Draft saved');
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
			<Card.Content>
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
			<Card.Content>
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

					<!-- Flashcard Table -->
					<div class="space-y-6">
						<!-- Flashcard Table -->

						<div class="flex items-center justify-between">
							<div class="space-y-2">
								<p>Flashcard Editor</p>
								<p>
									Edit generated cards or create new ones manually. Each row represents one
									flashcard.
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="w-8">#</Table.Head>
									{#each templateFields() as field (field.id)}
										<Table.Head>
											{field.label}
											<Badge variant="secondary" class="ml-2">{field.language}</Badge>
										</Table.Head>
									{/each}
									<Table.Head class="w-8">Status</Table.Head>
									<Table.Head class="w-8"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each flashcardRows as row, index (row.id)}
									<Table.Row class="hover:rounded-md">
										<Table.Cell class="font-medium">
											{index + 1}
										</Table.Cell>
										{#each templateFields() as field (field.id)}
											<Table.Cell class="max-w-xs">
												<div class="flex items-start gap-2">
													<div class="flex-1">
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
															class={`min-h-[60px] resize-none ${
																row.cells[field.id].isAIGenerated
																	? 'border-blue-300 bg-blue-50/50 focus-visible:ring-blue-500'
																	: ''
															}`}
														/>
													</div>

													<!-- AI Feedback Buttons -->
													{#if row.cells[field.id].isAIGenerated}
														<div class="flex flex-col gap-1 pt-1">
															<Button
																variant="ghost"
																size="sm"
																onclick={() => provideFeedback(row.id, field.id, 'positive')}
																class="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
																title="Rate as good"
															>
																<ThumbUpIcon class="h-3 w-3" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onclick={() => provideFeedback(row.id, field.id, 'negative')}
																class="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
																title="Rate as poor"
															>
																<ThumbDownIcon class="h-3 w-3" />
															</Button>
														</div>
													{/if}
												</div>
											</Table.Cell>
										{/each}
										<Table.Cell>
											{@const isComplete = templateFields().every((field) => {
												const fieldIdSafe = String(field.id);
												const cell = safeGetCell(row.cells, fieldIdSafe);
												return cell && cell.content.trim().length > 0;
											})}
											{@const hasSaved = row.status === 'saved' || row.metadata?.saved}

											<Tooltip.Root>
												<Tooltip.Trigger>
													{#if hasSaved}
														<Badge variant="default" class="gap-1">
															<SaveIcon class="h-3 w-3" />
														</Badge>
													{:else if isComplete}
														<Badge variant="secondary" class="gap-1">
															<CheckIcon class="h-3 w-3" />
														</Badge>
													{:else if row.status === 'ai-generated'}
														<Badge variant="outline" class="gap-1">
															<SparklesIcon class="h-3 w-3" />
														</Badge>
													{:else}
														<Badge variant="outline" class="gap-1">
															<ClockIcon class="h-3 w-3" />
														</Badge>
													{/if}
												</Tooltip.Trigger>
												<Tooltip.Content>
													{getStatusText(row)}
												</Tooltip.Content>
											</Tooltip.Root>
										</Table.Cell>
										<Table.Cell>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													{#snippet child({ props })}
														<Button {...props} variant="ghost" size="sm" class="h-8 w-8 p-0">
															<DotsIcon class="h-4 w-4" />
															<span class="sr-only">Open menu</span>
														</Button>
													{/snippet}
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end" class="w-48">
													<DropdownMenu.Item onclick={() => previewCard(row.id)}>
														<EyeIcon class="mr-2 h-4 w-4" />
														Preview card
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														onclick={() => removeRow(row.id)}
														disabled={flashcardRows.length <= 1}
														class="text-destructive focus:text-destructive"
													>
														<TrashIcon class="mr-2 h-4 w-4" />
														Remove row
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</Card.Content>
				<Card.Footer class="flex items-center justify-start gap-2">
					<Button variant="outline" onclick={addRow} class="gap-2">
						<PlusIcon class="h-4 w-4" />
						Add flashcard
					</Button>

					<Button variant="destructive" onclick={clearAll} class="gap-2">Clear All</Button>

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
				</Card.Footer>
			</Card.Root>

			<!-- Unified Action Bar -->
			<Card.Root>
				<Card.Content>
					<div class="flex items-center justify-end">
						<div class="flex gap-2">
							<Button variant="outline" onclick={saveDraft} class="gap-2">
								<SaveIcon class="h-4 w-4" />
								Save Draft
							</Button>

							<!-- Save Actions -->
							<Button
								variant="default"
								onclick={saveReadyCards}
								disabled={isSaving || !selectedDeck || readyCards().length === 0}
								class="gap-2"
							>
								{#if isSaving}
									<RefreshIcon class="h-4 w-4 animate-spin" />
									Saving...
								{:else}
									Save Flashcards ({readyCards().length})
								{/if}
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
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
/>

<!-- Flashcard Preview Modal -->
{#if previewRowData && selectedTemplate}
	<FlashcardPreview
		template={selectedTemplate}
		data={convertRowToPreviewData(previewRowData)}
		deckName={selectedDeck?.name || 'Selected Deck'}
		bind:open={previewModalOpen}
		onClose={() => {
			previewModalOpen = false;
			previewRowData = null;
		}}
	/>
{/if}
