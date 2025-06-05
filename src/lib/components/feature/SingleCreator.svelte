<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import TemplateSelector from './TemplateSelector.svelte';
	import DynamicForm from './DynamicForm.svelte';
	import FlashcardPreview from './FlashcardPreview.svelte';
	import AIGenerationPanel from './AIGenerationPanel.svelte';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import WandIcon from '@tabler/icons-svelte/icons/wand';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import type { Template } from '$lib/services/template.service.js';
	import type { Deck } from '$lib/services/deck.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import { Language } from '$lib/components/schemas';
	import { flashcardService } from '$lib/services/flashcard.service.js';

	interface FlashcardData {
		[key: string]: string | number | boolean | File | null;
	}

	interface FormField {
		id: string;
		name: string;
		label: string;
		type: string;
		language: Language;
		required: boolean;
		description?: string;
		example?: string;
		isInput: boolean;
		template: string;
	}

	interface EnhancedTemplate extends Template {
		fields: FormField[];
	}

	interface Props {
		deck: Deck;
		templates: Template[];
		fields: Field[];
		initialTemplate?: Template;
		onComplete?: () => void;
		onBack?: () => void;
	}

	let { deck, templates, fields, initialTemplate, onComplete, onBack }: Props = $props();

	// Convert Field service types to component-compatible types
	const convertFieldForForm = (field: Field): FormField => ({
		...field,
		name: field.label.toLowerCase().replace(/\s+/g, '_'), // Generate name from label
		language: Language[field.language as keyof typeof Language],
		required: field.isInput // Map isInput to required for the form
	});

	// State management
	let selectedTemplate = $state<Template | null>(initialTemplate || null);
	let currentStep = $state<'template' | 'form' | 'preview'>('template');
	let formData = $state<FlashcardData>({});
	let formErrors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let showTemplateSelector = $state(false);
	let showAIPanel = $state(false);

	// Get fields for selected template
	let templateFields = $derived(() => {
		if (!selectedTemplate) return [];
		const template = selectedTemplate;
		return fields.filter((f) => f.template === template.id).map(convertFieldForForm);
	});

	// For DynamicForm, we need to create a template with fields included
	$effect(() => {
		if (selectedTemplate) {
			// We need to enhance the template with fields for the form
			// Get the current fields for this template (non-reactive)
			const template = selectedTemplate; // Assign to avoid null checks
			const currentFields = fields
				.filter((f) => f.template === template.id)
				.map(convertFieldForForm);

			enhancedTemplate = {
				...template,
				fields: currentFields
			};
		}
	});

	// The enhanced template to pass to DynamicForm
	let enhancedTemplate = $state<EnhancedTemplate | null>(null);

	// Initialize step based on template selection
	$effect(() => {
		if (selectedTemplate && currentStep === 'template') {
			currentStep = 'form';
		} else if (!selectedTemplate) {
			currentStep = 'template';
		}
	});

	// Progress steps
	let steps = $derived([
		{
			id: 'template',
			label: 'Template',
			completed: !!selectedTemplate,
			current: currentStep === 'template'
		},
		{
			id: 'form',
			label: 'Content',
			completed:
				currentStep === 'preview' ||
				(currentStep !== 'template' && Object.keys(formData).length > 0),
			current: currentStep === 'form'
		},
		{
			id: 'preview',
			label: 'Review',
			completed: false,
			current: currentStep === 'preview'
		}
	]);

	// Event handlers
	const handleTemplateSelect = async (template: Template) => {
		selectedTemplate = template;
		currentStep = 'form';
		showTemplateSelector = false;
		formData = {};
		formErrors = {};
	};

	const handleFormSubmit = async (data: FlashcardData) => {
		if (!selectedTemplate) return;

		formData = data;
		isSubmitting = true;
		formErrors = {};

		try {
			// Create the flashcard
			await flashcardService.create({
				deck: deck.id,
				template: selectedTemplate.id,
				data: data
			});

			// Show success and complete
			onComplete?.();
		} catch (error) {
			console.error('Failed to create flashcard:', error);

			// Handle validation errors
			if (error instanceof Error && error.message.includes('validation')) {
				formErrors = { general: 'Please check your input and try again.' };
			} else {
				formErrors = { general: 'Failed to create flashcard. Please try again.' };
			}
		} finally {
			isSubmitting = false;
		}
	};

	const handleAIGenerate = (generatedData: Record<string, unknown>) => {
		formData = { ...formData, ...(generatedData as FlashcardData) };
		showAIPanel = false;
	};

	const handlePreview = () => {
		if (selectedTemplate && Object.keys(formData).length > 0) {
			currentStep = 'preview';
		}
	};

	const handleChangeTemplate = () => {
		showTemplateSelector = true;
	};

	const handleBackToForm = () => {
		currentStep = 'form';
	};

	const handleBackToTemplate = () => {
		selectedTemplate = null;
		currentStep = 'template';
		formData = {};
		formErrors = {};
	};
