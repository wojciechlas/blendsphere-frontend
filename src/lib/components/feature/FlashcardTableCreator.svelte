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
		AIGenerationItem
	} from '$lib/types/flashcard-creator.js';
	import { aiService } from '$lib/services/ai.service.js';

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
		// eslint-disable-next-line security/detect-object-injection
		return Object.prototype.hasOwnProperty.call(cells, fieldId) ? cells[fieldId] : undefined;
	}

	function safeSetCell(
		cells: Record<string, FlashcardCell>,
		fieldId: string,
		value: FlashcardCell
	): void {
		if (typeof fieldId === 'string' && fieldId.length > 0) {
			// eslint-disable-next-line security/detect-object-injection
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

	// Initialize with empty rows if none exist
	$effect(() => {
		if (flashcardRows.length === 0) {
			flashcardRows = [createEmptyRow()];
		}
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
				aiGenerated: false
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
			const items: AIGenerationItem[] = [];

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
						id: `card_${i}_${field.id}`, // Unique ID for mapping back results
						instructions: `${batchContext.trim()}. Generate content for ${field.label || field.name} field for flashcard ${i + 1}.`,
						field_name: field.name,
						field_type: field.type,
						field_description: field.description || undefined,
						current_content: existingContent || undefined,
						overwrite: true // For batch generation, we want to overwrite
					});
				});
			}

			// Call the unified AI service
			const response = await aiService.generate({
				templateId: template.id,
				items: items
			});

			// Process the results and update flashcard rows
			const newRows: FlashcardRow[] = [];

			for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
				const existingRow = flashcardRows[cardIndex];
				const cells: Record<string, FlashcardCell> = {};

				// Populate cells with AI-generated content
				templateFields.forEach((field) => {
					const resultId = `card_${cardIndex}_${field.id}`;
					const result = response.results.find((r) => r.id === resultId);

					let content = '';
					let aiGenerated = false;
					const fieldIdSafe = String(field.id);

					if (result?.success && result.content) {
						content = result.content;
						aiGenerated = true;
					} else if (result?.error) {
						console.warn(`Failed to generate content for ${field.label}:`, result.error);
						// Keep existing content if generation failed
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
						aiGenerated: true
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

		// TODO: Implement single row AI regeneration
		console.log('Regenerating row:', rowId);
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
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Error Display -->
	{#if generationError}
		<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
			<p class="text-destructive text-sm">{generationError}</p>
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

				<Button variant="outline" onclick={addRow} class="gap-2">
					<PlusIcon class="h-4 w-4" />
					Add flashcard
				</Button>
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
