<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import TemplateForm from '$lib/components/forms/template-form.svelte';
	import { templateService } from '$lib/services/template.service';
	import { fieldService } from '$lib/services/field.service';
	import { type TemplateFormData } from '$lib/schemas/template.schemas';
	import type { FieldData } from '$lib/schemas/field.schemas';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import type { PageData } from './$types';
	import { Language } from '$lib/components/schemas';

	let { data }: { data: PageData } = $props();

	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	// Get template ID from URL params
	let templateId = $derived($page.params.templateId);

	// Transform template data for the form (excluding fields)
	let initialData = $derived({
		name: data.template.name,
		description: data.template.description,
		nativeLanguage: data.template.nativeLanguage,
		learningLanguage: data.template.learningLanguage,
		languageLevel: data.template.languageLevel,
		frontLayout: data.template.frontLayout,
		backLayout: data.template.backLayout,
		styles: data.template.styles,
		isPublic: data.template.isPublic
	});

	// Transform fields to match FieldData type expected by the form
	let initialFields = $derived(
		data.fields.map((field) => ({
			id: field.id,
			template: field.template,
			type: field.type,
			isInput: field.isInput,
			language: field.language as Language, // Cast to enum type
			label: field.label,
			description: field.description,
			example: field.example
		}))
	);

	async function handleSave(formData: TemplateFormData & { fields: FieldData[] }) {
		try {
			saving = true;
			error = '';
			success = '';

			// Separate fields from template data
			const { fields, ...templateData } = formData;

			// Update template data (excluding auto-generated fields)
			const templateUpdateData = {
				...templateData,
				version: data.template.version // Keep the existing version for now
			};

			// Update the template
			await templateService.update(templateId, templateUpdateData);

			// Handle fields - we need to:
			// 1. Update existing fields
			// 2. Create new fields
			// 3. Delete removed fields

			// Get current field IDs from the database
			const currentFieldsResult = await fieldService.listByTemplate(templateId);
			const currentFieldIds = new Set(currentFieldsResult.items.map((f) => f.id));

			// Get field IDs from the form (existing fields have IDs, new ones don't)
			const formFieldIds = new Set(
				fields.filter((f) => f.id && !f.id.startsWith('temp-')).map((f) => f.id)
			);

			// Delete fields that are no longer in the form
			const fieldsToDelete = [...currentFieldIds].filter((id) => !formFieldIds.has(id));
			for (const fieldId of fieldsToDelete) {
				await fieldService.delete(fieldId);
			}

			// Update or create fields
			for (const field of fields) {
				if (field.id && !field.id.startsWith('temp-') && currentFieldIds.has(field.id)) {
					// Update existing field
					const { id: _id, ...fieldData } = field;
					await fieldService.update(field.id, {
						...fieldData,
						template: templateId
					});
				} else {
					// Create new field (either no ID or temp ID)
					const { id: _id, ...fieldData } = field;
					await fieldService.create({
						...fieldData,
						template: templateId
					});
				}
			}

			success = 'Template updated successfully!';

			// Redirect to template list after a short delay
			setTimeout(() => {
				goto('/dashboard/templates');
			}, 1500);
		} catch (err: unknown) {
			error = (err as Error)?.message || 'Failed to update template. Please try again.';
			console.error('Error updating template:', err);
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/dashboard/templates');
	}
</script>

<svelte:head>
	<title>Edit Template - {data.template.name} - BlendSphere</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="sm" onclick={handleCancel}>
			<ArrowLeftIcon class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Edit Template</h1>
			<p class="text-muted-foreground">
				Modify the structure and appearance of "{data.template.name}"
			</p>
		</div>
	</div>

	<!-- Messages -->
	{#if error}
		<div class="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="rounded-md bg-green-100 p-3 text-sm text-green-800">
			{success}
		</div>
	{/if}

	<!-- Template Form -->
	<TemplateForm
		{initialData}
		{initialFields}
		onSubmit={handleSave}
		isLoading={saving}
		submitLabel="Update Template"
	>
		{#snippet cancel()}
			<Button variant="outline" disabled={saving} onclick={handleCancel}>Cancel</Button>
		{/snippet}
	</TemplateForm>
</div>