</script>

<div class="space-y-6">
	<!-- Header with Back Button -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			{#if onBack}
				<Button variant="ghost" size="sm" onclick={onBack} class="gap-2">
					<ArrowLeftIcon class="h-4 w-4" />
					Back
				</Button>
				<Separator orientation="vertical" class="h-6" />
			{/if}
			<div>
				<h1 class="text-2xl font-bold">Create Single Flashcard</h1>
				<p class="text-muted-foreground">
					Adding to deck: <span class="font-medium">{deck.name}</span>
				</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-2">
			{#if selectedTemplate && currentStep === 'form'}
				<Button variant="outline" onclick={() => (showAIPanel = true)} class="gap-2">
					<WandIcon class="h-4 w-4" />
					AI Assist
				</Button>
				<Button
					variant="outline"
					onclick={handlePreview}
					disabled={Object.keys(formData).length === 0}
					class="gap-2"
				>
					<EyeIcon class="h-4 w-4" />
					Preview
				</Button>
			{/if}
		</div>
	</div>

	<!-- Main Content Area -->
	<Card.Root>
		<Card.Content class="p-6">
			{#if currentStep === 'template'}
				<!-- Template Selection Step -->
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-xl font-semibold">Choose a Template</h2>
						<p class="text-muted-foreground mt-2">
							Select a template to structure your flashcard content.
						</p>
					</div>

					<!-- Template Selection Grid -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each templates.slice(0, 6) as template (template.id)}
							<button
								type="button"
								class="hover:border-primary focus:ring-primary rounded-lg border p-4 text-left transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
								onclick={() => handleTemplateSelect(template)}
							>
								<div class="font-medium">{template.name}</div>
								{#if template.description}
									<div class="text-muted-foreground mt-1 line-clamp-2 text-sm">
										{template.description}
									</div>
								{/if}
								<div class="mt-3 flex gap-2">
									<Badge variant="secondary" class="text-xs">
										{templateFields.length} fields
									</Badge>
									<Badge variant="outline" class="text-xs">
										{template.nativeLanguage} → {template.learningLanguage}
									</Badge>
								</div>
							</button>
						{/each}
					</div>

					{#if templates.length > 6}
						<div class="text-center">
							<Button variant="outline" onclick={() => (showTemplateSelector = true)}>
								View All Templates ({templates.length})
							</Button>
						</div>
					{/if}
				</div>
			{:else if currentStep === 'form' && selectedTemplate}
				<!-- Form Step -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-xl font-semibold">Fill Content</h2>
							<p class="text-muted-foreground">
								Using template: <span class="font-medium">{selectedTemplate.name}</span>
							</p>
						</div>
						<Button variant="outline" onclick={handleChangeTemplate} class="gap-2">
							<SettingsIcon class="h-4 w-4" />
							Change Template
						</Button>
					</div>

					{#if enhancedTemplate}
						<DynamicForm
							template={enhancedTemplate}
							initialData={formData}
							onSubmit={(data: Record<string, unknown>) => {
								handleFormSubmit(data as FlashcardData);
							}}
							onCancel={handleBackToTemplate}
							{isSubmitting}
							errors={formErrors}
						/>
					{:else}
						<div class="text-muted-foreground py-8 text-center">
							<p>Loading template fields...</p>
						</div>
					{/if}
				</div>
			{:else if currentStep === 'preview' && selectedTemplate}
				<!-- Preview Step -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold">Review Flashcard</h2>
						<div class="flex gap-2">
							<Button variant="outline" onclick={handleBackToForm}>Edit</Button>
							<Button onclick={() => handleFormSubmit(formData)} disabled={isSubmitting}>
								{isSubmitting ? 'Creating...' : 'Create Flashcard'}
							</Button>
						</div>
					</div>

					<FlashcardPreview template={selectedTemplate} data={formData} deckName={deck.name} />
				</div>
			{/if}

			<!-- General Error Display -->
			{#if formErrors.general}
				<div class="bg-destructive/10 border-destructive/20 mt-4 rounded-lg border p-3">
					<p class="text-destructive text-sm">{formErrors.general}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Progress Steps -->
<div class="flex items-center justify-center">
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
</div>

<!-- Template Selector Modal -->
<TemplateSelector
	bind:open={showTemplateSelector}
	{templates}
	onSelect={handleTemplateSelect}
	onClose={() => (showTemplateSelector = false)}
	selectedTemplateId={selectedTemplate?.id}
/>

<!-- AI Generation Panel -->
{#if showAIPanel && selectedTemplate}
	<AIGenerationPanel
		bind:open={showAIPanel}
		template={selectedTemplate}
		currentData={formData}
		onGenerate={handleAIGenerate}
		onClose={() => (showAIPanel = false)}
	/>
{/if}
