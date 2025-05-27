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
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Separator } from '$lib/components/ui/separator';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import { fieldFormSchema, type FieldFormData, type FieldData } from '$lib/schemas/field.schemas';
	import { Language } from '$lib/components/schemas';
	import { SUPPORTED_LANGUAGES, FIELD_TYPES } from '$lib/constants/template.constants';
	import { fieldService } from '$lib/services/field.service';
	import { createEventDispatcher, onMount } from 'svelte';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconEdit from '@tabler/icons-svelte/icons/edit';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconGripVertical from '@tabler/icons-svelte/icons/grip-vertical';
	import IconSparkles from '@tabler/icons-svelte/icons/sparkles';
	import IconUser from '@tabler/icons-svelte/icons/user';

	// Props
	interface Props {
		templateId?: string; // Optional for new templates
		initialFields?: FieldData[];
		nativeLanguage?: Language;
		learningLanguage?: Language;
		readonly?: boolean;
	}

	let {
		templateId,
		initialFields = [],
		nativeLanguage = Language.EN,
		learningLanguage = Language.ES,
		readonly = false
	}: Props = $props();

	// State
	let fields = $state<FieldData[]>(initialFields);
	let showFieldDialog = $state(false);
	let editingField = $state<FieldData | null>(null);
	let fieldToDelete = $state<FieldData | null>(null);
	let isSubmitting = $state(false);
	let draggedIndex = $state<number | null>(null);
	let hoveredIndex = $state<number | null>(null);

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		fieldsChanged: FieldData[];
		fieldAdded: FieldData;
		fieldUpdated: FieldData;
		fieldDeleted: string;
	}>();

	// Create prioritized language list (native and learning languages first)
	const prioritizedLanguages = $derived(() => {
		const otherLanguages = SUPPORTED_LANGUAGES.filter(
			(lang) => lang.value !== nativeLanguage && lang.value !== learningLanguage
		);

		const prioritized: Array<(typeof SUPPORTED_LANGUAGES)[number]> = [];
		if (nativeLanguage) {
			const nativeLang = SUPPORTED_LANGUAGES.find((l) => l.value === nativeLanguage);
			if (nativeLang) prioritized.push(nativeLang);
		}
		if (learningLanguage && learningLanguage !== nativeLanguage) {
			const learningLang = SUPPORTED_LANGUAGES.find((l) => l.value === learningLanguage);
			if (learningLang) prioritized.push(learningLang);
		}

		return [...prioritized, ...otherLanguages];
	});

	// Form setup
	const defaultFieldData: FieldFormData = {
		template: templateId || '',
		type: 'TEXT',
		isInput: true,
		language: learningLanguage, // Default to learning language
		label: '',
		description: '',
		example: ''
	};

	const form = superForm(defaultFieldData, {
		SPA: true,
		validators: zodClient(fieldFormSchema),
		dataType: 'json',
		resetForm: true
	});

	const { form: formData, enhance, errors, constraints, submitting, submit } = form;

	// Load fields on mount if templateId is provided
	onMount(async () => {
		if (templateId && !initialFields.length) {
			await loadFields();
		}
	});

	// Load fields from server
	async function loadFields() {
		if (!templateId) return;

		try {
			const result = await fieldService.listByTemplate(templateId);
			fields = result.items as FieldData[];
			dispatch('fieldsChanged', fields);
		} catch (error) {
			console.error('Error loading fields:', error);
		}
	}

	// Open field dialog for adding/editing
	function openFieldDialog(field?: FieldData) {
		editingField = field || null;
		if (field) {
			// Populate form with existing field data
			$formData = {
				template: field.template,
				type: field.type,
				isInput: field.isInput,
				language: field.language,
				label: field.label,
				description: field.description || '',
				example: field.example || ''
			};
		} else {
			// Reset form for new field
			$formData = {
				...defaultFieldData,
				template: templateId || '',
				language: learningLanguage || Language.ES
			};
		}
		showFieldDialog = true;
	}

	// Close field dialog
	function closeFieldDialog() {
		showFieldDialog = false;
		editingField = null;
		// Reset form data to default values
		$formData = {
			...defaultFieldData,
			template: templateId || '',
			language: learningLanguage || Language.ES
		};
		// Clear any errors
		errors.set({});
	}

	// Validate field label uniqueness
	function validateFieldLabel(label: string): boolean {
		const trimmedLabel = label.trim().toLowerCase();
		return !fields.some(
			(field) => field.label.toLowerCase() === trimmedLabel && field.id !== editingField?.id
		);
	}

	// Submit field form
	async function handleFieldSubmit() {
		if (readonly) return;

		// Ensure we have required data
		if (!$formData.label?.trim()) {
			errors.set({ ...$errors, label: ['Field label is required'] });
			return;
		}

		// Client-side validation
		if (!validateFieldLabel($formData.label)) {
			errors.set({ ...$errors, label: ['A field with this label already exists'] });
			return;
		}

		isSubmitting = true;

		try {
			if (editingField?.id) {
				// Update existing field
				if (templateId) {
					const updatedField = await fieldService.update(editingField.id, $formData);
					const index = fields.findIndex((f) => f.id === editingField?.id);
					if (index !== -1) {
						fields[index] = updatedField as FieldData;
					}
					dispatch('fieldUpdated', updatedField as FieldData);
				} else {
					// Update in local state for new templates
					const index = fields.findIndex((f) => f.id === editingField?.id);
					if (index !== -1 && editingField) {
						fields[index] = { ...editingField, ...$formData };
						dispatch('fieldUpdated', fields[index]);
					}
				}
			} else {
				// Create new field
				const newFieldData = {
					...$formData,
					id: templateId ? undefined : crypto.randomUUID() // Generate temp ID for new templates
				};

				if (templateId) {
					const newField = await fieldService.create(newFieldData);
					fields = [...fields, newField as FieldData];
					dispatch('fieldAdded', newField as FieldData);
				} else {
					// Add to local state for new templates
					const tempField = { ...newFieldData, id: crypto.randomUUID() } as FieldData;
					fields = [...fields, tempField];
					dispatch('fieldAdded', tempField);
				}
			}

			dispatch('fieldsChanged', fields);
			closeFieldDialog();
		} catch (error) {
			console.error('Error saving field:', error);
		} finally {
			isSubmitting = false;
		}
	}

	// Delete field
	async function handleDeleteField() {
		if (!fieldToDelete || readonly) return;

		try {
			if (templateId && fieldToDelete.id) {
				await fieldService.delete(fieldToDelete.id);
			}

			fields = fields.filter((f) => f.id !== fieldToDelete?.id);
			dispatch('fieldDeleted', fieldToDelete?.id || '');
			dispatch('fieldsChanged', fields);
			fieldToDelete = null;
		} catch (error) {
			console.error('Error deleting field:', error);
		}
	}

	// Drag and drop handlers
	function handleDragStart(event: DragEvent, index: number) {
		if (readonly) return;
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		if (readonly || draggedIndex === null) return;
		event.preventDefault();
		hoveredIndex = index;
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		if (readonly || draggedIndex === null) return;
		event.preventDefault();

		if (draggedIndex !== dropIndex) {
			const draggedField = fields[draggedIndex];
			const newFields = [...fields];
			newFields.splice(draggedIndex, 1);
			newFields.splice(dropIndex, 0, draggedField);
			fields = newFields;
			dispatch('fieldsChanged', fields);
		}

		draggedIndex = null;
		hoveredIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		hoveredIndex = null;
	}

	// Get field type label
	function getFieldTypeLabel(type: string): string {
		return FIELD_TYPES.find((t) => t.value === type)?.label || type;
	}

	// Get language label
	function getLanguageLabel(language: Language): string {
		return SUPPORTED_LANGUAGES.find((l) => l.value === language)?.label || language;
	}

	// Check if template has required input fields
	const hasInputFields = $derived(fields.some((field) => field.isInput));
	const hasOutputFields = $derived(fields.some((field) => !field.isInput));
