<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import TemplateForm from '$lib/components/forms/template-form.svelte';
	import { templateService } from '$lib/services/template.service';
	import { fieldService } from '$lib/services/field.service';
	import { templateFormSchema, type TemplateFormData } from '$lib/schemas/template.schemas';
	import type { FieldData } from '$lib/schemas/field.schemas';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import { pb } from '$lib/pocketbase';

	let saving = false;
	let error = '';
	let success = '';

	async function handleSave(data: TemplateFormData & { fields: FieldData[] }) {
		try {
			saving = true;
			error = '';
			success = '';

			// Separate fields from template data
			const { fields, ...templateData } = data;

			// Set up template data with author and user information
			const templateCreateData = {
				...templateData,
				version: '1.0.0',
				author: pb.authStore.record?.id || '',
				user: pb.authStore.record?.id || ''
			};

			// Create the template first
			const newTemplate = await templateService.create(templateCreateData);

			// Create fields if any exist
			if (fields && fields.length > 0) {
				for (const field of fields) {
					// Prepare field data for creation (remove temp ID if exists)
					const { id, ...fieldData } = field;

					await fieldService.create({
						...fieldData,
						template: newTemplate.id
					});
				}
			}

			success = 'Template created successfully!';

			// Redirect to template list after a short delay
			setTimeout(() => {
				goto('/dashboard/templates');
			}, 1500);
		} catch (err: any) {
			error = err?.message || 'Failed to create template. Please try again.';
			console.error('Error creating template:', err);
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/dashboard/templates');
	}

	function handlePreview() {
		// For now, just show an alert
		// In a real implementation, this would open a modal or navigate to a preview page
		alert('Preview functionality will be implemented soon');
	}
</script>

<svelte:head>
	<title>Create Template - BlendSphere</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="sm" onclick={handleCancel}>
			<ArrowLeftIcon class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Create Template</h1>
			<p class="text-muted-foreground">Define the structure and appearance of your flashcards</p>
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
		onSubmit={handleSave}
		onPreview={handlePreview}
		isLoading={saving}
		submitLabel="Save Template"
	>
		{#snippet cancel()}
			<Button variant="outline" disabled={saving} onclick={handleCancel}>Cancel</Button>
		{/snippet}
	</TemplateForm>
</div>
