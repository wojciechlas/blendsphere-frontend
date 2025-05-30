<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import WandIcon from '@tabler/icons-svelte/icons/wand';
	import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import LoaderIcon from '@tabler/icons-svelte/icons/loader-2';
	import type { Template } from '$lib/services/template.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import { aiService } from '$lib/services/ai.service.js';
	import type { AIGenerationItem } from '$lib/types/flashcard-creator.js';

	interface Props {
		open: boolean;
		template: Template;
		currentData: Record<string, unknown>;
		onGenerate: (data: Record<string, unknown>) => void;
		onClose: () => void;
	}

	let { open = $bindable(), template, currentData, onGenerate, onClose }: Props = $props();

	// Helper function for safe object access
	function safeGetData(data: Record<string, unknown>, key: string): unknown {
		// eslint-disable-next-line security/detect-object-injection
		return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	// AI generation state
	let prompt = $state('');
	let selectedFields = $state<string[]>([]);
	let generationMode = $state<'fill-empty' | 'overwrite' | 'all'>('fill-empty');
	let isGenerating = $state(false);
	let generatedData = $state<Record<string, unknown>>({});
	let hasGenerated = $state(false);

	// Available fields for generation (text-based fields)
	let availableFields = $derived(
		template.fields?.filter(
			(field: Field) =>
				['text', 'textarea'].includes(field.type) &&
				(generationMode === 'fill-empty' ? !safeGetData(currentData, field.name) : true)
		) || []
	);

	// Suggested prompts based on template
	let suggestedPrompts = $derived([
		`Create content for a ${template.name} flashcard`,
		`Generate language learning content`,
		`Create educational flashcard content`,
		...(template.language ? [`Create ${template.language} language content`] : []),
		...(template.categories?.map((cat: string) => `Create ${cat} related content`) || [])
	]);

	const handleFieldToggle = (fieldName: string, checked: boolean) => {
		if (checked) {
			selectedFields = [...selectedFields, fieldName];
		} else {
			selectedFields = selectedFields.filter((f) => f !== fieldName);
		}
	};

	const handleGenerate = async () => {
		if (!prompt.trim() || selectedFields.length === 0) return;

		isGenerating = true;
		generatedData = {};
		hasGenerated = false;

		try {
			// Prepare generation items for selected fields
			const items: AIGenerationItem[] = selectedFields.map((fieldName) => {
				const field = template.fields?.find((f: Field) => f.name === fieldName);
				if (!field) {
					throw new Error(`Field ${fieldName} not found in template`);
				}

				return {
					id: fieldName, // Use field name as ID for mapping back to the form
					instructions: prompt,
					field_name: field.name,
					field_type: field.type,
					field_description: field.description || undefined,
					current_content:
						typeof fieldName === 'string'
							? String(safeGetData(currentData, fieldName) || '')
							: undefined,
					overwrite: generationMode === 'overwrite' || generationMode === 'all'
				};
			});

			// Call the unified AI service
			const response = await aiService.generate({
				templateId: template.id,
				items: items
			});

			// Map successful results back to form data
			const newGeneratedData: Record<string, unknown> = {};
			response.results.forEach((result) => {
				if (result.success && result.content && typeof result.id === 'string') {
					newGeneratedData[result.id] = result.content;
				} else if (!result.success && result.error) {
					console.warn(`Failed to generate content for field ${result.id}:`, result.error);
					// Could show specific field errors to user
				}
			});

			generatedData = newGeneratedData;
			hasGenerated = true;
		} catch (error) {
			console.error('AI generation failed:', error);
			// Handle error - show notification
			// You might want to add a proper error notification system here
		} finally {
			isGenerating = false;
		}
	};

	const handleApply = () => {
		onGenerate(generatedData);
		handleClose();
	};

	const handleClose = () => {
		// Reset state
		prompt = '';
		selectedFields = [];
		generationMode = 'fill-empty';
		generatedData = {};
		hasGenerated = false;
		isGenerating = false;
		onClose();
		open = false;
	};

	const handlePromptSuggestion = (suggestion: string) => {
		prompt = suggestion;
	};

	// Auto-select all available fields when mode changes
	$effect(() => {
		if (availableFields.length > 0) {
			selectedFields = availableFields.map((f: Field) => f.name);
		}
	});

	// Reset when modal opens
	$effect(() => {
		if (open) {
			prompt = '';
			generationMode = 'fill-empty';
			generatedData = {};
			hasGenerated = false;
			isGenerating = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<WandIcon class="h-5 w-5" />
				AI Content Generation
			</Dialog.Title>
			<Dialog.Description>
				Use AI to generate content for your flashcard fields. Describe what you want to learn about.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex-1 space-y-6 overflow-y-auto">
			{#if !hasGenerated}
				<!-- Generation Setup -->
				<div class="space-y-6">
					<!-- Generation Mode -->
					<div class="space-y-3">
						<Label>Generation Mode</Label>
						<Select.Root type="single" bind:value={generationMode}>
							<Select.Trigger>
								{generationMode === 'fill-empty' && 'Fill empty fields only'}
								{generationMode === 'overwrite' && 'Overwrite existing content'}
								{generationMode === 'all' && 'Generate for all fields'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="fill-empty">Fill empty fields only</Select.Item>
								<Select.Item value="overwrite">Overwrite existing content</Select.Item>
								<Select.Item value="all">Generate for all fields</Select.Item>
							</Select.Content>
						</Select.Root>
						<p class="text-muted-foreground text-xs">
							{generationMode === 'fill-empty' &&
								'Only generate content for fields that are currently empty'}
							{generationMode === 'overwrite' && 'Replace existing content in selected fields'}
							{generationMode === 'all' &&
								'Generate content for all selected fields regardless of current content'}
						</p>
					</div>

					<!-- Field Selection -->
					<div class="space-y-3">
						<Label>Fields to Generate ({selectedFields.length} selected)</Label>
						{#if availableFields.length > 0}
							<div class="space-y-2">
								{#each availableFields as field (field.id)}
									<div class="flex items-center space-x-2">
										<Checkbox
											id={field.name}
											checked={selectedFields.includes(field.name)}
											onCheckedChange={(checked) => handleFieldToggle(field.name, checked)}
											disabled={isGenerating}
										/>
										<Label for={field.name} class="flex-1 text-sm font-normal">
											{field.label}
											{#if field.description}
												<span class="text-muted-foreground">- {field.description}</span>
											{/if}
											{#if currentData[field.name]}
												<Badge variant="outline" class="ml-2 text-xs">Has content</Badge>
											{/if}
										</Label>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-muted-foreground py-4 text-center">
								<p>No fields available for AI generation with current mode.</p>
								{#if generationMode === 'fill-empty'}
									<p class="mt-1 text-xs">
										All text fields already have content. Try "Overwrite existing content" mode.
									</p>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Prompt Input -->
					<div class="space-y-3">
						<Label for="prompt">Describe what you want to learn</Label>
						<Textarea
							id="prompt"
							bind:value={prompt}
							placeholder="e.g., Spanish vocabulary for ordering food at a restaurant, Basic German phrases for travel, Mathematical concepts about algebra..."
							rows={3}
							disabled={isGenerating}
						/>

						<!-- Suggested Prompts -->
						{#if suggestedPrompts.length > 0 && !prompt}
							<div class="space-y-2">
								<p class="text-muted-foreground text-xs">Suggested prompts:</p>
								<div class="flex flex-wrap gap-2">
									{#each suggestedPrompts.slice(0, 3) as suggestion, index (index)}
										<Button
											variant="outline"
											size="sm"
											onclick={() => handlePromptSuggestion(suggestion)}
											class="text-xs"
											disabled={isGenerating}
										>
											{suggestion}
										</Button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Generated Results -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Generated Content</h3>
						<Button
							variant="outline"
							onclick={() => {
								hasGenerated = false;
								generatedData = {};
							}}
							class="gap-2"
						>
							<RefreshIcon class="h-4 w-4" />
							Generate Again
						</Button>
					</div>

					{#if Object.keys(generatedData).length > 0}
						<div class="space-y-4">
							{#each Object.entries(generatedData) as [fieldName, value] (fieldName)}
								{@const field = template.fields?.find((f: Field) => f.name === fieldName)}
								{#if field}
									<div class="space-y-2 rounded-lg border p-4">
										<div class="flex items-center justify-between">
											<Label class="font-medium">{field.label}</Label>
											<Badge variant="secondary" class="text-xs">Generated</Badge>
										</div>
										<div class="text-foreground text-sm">
											{value}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="text-muted-foreground py-8 text-center">
							<p>No content was generated. Try adjusting your prompt.</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer class="flex justify-between">
			<Button variant="ghost" onclick={handleClose} disabled={isGenerating}>Cancel</Button>

			<div class="flex gap-2">
				{#if !hasGenerated}
					<Button
						onclick={handleGenerate}
						disabled={!prompt.trim() || selectedFields.length === 0 || isGenerating}
						class="gap-2"
					>
						{#if isGenerating}
							<LoaderIcon class="h-4 w-4 animate-spin" />
							Generating...
						{:else}
							<WandIcon class="h-4 w-4" />
							Generate Content
						{/if}
					</Button>
				{:else}
					<Button
						onclick={handleApply}
						disabled={Object.keys(generatedData).length === 0}
						class="gap-2"
					>
						<CheckIcon class="h-4 w-4" />
						Apply to Form
					</Button>
				{/if}
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
