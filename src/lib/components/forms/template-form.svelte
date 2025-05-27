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
	import { Edra, EdraToolbar } from '$lib/components/edra/shadcn/index';
	import type { Editor } from '@tiptap/core';

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

		editor.chain().focus().insertContent(placeholder).run();
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
	<!-- Header with actions -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">
				{templateId ? 'Edit Template' : 'Create Template'}
			</h1>
			<p class="text-muted-foreground">
				{templateId
					? 'Update your template configuration'
					: 'Set up a new flashcard template with custom fields and layouts'}
			</p>
		</div>
		<div class="flex items-center gap-3">
			{#if onPreview}
				<Button variant="outline" onclick={togglePreview} class="min-w-[100px]">
					<EyeIcon class="mr-2 h-4 w-4" />
					{showPreview ? 'Hide Preview' : 'Preview'}
				</Button>
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
	</div>

	<form
		use:enhance
		class="space-y-6"
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<!-- Responsive Tabs Layout -->
		<Tabs.Root bind:value={selectedTab} class="w-full">
			<Tabs.List class="grid w-full grid-cols-2 lg:grid-cols-4">
				<Tabs.Trigger value="basic" class="flex items-center gap-2">
					<IconSettings class="h-4 w-4" />
					<span class="hidden sm:inline">Basic Info</span>
					<span class="sm:hidden">Info</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="fields" class="flex items-center gap-2">
					<IconList class="h-4 w-4" />
					<span class="hidden sm:inline">Fields</span>
					<span class="sm:hidden">Fields</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="layout" class="flex items-center gap-2">
					<IconCards class="h-4 w-4" />
					<span class="hidden sm:inline">Layout</span>
					<span class="sm:hidden">Layout</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="styles" class="flex items-center gap-2">
					<IconPalette class="h-4 w-4" />
					<span class="hidden sm:inline">Styles</span>
					<span class="sm:hidden">Styles</span>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Basic Information Tab -->
			<Tabs.Content value="basic" class="space-y-6">
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
			</Tabs.Content>

			<!-- Fields Tab -->
			<Tabs.Content value="fields" class="space-y-6">
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
			</Tabs.Content>

			<!-- Layout Tab -->
			<Tabs.Content value="layout" class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Layout Templates</CardTitle>
						<CardDescription>
							Define the HTML structure for front and back of flashcards. Use placeholders like
							&#123;&#123;fieldName&#125;&#125; to insert field values.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Available Fields Info -->
						{#if fields.length > 0}
							<div class="bg-muted/50 rounded-lg p-4">
								<h4 class="mb-2 text-sm font-medium">Available Field Placeholders:</h4>
								<div class="flex flex-wrap gap-2">
									{#each fields as field}
										{@const placeholder = getFieldPlaceholder(field)}
										<div class="flex items-center gap-1">
											<code class="bg-background rounded border px-2 py-1 text-xs">
												{placeholder}
											</code>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												class="h-6 px-2 text-xs"
												onclick={() => insertPlaceholderToCurrent(placeholder)}
												title="Insert into current layout"
											>
												Insert
											</Button>
										</div>
									{/each}
								</div>
								<p class="text-muted-foreground mt-2 text-xs">
									Click Insert to add placeholders to the current layout
								</p>
							</div>
						{:else}
							<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
								<p class="text-sm text-orange-800">
									💡 Add fields first to see available placeholders for your layouts
								</p>
							</div>
						{/if}

						<!-- Side Toggle -->
						<div class="flex items-center gap-2">
							<div class="bg-muted flex rounded-lg border p-1">
								<Button
									type="button"
									variant={currentSide === 'front' ? 'default' : 'ghost'}
									size="sm"
									class="h-8 px-3 text-xs"
									onclick={() => (currentSide = 'front')}
								>
									Front Side
								</Button>
								<Button
									type="button"
									variant={currentSide === 'back' ? 'default' : 'ghost'}
									size="sm"
									class="h-8 px-3 text-xs"
									onclick={() => (currentSide = 'back')}
								>
									Back Side
								</Button>
							</div>
						</div>

						<!-- Full-width Toolbar -->
						<div class="w-full">
							{#if currentSide === 'front' && frontEditor}
								<EdraToolbar editor={frontEditor} />
							{/if}
							{#if currentSide === 'back' && backEditor}
								<EdraToolbar editor={backEditor} />
							{/if}
						</div>

						<!-- Editor and Preview Side by Side -->
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
							<!-- Editor -->
							<div class="space-y-4">
								{#if currentSide === 'front'}
									<Form.Field {form} name="frontLayout">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label></Form.Label>
												<div class="min-h-[300px] rounded-md border">
													<Edra
														bind:editor={frontEditor}
														content={$formData.frontLayout}
														onUpdate={handleFrontEditorUpdate}
														class="p-4"
														showSlashCommands={false}
													/>
												</div>
												<Form.Description></Form.Description>
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								{:else}
									<Form.Field {form} name="backLayout">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label></Form.Label>
												<div class="min-h-[300px] rounded-md border">
													<Edra
														bind:editor={backEditor}
														content={$formData.backLayout}
														onUpdate={handleBackEditorUpdate}
														class="p-4"
														showSlashCommands={false}
													/>
												</div>
												<Form.Description></Form.Description>
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								{/if}
							</div>

							<!-- Live Preview -->
							<div class="my-2 space-y-4">
								{#if fields.length > 0}
									<div class="bg-card min-h-[300px] rounded-lg border p-6">
										{@html replacePlaceholdersWithExamples(
											currentSide === 'front' ? $formData.frontLayout : $formData.backLayout,
											fields
										)}
									</div>
								{:else}
									<div
										class="bg-muted/20 flex min-h-[300px] items-center justify-center rounded-lg border p-6"
									>
										<div class="text-muted-foreground text-center">
											<p class="text-sm">Add fields to see preview with sample data</p>
											<p class="mt-1 text-xs">Placeholders will be replaced with example values</p>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>
			</Tabs.Content>

			<!-- Styles Tab -->
			<Tabs.Content value="styles" class="space-y-6">
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Theme & Colors Card -->
					<Card>
						<CardHeader>
							<CardTitle>Theme & Colors</CardTitle>
							<CardDescription>Customize the visual appearance of your flashcards</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<Form.Field {form} name="styles.theme">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Theme</Form.Label>
										<Select.Root type="single" bind:value={$formData.styles.theme} {...props}>
											<Select.Trigger>
												{$formData.styles.theme || 'Select theme'}
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="default">Default</Select.Item>
												<Select.Item value="minimal">Minimal</Select.Item>
												<Select.Item value="modern">Modern</Select.Item>
												<Select.Item value="dark">Dark</Select.Item>
											</Select.Content>
										</Select.Root>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<div class="grid grid-cols-2 gap-4">
								<Form.Field {form} name="styles.colors.primary">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Primary Color</Form.Label>
											<div class="flex items-center gap-2">
												<Input
													{...props}
													type="color"
													bind:value={$formData.styles.colors.primary}
													class="h-10 w-16 cursor-pointer rounded border"
												/>
												<Input
													type="text"
													bind:value={$formData.styles.colors.primary}
													placeholder="#2563eb"
													class="flex-1"
												/>
											</div>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="styles.colors.secondary">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Secondary Color</Form.Label>
											<div class="flex items-center gap-2">
												<Input
													{...props}
													type="color"
													bind:value={$formData.styles.colors.secondary}
													class="h-10 w-16 cursor-pointer rounded border"
												/>
												<Input
													type="text"
													bind:value={$formData.styles.colors.secondary}
													placeholder="#64748b"
													class="flex-1"
												/>
											</div>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="styles.colors.background">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Background</Form.Label>
											<div class="flex items-center gap-2">
												<Input
													{...props}
													type="color"
													bind:value={$formData.styles.colors.background}
													class="h-10 w-16 cursor-pointer rounded border"
												/>
												<Input
													type="text"
													bind:value={$formData.styles.colors.background}
													placeholder="#ffffff"
													class="flex-1"
												/>
											</div>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="styles.colors.text">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Text Color</Form.Label>
											<div class="flex items-center gap-2">
												<Input
													{...props}
													type="color"
													bind:value={$formData.styles.colors.text}
													class="h-10 w-16 cursor-pointer rounded border"
												/>
												<Input
													type="text"
													bind:value={$formData.styles.colors.text}
													placeholder="#1e293b"
													class="flex-1"
												/>
											</div>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>
						</CardContent>
					</Card>

					<!-- Typography & Spacing Card -->
					<Card>
						<CardHeader>
							<CardTitle>Typography & Spacing</CardTitle>
							<CardDescription>Configure text styling and layout spacing</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<Form.Field {form} name="styles.typography.fontFamily">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Font Family</Form.Label>
										<Select.Root
											type="single"
											bind:value={$formData.styles.typography.fontFamily}
											{...props}
										>
											<Select.Trigger>
												{$formData.styles.typography.fontFamily || 'Select font'}
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="Inter, sans-serif">Inter</Select.Item>
												<Select.Item value="Roboto, sans-serif">Roboto</Select.Item>
												<Select.Item value="Arial, sans-serif">Arial</Select.Item>
												<Select.Item value="Georgia, serif">Georgia</Select.Item>
												<Select.Item value="Times New Roman, serif">Times New Roman</Select.Item>
												<Select.Item value="Courier New, monospace">Courier New</Select.Item>
											</Select.Content>
										</Select.Root>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<div class="grid grid-cols-2 gap-4">
								<Form.Field {form} name="styles.typography.fontSize">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Font Size</Form.Label>
											<Select.Root
												type="single"
												bind:value={$formData.styles.typography.fontSize}
												{...props}
											>
												<Select.Trigger>
													{$formData.styles.typography.fontSize || 'Select size'}
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="14px">14px</Select.Item>
													<Select.Item value="16px">16px</Select.Item>
													<Select.Item value="18px">18px</Select.Item>
													<Select.Item value="20px">20px</Select.Item>
													<Select.Item value="24px">24px</Select.Item>
												</Select.Content>
											</Select.Root>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="styles.typography.fontWeight">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Font Weight</Form.Label>
											<Select.Root
												type="single"
												bind:value={$formData.styles.typography.fontWeight}
												{...props}
											>
												<Select.Trigger>
													{$formData.styles.typography.fontWeight || 'Select weight'}
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="300">Light</Select.Item>
													<Select.Item value="400">Regular</Select.Item>
													<Select.Item value="500">Medium</Select.Item>
													<Select.Item value="600">Semi Bold</Select.Item>
													<Select.Item value="700">Bold</Select.Item>
												</Select.Content>
											</Select.Root>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<Form.Field {form} name="styles.spacing.padding">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Padding</Form.Label>
											<Input
												{...props}
												bind:value={$formData.styles.spacing.padding}
												placeholder="1rem"
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="styles.spacing.borderRadius">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Border Radius</Form.Label>
											<Input
												{...props}
												bind:value={$formData.styles.spacing.borderRadius}
												placeholder="0.5rem"
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- Style Preview Card -->
				<Card>
					<CardHeader>
						<CardTitle>Style Preview</CardTitle>
						<CardDescription
							>Preview how your flashcard will look with the selected styles</CardDescription
						>
					</CardHeader>
					<CardContent>
						<div
							class="mx-auto max-w-md rounded-lg border p-6"
							style="
								background-color: {$formData.styles.colors.background};
								color: {$formData.styles.colors.text};
								font-family: {$formData.styles.typography.fontFamily};
								font-size: {$formData.styles.typography.fontSize};
								font-weight: {$formData.styles.typography.fontWeight};
								padding: {$formData.styles.spacing.padding};
								border-radius: {$formData.styles.spacing.borderRadius};
							"
						>
							<div class="space-y-3 text-center">
								<div style="color: {$formData.styles.colors.primary};" class="font-semibold">
									Sample Word
								</div>
								<div style="color: {$formData.styles.colors.secondary};" class="text-sm">
									/ˈsæmpəl wɜːrd/
								</div>
								<div>Example definition or translation</div>
								<div style="color: {$formData.styles.colors.secondary};" class="text-sm italic">
									"This is an example sentence using the word."
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</Tabs.Content>
		</Tabs.Root>
	</form>
</div>
