<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import UploadIcon from '@tabler/icons-svelte/icons/upload';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import XIcon from '@tabler/icons-svelte/icons/x';
	import FileTextIcon from '@tabler/icons-svelte/icons/file-text';
	import SparklesIcon from '@tabler/icons-svelte/icons/sparkles';
	import AlertTriangleIcon from '@tabler/icons-svelte/icons/alert-triangle';
	import RotateIcon from '@tabler/icons-svelte/icons/rotate-2';
	import { flashcardService, type Flashcard } from '$lib/services/flashcard.service.js';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { FieldData } from '$lib/schemas/field.schemas.js';

	interface Props {
		deck: Deck;
		template: Template & { fields: FieldData[] }; // Template with populated fields
		onComplete?: (createdCount: number) => void;
		onCancel?: () => void;
		onBack?: () => void;
	}

	type FlashcardCreate = Omit<Flashcard, 'id' | 'created' | 'updated'>;

	let { deck, template, onComplete, onCancel, onBack }: Props = $props();

	// Helper functions for safe object access
	function safeSetField(fieldData: Record<string, unknown>, fieldId: string, value: unknown): void {
		if (typeof fieldId === 'string' && fieldId.length > 0) {
			// eslint-disable-next-line security/detect-object-injection
			fieldData[fieldId] = value;
		}
	}

	// Bulk creation modes
	type BulkMode = 'clipboard' | 'csv' | 'ai';
	let selectedMode = $state<BulkMode>('clipboard');

	// Input data
	let clipboardData = $state('');
	let csvFile = $state<File | null>(null);
	let aiPrompt = $state('');

	// Processing state
	let isProcessing = $state(false);
	let processingProgress = $state(0);
	let processingTotal = $state(0);
	let processingCurrent = $state(0);
	let processingStatus = $state('');

	// Results
	let processedCards = $state<Array<{ success: boolean; data?: FlashcardCreate; error?: string }>>(
		[]
	);
	let createdCards = $state<string[]>([]);

	// Error handling
	let errors = $state<string[]>([]);

	// Parse clipboard/CSV data
	function parseTextData(text: string): string[][] {
		const lines = text.trim().split('\n');
		return lines.map((line) => {
			// Handle both comma and tab separated values
			if (line.includes('\t')) {
				return line.split('\t').map((cell) => cell.trim());
			} else {
				return line.split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
			}
		});
	}

	// Handle file upload
	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && file.type === 'text/csv') {
			csvFile = file;
		} else {
			errors = [...errors, 'Please select a valid CSV file'];
		}
	}

	// Read CSV file
	async function readCSVFile(): Promise<string[][]> {
		if (!csvFile) return [];

		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				resolve(parseTextData(text));
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			if (csvFile) {
				reader.readAsText(csvFile);
			}
		});
	}

	// Generate cards with AI (mock implementation)
	async function generateWithAI(prompt: string): Promise<string[][]> {
		// Mock AI generation - replace with actual FastAPI call
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Use prompt for more realistic mock (though it's still mock)
		console.log('Generating cards for prompt:', prompt);

		// Mock response based on template fields
		const mockCards = [
			['Hello', 'Hola', 'greeting'],
			['Goodbye', 'Adiós', 'greeting'],
			['Thank you', 'Gracias', 'politeness'],
			['Please', 'Por favor', 'politeness'],
			['Yes', 'Sí', 'basic']
		];

		return mockCards;
	}

	// Convert parsed data to flashcard format
	function mapDataToFlashcard(row: string[]): FlashcardCreate | null {
		try {
			const fieldData: Record<string, unknown> = {};
			template.fields.forEach((field: FieldData, index: number) => {
				if (index < row.length && field.id && typeof field.id === 'string') {
					const value = row[index];
					if (value) {
						const fieldId = String(field.id);
						switch (field.type) {
							case 'TEXT':
								safeSetField(fieldData, fieldId, value);
								break;
							case 'IMAGE':
								// For bulk import, assume it's a URL or path
								safeSetField(fieldData, fieldId, value);
								break;
							case 'AUDIO':
								// For bulk import, assume it's a URL or path
								safeSetField(fieldData, fieldId, value);
								break;
							default:
								safeSetField(fieldData, fieldId, value);
						}
					}
				}
			});

			return {
				deck: deck.id,
				template: template.id,
				data: fieldData,
				state: 'NEW' as const
			};
		} catch (err) {
			console.error('Error mapping data to flashcard:', err);
			return null;
		}
	}

	// Process bulk creation
	async function processBulkImport() {
		errors = [];
		processedCards = [];
		createdCards = [];
		isProcessing = true;
		processingProgress = 0;
		processingCurrent = 0;

		try {
			let data: string[][] = [];

			// Get data based on selected mode
			switch (selectedMode) {
				case 'clipboard':
					if (!clipboardData.trim()) {
						throw new Error('Please enter data to import');
					}
					data = parseTextData(clipboardData);
					break;
				case 'csv':
					if (!csvFile) {
						throw new Error('Please select a CSV file');
					}
					data = await readCSVFile();
					break;
				case 'ai':
					if (!aiPrompt.trim()) {
						throw new Error('Please enter a prompt for AI generation');
					}
					processingStatus = 'Generating content with AI...';
					data = await generateWithAI(aiPrompt);
					break;
			}

			if (data.length === 0) {
				throw new Error('No data to process');
			}

			processingTotal = data.length;
			processingStatus = 'Creating flashcards...';

			// Process each row
			for (let i = 0; i < data.length; i++) {
				processingCurrent = i + 1;
				processingProgress = Math.round(((i + 1) / data.length) * 100);

				const row = data[i];
				const flashcardData = mapDataToFlashcard(row);

				if (!flashcardData) {
					processedCards = [
						...processedCards,
						{
							success: false,
							error: `Invalid data format in row ${i + 1}`
						}
					];
					continue;
				}

				try {
					const createdCard = await flashcardService.create(flashcardData);
					processedCards = [
						...processedCards,
						{
							success: true,
							data: flashcardData
						}
					];
					createdCards = [...createdCards, createdCard.id];
				} catch (_error) {
					processedCards = [
						...processedCards,
						{
							success: false,
							error: `Failed to create card: ${_error instanceof Error ? _error.message : 'Unknown error'}`
						}
					];
				}

				// Small delay to show progress
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			processingStatus = 'Complete';
		} catch (error) {
			errors = [...errors, error instanceof Error ? error.message : 'An unexpected error occurred'];
		} finally {
			isProcessing = false;
		}
	}

	// Complete creation
	function handleComplete() {
		onComplete?.(createdCards.length);
	}

	// Clear all data
	function clearData() {
		clipboardData = '';
		csvFile = null;
		aiPrompt = '';
		processedCards = [];
		createdCards = [];
		errors = [];
		processingProgress = 0;
		processingCurrent = 0;
		processingTotal = 0;
		processingStatus = '';
	}

	// Get success/error counts
	const successCount = $derived(processedCards.filter((card) => card.success).length);
	const errorCount = $derived(processedCards.filter((card) => !card.success).length);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">Bulk Import</h2>
			<p class="text-muted-foreground">Create multiple flashcards at once</p>
		</div>
		<div class="flex gap-2">
			{#if onBack}
				<Button variant="outline" onclick={onBack}>Back</Button>
			{/if}
			{#if onCancel}
				<Button variant="outline" onclick={onCancel}>Cancel</Button>
			{/if}
		</div>
	</div>

	<!-- Context -->
	<Card.Root>
		<Card.Content class="pt-6">
			<div class="flex items-center gap-4">
				<div>
					<Label class="text-sm font-medium">Deck:</Label>
					<p class="text-muted-foreground text-sm">{deck.name}</p>
				</div>
				<Separator orientation="vertical" class="h-8" />
				<div>
					<Label class="text-sm font-medium">Template:</Label>
					<p class="text-muted-foreground text-sm">{template.name}</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Mode Selection -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Import Method</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Button
					variant={selectedMode === 'clipboard' ? 'default' : 'outline'}
					class="flex h-auto flex-col items-center gap-2 p-4"
					onclick={() => (selectedMode = 'clipboard')}
				>
					<UploadIcon class="h-6 w-6" />
					<div class="text-center">
						<div class="font-medium">Paste Data</div>
						<div class="text-muted-foreground text-xs">From clipboard</div>
					</div>
				</Button>

				<Button
					variant={selectedMode === 'csv' ? 'default' : 'outline'}
					class="flex h-auto flex-col items-center gap-2 p-4"
					onclick={() => (selectedMode = 'csv')}
				>
					<FileTextIcon class="h-6 w-6" />
					<div class="text-center">
						<div class="font-medium">Upload CSV</div>
						<div class="text-muted-foreground text-xs">From file</div>
					</div>
				</Button>

				<Button
					variant={selectedMode === 'ai' ? 'default' : 'outline'}
					class="flex h-auto flex-col items-center gap-2 p-4"
					onclick={() => (selectedMode = 'ai')}
				>
					<SparklesIcon class="h-6 w-6" />
					<div class="text-center">
						<div class="font-medium">AI Generate</div>
						<div class="text-muted-foreground text-xs">From prompt</div>
					</div>
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Input Section -->
	<Card.Root>
		<Card.Header>
			<Card.Title>
				{selectedMode === 'clipboard'
					? 'Paste Your Data'
					: selectedMode === 'csv'
						? 'Upload CSV File'
						: 'AI Generation Prompt'}
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if selectedMode === 'clipboard'}
				<div class="space-y-2">
					<Label for="clipboard-data"
						>Data (one card per line, fields separated by tabs or commas)</Label
					>
					<Textarea
						id="clipboard-data"
						bind:value={clipboardData}
						placeholder={`Example:\n${template.fields.map((f: FieldData) => f.label).join('\t')}\nHello\tHola\tGreeting\nGoodbye\tAdiós\tGreeting`}
						class="min-h-32"
						disabled={isProcessing}
					/>
					<p class="text-muted-foreground text-xs">
						Expected format: {template.fields.map((f: FieldData) => f.label).join(' | ')}
					</p>
				</div>
			{:else if selectedMode === 'csv'}
				<div class="space-y-2">
					<Label for="csv-file">CSV File</Label>
					<Input
						id="csv-file"
						type="file"
						accept=".csv"
						onchange={handleFileUpload}
						disabled={isProcessing}
					/>
					{#if csvFile}
						<p class="text-muted-foreground text-sm">
							Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
						</p>
					{/if}
					<p class="text-muted-foreground text-xs">
						CSV should have columns: {template.fields.map((f: FieldData) => f.label).join(', ')}
					</p>
				</div>
			{:else if selectedMode === 'ai'}
				<div class="space-y-2">
					<Label for="ai-prompt">Generation Prompt</Label>
					<Textarea
						id="ai-prompt"
						bind:value={aiPrompt}
						placeholder="Generate 10 flashcards for basic Spanish greetings and common phrases..."
						class="min-h-24"
						disabled={isProcessing}
					/>
					<p class="text-muted-foreground text-xs">
						Describe what kind of flashcards you want to generate
					</p>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex gap-2">
				<Button
					onclick={processBulkImport}
					disabled={isProcessing ||
						(selectedMode === 'clipboard' && !clipboardData.trim()) ||
						(selectedMode === 'csv' && !csvFile) ||
						(selectedMode === 'ai' && !aiPrompt.trim())}
					class="flex items-center gap-2"
				>
					{#if isProcessing}
						<RotateIcon class="h-4 w-4 animate-spin" />
						Processing...
					{:else}
						Create Cards
					{/if}
				</Button>

				{#if processedCards.length > 0}
					<Button variant="outline" onclick={clearData}>Clear</Button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Processing Progress -->
	{#if isProcessing}
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-medium">{processingStatus}</Label>
						<span class="text-muted-foreground text-sm">
							{processingCurrent} / {processingTotal}
						</span>
					</div>
					<Progress value={processingProgress} class="w-full" />
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Results -->
	{#if processedCards.length > 0 && !isProcessing}
		<Card.Root>
			<Card.Header>
				<Card.Title>Import Results</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Summary -->
				<div class="flex gap-4">
					<Badge variant="default" class="flex items-center gap-1">
						<CheckIcon class="h-3 w-3" />
						{successCount} Created
					</Badge>
					{#if errorCount > 0}
						<Badge variant="destructive" class="flex items-center gap-1">
							<XIcon class="h-3 w-3" />
							{errorCount} Failed
						</Badge>
					{/if}
				</div>

				<!-- Error Details -->
				{#if errorCount > 0}
					<div class="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
						<div class="mb-2 flex items-center gap-2">
							<AlertTriangleIcon class="text-destructive h-4 w-4" />
							<h4 class="text-destructive text-sm font-medium">Some cards failed to import</h4>
						</div>
						<ul class="space-y-1">
							{#each processedCards.filter((card) => !card.success) as errorCard, index (index)}
								<li class="text-destructive/80 text-sm">• {errorCard.error}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Completion Actions -->
				{#if successCount > 0}
					<div class="flex gap-2">
						<Button onclick={handleComplete}>
							Continue ({successCount} cards created)
						</Button>
						<Button variant="outline" onclick={clearData}>Import More</Button>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Errors -->
	{#if errors.length > 0}
		<div class="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
			<div class="mb-2 flex items-center gap-2">
				<AlertTriangleIcon class="text-destructive h-4 w-4" />
				<h4 class="text-destructive text-sm font-medium">Import Errors</h4>
			</div>
			<ul class="space-y-1">
				{#each errors as error, index (index)}
					<li class="text-destructive/80 text-sm">• {error}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
