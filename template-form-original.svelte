<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import * as Tabs from '$lib/components/ui/tabs';
	import FieldManager from './field-manager.svelte';
	import { templateFormSchema, type TemplateFormData } from '$lib/schemas/template.schemas';
	import { Language, LanguageLevel } from '$lib/components/schemas';
	import type { FieldData } from '$lib/schemas/field.schemas';
	import {
		SUPPORTED_LANGUAGES,
		LANGUAGE_LEVELS,
		DEFAULT_FRONT_LAYOUT,
		DEFAULT_BACK_LAYOUT
	} from '$lib/constants/template.constants';
	import DeviceFloppyIcon from '@tabler/icons-svelte/icons/device-floppy';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import IconCards from '@tabler/icons-svelte/icons/cards';
	import IconSettings from '@tabler/icons-svelte/icons/settings';
	import IconPalette from '@tabler/icons-svelte/icons/palette';
	import IconList from '@tabler/icons-svelte/icons/list';
	import type { Snippet } from 'svelte';
	import { Edra } from '$lib/components/edra/shadcn/index';
	import type { Editor } from '@tiptap/core';
	import LayoutEditor from './layout-editor.svelte';

	interface Props {
		initialData?: Partial<TemplateFormData>;
		onSubmit: (data: TemplateFormData & { fields: FieldData[] }) => Promise<void>;
		onPreview?: () => void;
		isLoading?: boolean;
		submitLabel?: string;
		cancel?: Snippet;
		templateId?: string;
		initialFields?: FieldData[];
	}

	let {
		initialData = {},
		onSubmit,
		onPreview,
		isLoading = false,
		submitLabel = 'Save Template',
		cancel,
		templateId,
		initialFields = []
	}: Props = $props();

	// State for reactive form behavior
	let fields = $state<FieldData[]>(initialFields);
	let selectedTab = $state('basic');
	let showPreview = $state(false);
	let fieldValidationError = $state<string | null>(null);

	// Rich text editor state
	let frontEditor = $state<Editor>();
	let backEditor = $state<Editor>();
	let currentSide = $state<'front' | 'back'>('front');
	
	// Reactive statement to ensure proper editor initialization when tab changes
	$: {
		// This will re-run whenever currentSide changes
		if (currentSide === 'front') {
			// Ensure frontEditor is properly focused when switching to front tab
			setTimeout(() => {
				if (frontEditor) {
					frontEditor.commands.focus();
				}
			}, 50);
		} else {
			// Ensure backEditor is properly focused when switching to back tab
			setTimeout(() => {
				if (backEditor) {
					backEditor.commands.focus();
				}
			}, 50);
		}
	}

	// Default styles
	const defaultStyles = {
		theme: 'default' as const,
		colors: {
			primary: '#2563eb',
			secondary: '#64748b',
			background: '#ffffff',
			text: '#1e293b',
			accent: '#f59e0b'
		},
		typography: {
			fontFamily: 'Inter, sans-serif',
			fontSize: '16px',
			fontWeight: '400',
			lineHeight: '1.5'
		},
		spacing: {
			padding: '1rem',
			margin: '0.5rem',
			borderRadius: '0.5rem'
		}
	};

	// Merge initial data with defaults
	const formDefaults: TemplateFormData = {
		name: '',
		description: '',
		nativeLanguage: Language.EN,
		learningLanguage: Language.ES,
		languageLevel: LanguageLevel.A1,
		frontLayout: DEFAULT_FRONT_LAYOUT,
		backLayout: DEFAULT_BACK_LAYOUT,
		styles: defaultStyles,
		isPublic: false,
		...initialData
	};

	const form = superForm(formDefaults, {
		SPA: true,
		validators: zodClient(templateFormSchema),
		dataType: 'json'
	});

	const { form: formData, enhance, errors, constraints, submitting } = form;

	// Handle field changes from FieldManager
	function handleFieldsChanged(event: CustomEvent<FieldData[]>) {
		fields = event.detail;
		// Clear field validation error when fields are updated
		fieldValidationError = null;
	}

	// Handle rich text editor updates
	function handleFrontEditorUpdate({ editor }: { editor: Editor }) {
		$formData.frontLayout = editor.getHTML();
	}

	function handleBackEditorUpdate({ editor }: { editor: Editor }) {
		$formData.backLayout = editor.getHTML();
	}

	// Insert placeholder into editor
	function insertPlaceholder(editor: Editor | undefined, placeholder: string) {
		if (!editor) return;
		
		// Make sure the editor is focused before inserting content
		editor.commands.focus();
		setTimeout(() => {
			editor.chain().insertContent(placeholder).run();
		}, 10);
	}

	// Insert placeholder into current editor
	function insertPlaceholderToCurrent(placeholder: string) {
		const editor = currentSide === 'front' ? frontEditor : backEditor;
		insertPlaceholder(editor, placeholder);
	}

	// Generate placeholder from field label
	function getFieldPlaceholder(field: FieldData): string {
		return `{{${field.label.toLowerCase().replace(/\s+/g, '_')}}}`;
	}

	// Replace placeholders with example values for preview
	function replacePlaceholdersWithExamples(content: string, fields: FieldData[]): string {
		if (!content) return '';

		let result = content;
		fields.forEach((field) => {
			const placeholder = getFieldPlaceholder(field);
			const exampleValue = field.example || `[${field.label}]`;
			result = result.replaceAll(placeholder, exampleValue);
		});

		return result;
	}

	// Validate form with fields
	async function handleSubmit() {
		// Check if we have at least one input field
		const hasInputFields = fields.some((field) => field.isInput);
		if (!hasInputFields) {
			fieldValidationError = 'At least one input field is required';
			selectedTab = 'fields';
			return;
		}

		// Use the validateForm method from superForm which automatically checks all fields
		const result = await form.validateForm();

		// If the form is valid, submit it with fields
		if (result.valid && $formData) {
			onSubmit({ ...$formData, fields });
		}
	}

	// Toggle preview mode
	function togglePreview() {
		showPreview = !showPreview;
		if (onPreview) {
			onPreview();
		}
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-6">
	<form
		use:enhance
		class="space-y-6"
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<!-- Basic Information -->

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Template Information Card -->
			<Card>
				<CardHeader>
					<CardTitle>Template Information</CardTitle>
					<CardDescription>Set up the basic properties of your template</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Template Name *</Form.Label>
								<Input
									{...props}
									bind:value={$formData.name}
									placeholder="e.g., Basic Vocabulary"
									{...$constraints.name}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="description">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Description</Form.Label>
								<Textarea
									{...props}
									bind:value={$formData.description}
									placeholder="Describe what this template is for (used as AI context)"
									rows={3}
									{...$constraints.description}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="isPublic">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center space-x-2">
									<Checkbox.Root {...props} bind:checked={$formData.isPublic} />
									<Form.Label class="text-sm font-normal">
										Make this template public (others can see and clone it)
									</Form.Label>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</CardContent>
			</Card>

			<!-- Language Configuration Card -->
			<Card>
				<CardHeader>
					<CardTitle>Language Configuration</CardTitle>
					<CardDescription
						>Set the language pair and proficiency level for this template</CardDescription
					>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Form.Field {form} name="nativeLanguage">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Native Language *</Form.Label>
									<Select.Root type="single" bind:value={$formData.nativeLanguage} {...props}>
										<Select.Trigger>
											{SUPPORTED_LANGUAGES.find((l) => l.value === $formData.nativeLanguage)
												?.label || 'Select language'}
										</Select.Trigger>
										<Select.Content>
											{#each SUPPORTED_LANGUAGES as language}
												<Select.Item value={language.value}>{language.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="learningLanguage">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Learning Language *</Form.Label>
									<Select.Root type="single" bind:value={$formData.learningLanguage} {...props}>
										<Select.Trigger>
											{SUPPORTED_LANGUAGES.find((l) => l.value === $formData.learningLanguage)
												?.label || 'Select language'}
										</Select.Trigger>
										<Select.Content>
											{#each SUPPORTED_LANGUAGES as language}
												<Select.Item value={language.value}>{language.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<Form.Field {form} name="languageLevel">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Language Level *</Form.Label>
								<Select.Root type="single" bind:value={$formData.languageLevel} {...props}>
									<Select.Trigger>
										{LANGUAGE_LEVELS.find((l) => l.value === $formData.languageLevel)?.label ||
											'Select level'}
									</Select.Trigger>
									<Select.Content>
										{#each LANGUAGE_LEVELS as level}
											<Select.Item value={level.value}>{level.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</CardContent>
			</Card>
		</div>

		<!-- Fields Card -->
		<FieldManager
			{templateId}
			initialFields={fields}
			nativeLanguage={$formData.nativeLanguage}
			learningLanguage={$formData.learningLanguage}
			on:fieldsChanged={handleFieldsChanged}
		/>
		{#if fieldValidationError}
			<div class="text-destructive text-sm font-medium">{fieldValidationError}</div>
		{/if}

		<!-- Layout Card -->

		<Card>
			<CardHeader>
				<CardTitle>Layout Templates</CardTitle>
				<CardDescription>
					Define the HTML structure for front and back of flashcards. Use placeholders like
					&#123;&#123;fieldName&#125;&#125; to insert field values.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- Layout Tabs -->
				<Tabs.Root
					value={currentSide}
					onValueChange={(value) => (currentSide = value as 'front' | 'back')}
				>
					<Tabs.List class="grid w-full grid-cols-2">
						<Tabs.Trigger value="front">Front Side</Tabs.Trigger>
						<Tabs.Trigger value="back">Back Side</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="front" class="mt-4">
						<Form.Field {form} name="frontLayout">
							<Form.Control>
								{#snippet children({ props })}
									<LayoutEditor
										bind:editor={frontEditor}
										content={$formData.frontLayout}
										onUpdate={handleFrontEditorUpdate}
										{fields}
										previewContent={replacePlaceholdersWithExamples($formData.frontLayout, fields)}
									/>
									<Form.Description></Form.Description>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</Tabs.Content>
					<Tabs.Content value="back" class="mt-4">
						<Form.Field {form} name="backLayout">
							<Form.Control>
								{#snippet children({ props })}
									<LayoutEditor
										bind:editor={backEditor}
										content={$formData.backLayout}
										onUpdate={handleBackEditorUpdate}
										{fields}
										previewContent={replacePlaceholdersWithExamples($formData.backLayout, fields)}
									/>
									<Form.Description></Form.Description>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</Tabs.Content>
				</Tabs.Root>
			</CardContent>
		</Card>

		<!-- Footer with actions -->
		<div class="flex items-center justify-end gap-3">
			{#if cancel}
				<Button variant="outline" disabled={isLoading || $submitting} onclick={cancel}
					>Cancel</Button
				>
			{/if}
			<Button onclick={handleSubmit} disabled={isLoading || $submitting} class="min-w-[120px]">
				{#if isLoading || $submitting}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					Saving...
				{:else}
					<DeviceFloppyIcon class="mr-2 h-4 w-4" />
					{submitLabel}
				{/if}
			</Button>
		</div>
	</form>
</div>
