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
	import { templateFormSchema, type TemplateFormData } from '$lib/schemas/template.schemas';
	import { Language, LanguageLevel } from '$lib/components/schemas';
	import {
		SUPPORTED_LANGUAGES,
		LANGUAGE_LEVELS,
		DEFAULT_FRONT_LAYOUT,
		DEFAULT_BACK_LAYOUT
	} from '$lib/constants/template.constants';
	import DeviceFloppyIcon from '@tabler/icons-svelte/icons/device-floppy';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import type { Snippet } from 'svelte';

	interface Props {
		initialData?: Partial<TemplateFormData>;
		onSubmit: (data: TemplateFormData) => Promise<void>;
		onPreview?: () => void;
		isLoading?: boolean;
		submitLabel?: string;
		cancel?: Snippet;
	}

	let {
		initialData = {},
		onSubmit,
		onPreview,
		isLoading = false,
		submitLabel = 'Save Template',
		cancel
	}: Props = $props();

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

	async function handleSubmit() {
		// Use the validateForm method from superForm which automatically checks all fields
		const result = await form.validateForm();

		// If the form is valid, submit it
		if (result.valid && $formData) {
			onSubmit($formData);
		}
	}
</script>

<form
	class="space-y-6"
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Template Information -->
		<Card>
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
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

				<Separator />

				<div class="grid grid-cols-2 gap-4">
					<Form.Field {form} name="nativeLanguage">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Native Language *</Form.Label>
								<Select.Root type="single" bind:value={$formData.nativeLanguage} {...props}>
									<Select.Trigger>
										{SUPPORTED_LANGUAGES.find((l) => l.value === $formData.nativeLanguage)?.label ||
											'Select language'}
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

		<!-- Layout Templates -->
		<Card>
			<CardHeader>
				<CardTitle>Layout Templates</CardTitle>
				<CardDescription>
					Define the HTML structure for front and back of flashcards
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<Form.Field {form} name="frontLayout">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Front Layout</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.frontLayout}
								placeholder="HTML template for the front of the flashcard"
								rows={6}
								class="font-mono text-sm"
								{...$constraints.frontLayout}
							/>
							<Form.Description>
								Use &#123;&#123;fieldName&#125;&#125; to insert field values
							</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="backLayout">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Back Layout</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.backLayout}
								placeholder="HTML template for the back of the flashcard"
								rows={6}
								class="font-mono text-sm"
								{...$constraints.backLayout}
							/>
							<Form.Description>
								Use &#123;&#123;fieldName&#125;&#125; to insert field values
							</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</CardContent>
		</Card>
	</div>

	<!-- Actions -->
	<div class="flex justify-between">
		<div class="flex gap-2">
			{@render cancel?.()}
		</div>
		<div class="flex gap-2">
			{#if onPreview}
				<Button
					type="button"
					variant="outline"
					disabled={isLoading}
					onclick={() => {
						if (onPreview) onPreview();
					}}
				>
					<EyeIcon class="mr-2 h-4 w-4" />
					Preview
				</Button>
			{/if}
			<Button
				type="button"
				disabled={isLoading || !$formData.name.trim()}
				onclick={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				{#if isLoading}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
				{:else}
					<DeviceFloppyIcon class="mr-2 h-4 w-4" />
				{/if}
				{submitLabel}
			</Button>
		</div>
	</div>
</form>
