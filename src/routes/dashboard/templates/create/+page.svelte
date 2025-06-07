<script lang="ts">
	import { goto } from '$app/navigation';
	import TemplateForm from '$lib/components/forms/template-form.svelte';
	import { templateService } from '$lib/services/template.service';
	import { fieldService } from '$lib/services/field.service';
	import { type TemplateFormData } from '$lib/schemas/template.schemas';
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
			const newTemplate = await templateService.create(templateCreateData); // Create fields if any exist
			if (fields && fields.length > 0) {
				for (const field of fields) {
					console.log('Creating field:', field);
					// Remove id property for new fields to let PocketBase auto-generate it
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { id, ...fieldWithoutId } = field;
					await fieldService.create({
						...fieldWithoutId,
						template: newTemplate.id
					});
				}
			}

			success = 'Template created successfully!';

			// Redirect to template list after a short delay
			setTimeout(() => {
				goto('/dashboard/templates');
			}, 1500);
		} catch (err: unknown) {
			error = (err as Error)?.message || 'Failed to create template. Please try again.';
			console.error('Error creating template:', err);
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/dashboard/templates');
	}
</script>

<svelte:head>
	<title>Create Template - BlendSphere</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<button
			class="hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-2.5"
			onclick={handleCancel}
		>
			<ArrowLeftIcon class="h-4 w-4" />
		</button>
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
	<TemplateForm onSubmit={handleSave} isLoading={saving} submitLabel="Save Template">
		{#snippet cancel()}
			<button
				class="bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
				disabled={saving}
				onclick={handleCancel}
			>
				Cancel
			</button>
		{/snippet}
	</TemplateForm>
</div>