</script>

<Card class="w-full">
	<CardHeader>
		<div class="flex items-center justify-between">
			<div>
				<CardTitle>Fields</CardTitle>
				<CardDescription>
					Define the fields that will be used in your flashcards. Input fields are provided by
					users, while generated fields are created by AI.
				</CardDescription>
			</div>
			{#if !readonly}
				<Button onclick={() => openFieldDialog()} size="sm">
					<IconPlus class="mr-2 h-4 w-4" />
					Add Field
				</Button>
			{/if}
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if fields.length === 0}
			<div class="text-muted-foreground py-8 text-center">
				<div class="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
					<IconPlus class="h-6 w-6" />
				</div>
				<p class="text-sm font-medium">No fields defined yet</p>
				<p class="text-xs">Add fields to structure your flashcard data</p>
			</div>
		{:else}
			<!-- Field summary -->
			<div class="bg-muted/50 flex gap-4 rounded-lg p-3 text-sm">
				<div class="flex items-center gap-2">
					<IconUser class="h-4 w-4 text-blue-600" />
					<span class="font-medium">{fields.filter((f) => f.isInput).length} Input fields</span>
				</div>
				<div class="flex items-center gap-2">
					<IconSparkles class="h-4 w-4 text-purple-600" />
					<span class="font-medium">{fields.filter((f) => !f.isInput).length} Generated fields</span
					>
				</div>
			</div>

			<!-- Validation warnings -->
			{#if !hasInputFields}
				<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
					<p class="text-destructive text-sm font-medium">⚠️ No input fields defined</p>
					<p class="text-destructive/80 text-xs">
						Add at least one input field so users can provide data for flashcards.
					</p>
				</div>
			{/if}

			<!-- Fields table -->
			<div class="overflow-hidden rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							{#if !readonly}
								<Table.Head class="w-8"></Table.Head>
							{/if}
							<Table.Head>Field</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Language</Table.Head>
							<Table.Head>Source</Table.Head>
							<Table.Head class="w-20">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each fields as field, index (field.id)}
							<Table.Row
								class={`
									${draggedIndex === index ? 'opacity-50' : ''}
									${hoveredIndex === index && draggedIndex !== null ? 'bg-muted/50' : ''}
									${!readonly ? 'cursor-grab active:cursor-grabbing' : ''}
								`}
								draggable={!readonly}
								ondragstart={(e) => handleDragStart(e, index)}
								ondragover={(e) => handleDragOver(e, index)}
								ondrop={(e) => handleDrop(e, index)}
								ondragend={handleDragEnd}
							>
								{#if !readonly}
									<Table.Cell>
										<IconGripVertical class="text-muted-foreground h-4 w-4" />
									</Table.Cell>
								{/if}
								<Table.Cell>
									<div class="space-y-1">
										<div class="font-medium">{field.label}</div>
										{#if field.description}
											<div class="text-muted-foreground text-xs">{field.description}</div>
										{/if}
										{#if field.example}
											<div class="text-xs text-blue-600 italic">e.g., {field.example}</div>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">{getFieldTypeLabel(field.type)}</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">{getLanguageLabel(field.language)}</Badge>
								</Table.Cell>
								<Table.Cell>
									{#if field.isInput}
										<div class="flex items-center gap-1 text-blue-600">
											<IconUser class="h-3 w-3" />
											<span class="text-xs">User input</span>
										</div>
									{:else}
										<div class="flex items-center gap-1 text-purple-600">
											<IconSparkles class="h-3 w-3" />
											<span class="text-xs">AI generated</span>
										</div>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if !readonly}
										<div class="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												class="h-8 w-8"
												onclick={() => openFieldDialog(field)}
											>
												<IconEdit class="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												class="text-destructive hover:text-destructive h-8 w-8"
												onclick={() => (fieldToDelete = field)}
											>
												<IconTrash class="h-3 w-3" />
											</Button>
										</div>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</CardContent>
</Card>

<!-- Field Dialog -->
<Dialog.Root bind:open={showFieldDialog}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>
				{editingField ? 'Edit Field' : 'Add New Field'}
			</Dialog.Title>
			<Dialog.Description>
				Configure the field properties. Input fields are provided by users, while generated fields
				are created by AI.
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-6"
			onsubmit={(e) => {
				e.preventDefault();
				handleFieldSubmit();
			}}
		>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- Field Label -->
				<div class="md:col-span-2">
					<Form.Field {form} name="label">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Field Label *</Form.Label>
								<Input
									{...props}
									bind:value={$formData.label}
									placeholder="e.g., Spanish Word, Translation, Example"
									{...$constraints.label}
								/>
								<Form.Description>
									The display name for this field (used in forms and placeholders)
								</Form.Description>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<!-- Field Type -->
				<Form.Field {form} name="type">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Field Type *</Form.Label>
							<Select.Root type="single" bind:value={$formData.type} {...props}>
								<Select.Trigger>
									{FIELD_TYPES.find((t) => t.value === $formData.type)?.label || 'Select type'}
								</Select.Trigger>
								<Select.Content>
									{#each FIELD_TYPES as type}
										<Select.Item value={type.value}>{type.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Language -->
				<Form.Field {form} name="language">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Language *</Form.Label>
							<Select.Root type="single" bind:value={$formData.language} {...props}>
								<Select.Trigger>
									{prioritizedLanguages().find((l) => l.value === $formData.language)?.label ||
										'Select language'}
								</Select.Trigger>
								<Select.Content>
									{#each prioritizedLanguages() as language, index}
										{#if index === 2}
											<Select.Separator />
										{/if}
										<Select.Item value={language.value}>{language.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Form.Description>Language of the content in this field</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<!-- Field Source -->
			<Form.Field {form} name="isInput">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Field Source *</Form.Label>
						<div class="space-y-3">
							<div class="flex items-center space-x-2">
								<Checkbox.Root
									{...props}
									checked={$formData.isInput}
									onCheckedChange={(checked) => ($formData.isInput = checked)}
								/>
								<div class="grid gap-1.5 leading-none">
									<Form.Label class="text-sm font-normal">User Input Field</Form.Label>
									<Form.Description class="text-xs">
										Users will provide content for this field when creating flashcards
									</Form.Description>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox.Root
									checked={!$formData.isInput}
									onCheckedChange={(checked) => ($formData.isInput = !checked)}
								/>
								<div class="grid gap-1.5 leading-none">
									<Form.Label class="text-sm font-normal">AI Generated Field</Form.Label>
									<Form.Description class="text-xs">
										AI will automatically generate content for this field
									</Form.Description>
								</div>
							</div>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Separator />

			<!-- Description -->
			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Description (Optional)</Form.Label>
						<Textarea
							{...props}
							bind:value={$formData.description}
							placeholder="Describe this field to help users understand what to enter or provide context for AI generation..."
							rows={3}
							{...$constraints.description}
						/>
						<Form.Description>
							{#if $formData.isInput}
								Helps users understand what to enter in this field
							{:else}
								Provides context to help AI generate appropriate content
							{/if}
						</Form.Description>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Example -->
			<Form.Field {form} name="example">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Example (Optional)</Form.Label>
						<Input
							{...props}
							bind:value={$formData.example}
							placeholder="e.g., hola, hello, ¡Hola! ¿Cómo estás?"
							{...$constraints.example}
						/>
						<Form.Description>
							Sample value to show in previews and guide {$formData.isInput
								? 'users'
								: 'AI generation'}
						</Form.Description>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="flex justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={closeFieldDialog}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						Saving...
					{:else}
						{editingField ? 'Update Field' : 'Add Field'}
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root open={fieldToDelete !== null}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Field</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete the field "{fieldToDelete?.label}"? This action cannot be
				undone.
				{#if fieldToDelete}
					<br /><br />
					<strong>Warning:</strong> Any placeholders using this field in your template layouts will need
					to be removed manually.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (fieldToDelete = null)}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDeleteField}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete Field
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
