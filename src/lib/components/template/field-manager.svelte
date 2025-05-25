<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { fieldService, type Field } from '$lib/services/field.service';
	import { onMount } from 'svelte';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import EditIcon from '@tabler/icons-svelte/icons/edit';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import GripVerticalIcon from '@tabler/icons-svelte/icons/grip-vertical';

	export let templateId: string;

	let fields: Field[] = [];
	let loading = true;
	let error = '';
	let showDialog = false;
	let editingField: Field | null = null;

	// Form state
	let fieldLabel = '';
	let fieldType: 'TEXT' | 'IMAGE' | 'AUDIO' = 'TEXT';
	let fieldLanguage: 'EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PL' = 'EN';
	let fieldIsInput = true;
	let fieldDescription = '';
	let fieldExample = '';

	const languages = [
		{ value: 'EN', label: 'English' },
		{ value: 'ES', label: 'Spanish' },
		{ value: 'FR', label: 'French' },
		{ value: 'DE', label: 'German' },
		{ value: 'IT', label: 'Italian' },
		{ value: 'PL', label: 'Polish' }
	];

	const fieldTypes = [
		{ value: 'TEXT', label: 'Text' },
		{ value: 'IMAGE', label: 'Image' },
		{ value: 'AUDIO', label: 'Audio' }
	];

	onMount(() => {
		loadFields();
	});

	async function loadFields() {
		try {
			loading = true;
			error = '';
			const result = await fieldService.listByTemplate(templateId);
			fields = result.items;
		} catch (err) {
			error = 'Failed to load fields. Please try again.';
			console.error('Error loading fields:', err);
		} finally {
			loading = false;
		}
	}

	function openAddDialog() {
		editingField = null;
		resetForm();
		showDialog = true;
	}

	function openEditDialog(field: Field) {
		editingField = field;
		fieldLabel = field.label;
		fieldType = field.type;
		fieldLanguage = field.language;
		fieldIsInput = field.isInput;
		fieldDescription = field.description || '';
		fieldExample = field.example || '';
		showDialog = true;
	}

	function resetForm() {
		fieldLabel = '';
		fieldType = 'TEXT';
		fieldLanguage = 'EN';
		fieldIsInput = true;
		fieldDescription = '';
		fieldExample = '';
	}

	async function handleSaveField() {
		try {
			const fieldData = {
				template: templateId,
				label: fieldLabel.trim(),
				type: fieldType,
				language: fieldLanguage,
				isInput: fieldIsInput,
				description: fieldDescription.trim() || undefined,
				example: fieldExample.trim() || undefined
			};

			if (editingField) {
				await fieldService.update(editingField.id, fieldData);
			} else {
				await fieldService.create(fieldData);
			}

			showDialog = false;
			resetForm();
			await loadFields();
		} catch (err) {
			error = `Failed to ${editingField ? 'update' : 'create'} field. Please try again.`;
			console.error('Error saving field:', err);
		}
	}

	async function handleDeleteField(field: Field) {
		if (
			!confirm(
				`Are you sure you want to delete the field "${field.label}"? This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			await fieldService.delete(field.id);
			await loadFields();
		} catch (err) {
			error = 'Failed to delete field. Please try again.';
			console.error('Error deleting field:', err);
		}
	}

	function getFieldTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
		const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
			TEXT: 'default',
			IMAGE: 'secondary',
			AUDIO: 'outline'
		};
		return variants[type] || 'default';
	}

	function getLanguageLabel(code: string): string {
		return languages.find((l) => l.value === code)?.label || code;
	}

	// Validate form
	$: isFormValid = fieldLabel.trim().length > 0 && fieldLabel.trim().length <= 50;
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold">Template Fields</h3>
			<p class="text-muted-foreground text-sm">
				Define what information each flashcard will contain
			</p>
		</div>
		<Button onclick={openAddDialog}>
			<PlusIcon class="mr-2 h-4 w-4" />
			Add Field
		</Button>
	</div>

	<!-- Error message -->
	{#if error}
		<div class="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
			{error}
		</div>
	{/if}

	<!-- Fields list -->
	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<Card class="animate-pulse">
					<CardHeader class="pb-2">
						<div class="bg-muted h-4 w-1/3 rounded"></div>
					</CardHeader>
					<CardContent>
						<div class="bg-muted h-3 w-full rounded"></div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if fields.length === 0}
		<Card>
			<CardContent class="py-8 text-center">
				<p class="text-muted-foreground mb-4">No fields defined yet</p>
				<Button variant="outline" onclick={openAddDialog}>
					<PlusIcon class="mr-2 h-4 w-4" />
					Add Your First Field
				</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-3">
			{#each fields as field (field.id)}
				<Card>
					<CardHeader class="pb-2">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<GripVerticalIcon class="text-muted-foreground h-4 w-4 cursor-move" />
								<div>
									<CardTitle class="text-base">{field.label}</CardTitle>
									<div class="mt-1 flex items-center gap-2">
										<Badge variant={getFieldTypeBadgeVariant(field.type)}>
											{field.type}
										</Badge>
										<Badge variant="outline">
											{getLanguageLabel(field.language)}
										</Badge>
										<Badge variant={field.isInput ? 'default' : 'secondary'}>
											{field.isInput ? 'User Input' : 'AI Generated'}
										</Badge>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-1">
								<Button variant="ghost" size="sm" onclick={() => openEditDialog(field)}>
									<EditIcon class="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onclick={() => handleDeleteField(field)}>
									<TrashIcon class="text-destructive h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardHeader>
					{#if field.description || field.example}
						<CardContent class="pt-0">
							{#if field.description}
								<p class="text-muted-foreground mb-2 text-sm">
									<strong>Description:</strong>
									{field.description}
								</p>
							{/if}
							{#if field.example}
								<p class="text-muted-foreground text-sm">
									<strong>Example:</strong>
									{field.example}
								</p>
							{/if}
						</CardContent>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Field Requirements Info -->
	<Card class="bg-muted/50">
		<CardHeader class="pb-2">
			<CardTitle class="text-sm">Field Requirements</CardTitle>
		</CardHeader>
		<CardContent class="text-muted-foreground space-y-1 text-xs">
			<p>• At least one <strong>User Input</strong> field is required</p>
			<p>• <strong>AI Generated</strong> fields will be automatically populated</p>
			<p>• Field labels must be unique within the template</p>
			<p>• Maximum 20 fields per template</p>
		</CardContent>
	</Card>
</div>

<!-- Add/Edit Field Dialog -->
<Dialog.Root bind:open={showDialog}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				{editingField ? 'Edit Field' : 'Add New Field'}
			</Dialog.Title>
			<Dialog.Description>
				{editingField ? 'Update the field configuration' : 'Define a new field for your template'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			onsubmit={(e) => {
				e.preventDefault();
				handleSaveField();
			}}
		>
			<div class="space-y-2">
				<Label for="field-label">Label <span class="text-destructive">*</span></Label>
				<Input
					id="field-label"
					bind:value={fieldLabel}
					placeholder="e.g., Spanish Word"
					maxlength={50}
					required
				/>
				<div class="text-muted-foreground text-xs">
					{fieldLabel.length}/50 characters
				</div>
			</div>

			<div class="space-y-2">
				<Label>Field Type <span class="text-destructive">*</span></Label>
				<Select.Root type="single" bind:value={fieldType}>
					<Select.Trigger>
						{fieldTypes.find((t) => t.value === fieldType)?.label || 'Select type'}
					</Select.Trigger>
					<Select.Content>
						{#each fieldTypes as type}
							<Select.Item value={type.value}>{type.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label>Language <span class="text-destructive">*</span></Label>
				<Select.Root type="single" bind:value={fieldLanguage}>
					<Select.Trigger>
						{languages.find((l) => l.value === fieldLanguage)?.label || 'Select language'}
					</Select.Trigger>
					<Select.Content>
						{#each languages as language}
							<Select.Item value={language.value}>{language.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label>Field Source <span class="text-destructive">*</span></Label>
				<div class="flex gap-2">
					<Button
						type="button"
						variant={fieldIsInput ? 'default' : 'outline'}
						size="sm"
						onclick={() => (fieldIsInput = true)}
						class="flex-1"
					>
						User Input
					</Button>
					<Button
						type="button"
						variant={!fieldIsInput ? 'default' : 'outline'}
						size="sm"
						onclick={() => (fieldIsInput = false)}
						class="flex-1"
					>
						AI Generated
					</Button>
				</div>
				<div class="text-muted-foreground text-xs">
					{fieldIsInput ? 'Users will provide this information' : 'AI will generate this content'}
				</div>
			</div>

			<div class="space-y-2">
				<Label for="field-description">Description</Label>
				<Textarea
					id="field-description"
					bind:value={fieldDescription}
					placeholder="Used as context for AI generation (optional)"
					maxlength={500}
					rows={2}
				/>
				<div class="text-muted-foreground text-xs">
					{fieldDescription.length}/500 characters
				</div>
			</div>

			<div class="space-y-2">
				<Label for="field-example">Example</Label>
				<Input
					id="field-example"
					bind:value={fieldExample}
					placeholder="Sample value for preview (optional)"
					maxlength={200}
				/>
				<div class="text-muted-foreground text-xs">
					{fieldExample.length}/200 characters
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showDialog = false)}>Cancel</Button>
				<Button type="submit" disabled={!isFormValid}>
					{editingField ? 'Update Field' : 'Add Field'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
