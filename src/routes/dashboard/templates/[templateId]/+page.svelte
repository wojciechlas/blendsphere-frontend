<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import EditIcon from '@tabler/icons-svelte/icons/edit';
	import CopyIcon from '@tabler/icons-svelte/icons/copy';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import { getLanguageName } from '$lib/constants/template.constants';
	import { templateService } from '$lib/services/template.service';
	import { fieldService } from '$lib/services/field.service';
	import { formatRelativeTime } from '$lib/utils';
	import DeleteConfirmationModal from '$lib/components/delete-confirmation-modal.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: templateId = $page.params.templateId;

	let isLoading = false;
	let error = '';
	let success = '';
	let showDeleteConfirmation = false;

	function handleBack() {
		goto('/dashboard/templates');
	}

	function handleEdit() {
		goto(`/dashboard/templates/${templateId}/edit`);
	}

	async function handleDuplicate() {
		if (!confirm(`Are you sure you want to duplicate "${data.template.name}"?`)) {
			return;
		}

		try {
			isLoading = true;
			error = '';
			success = '';

			// Clone the template
			const newTemplate = await templateService.clone(templateId, `Copy of ${data.template.name}`);

			// Clone all fields as well
			if (data.fields && data.fields.length > 0) {
				for (const field of data.fields) {
					await fieldService.create({
						...field,
						template: newTemplate.id
					});
				}
			}

			success = 'Template duplicated successfully!';

			// Redirect to the new template after a short delay
			setTimeout(() => {
				goto(`/dashboard/templates/${newTemplate.id}`);
			}, 1500);
		} catch (err: unknown) {
			error = (err as Error)?.message || 'Failed to duplicate template. Please try again.';
			console.error('Error duplicating template:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleDelete() {
		showDeleteConfirmation = true;
	}

	async function confirmDelete() {
		try {
			isLoading = true;
			error = '';
			success = '';

			// Delete all fields first
			if (data.fields && data.fields.length > 0) {
				for (const field of data.fields) {
					await fieldService.delete(field.id);
				}
			}

			// Then delete the template
			await templateService.delete(templateId);

			success = 'Template deleted successfully!';

			// Redirect to templates list after a short delay
			setTimeout(() => {
				goto('/dashboard/templates');
			}, 1000);
		} catch (err: unknown) {
			error = (err as Error)?.message || 'Failed to delete template. Please try again.';
			console.error('Error deleting template:', err);
		} finally {
			isLoading = false;
			showDeleteConfirmation = false;
		}
	}

	function getFieldTypeLabel(type: string) {
		return type.toLowerCase().charAt(0).toUpperCase() + type.toLowerCase().slice(1);
	}

	// Generate sample data for preview
	function generateSampleData(fields: typeof data.fields) {
		const sampleData: Record<string, string> = {};

		fields.forEach((field) => {
			switch (field.label.toLowerCase()) {
				case 'word':
				case 'vocabulary':
				case 'term':
					sampleData[field.label] = field.example || 'casa';
					break;
				case 'translation':
				case 'meaning':
					sampleData[field.label] = field.example || 'house';
					break;
				case 'sentence':
				case 'example':
				case 'context':
					sampleData[field.label] = field.example || 'Mi casa es muy grande.';
					break;
				case 'pronunciation':
				case 'phonetic':
					sampleData[field.label] = field.example || '/ˈka.sa/';
					break;
				case 'definition':
				case 'description':
					sampleData[field.label] = field.example || 'A building for human habitation.';
					break;
				case 'notes':
				case 'hint':
					sampleData[field.label] = field.example || 'Remember: feminine noun (la casa)';
					break;
				default:
					sampleData[field.label] = field.example || `Sample ${field.label}`;
			}
		});

		return sampleData;
	}

	// Replace placeholders in layout with sample data
	function renderLayout(layout: string, sampleData: Record<string, string>): string {
		let rendered = layout;

		// Replace placeholders like {{fieldName}} with sample data
		Object.entries(sampleData).forEach(([fieldName, value]) => {
			// Create variations of the placeholder to handle whitespace
			const exactPlaceholder = `{{${fieldName}}}`;
			const spaceVariations = [
				`{{ ${fieldName} }}`,
				`{{ ${fieldName}}}`,
				`{{${fieldName} }}`,
				`{{  ${fieldName}  }}`,
				`{{	${fieldName}	}}` // tab variations
			];

			// Replace exact match first
			rendered = rendered.replace(exactPlaceholder, value);

			// Then handle common whitespace variations
			spaceVariations.forEach((variation) => {
				rendered = rendered.replace(variation, value);
			});

			// Handle case-insensitive replacements for common variations
			const lowerFieldName = fieldName.toLowerCase();
			if (lowerFieldName !== fieldName) {
				const lowerPlaceholder = `{{${lowerFieldName}}}`;
				rendered = rendered.replace(lowerPlaceholder, value);
			}
		});

		// Clean up any remaining placeholders that don't have sample data
		rendered = rendered.replace(
			/\{\{[^}]+\}\}/g,
			'<span class="text-muted-foreground italic">[Field placeholder]</span>'
		);

		return rendered;
	}

	// Reactive computations for previews
	$: sampleData = generateSampleData(data.fields);
	$: frontPreview = renderLayout(data.template.frontLayout, sampleData);
	$: backPreview = renderLayout(data.template.backLayout, sampleData);
</script>

<svelte:head>
	<title>{data.template.name} - BlendSphere</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 p-6">
	<!-- Messages -->
	{#if error}
		<div class="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
			{success}
		</div>
	{/if}

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="sm" onclick={handleBack}>
				<ArrowLeftIcon class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">{data.template.name}</h1>
				<p class="text-muted-foreground">
					{data.template.description || 'No description provided'}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={handleDuplicate} disabled={isLoading}>
				<CopyIcon class="mr-2 h-4 w-4" />
				{isLoading ? 'Duplicating...' : 'Duplicate'}
			</Button>
			<Button variant="outline" size="sm" onclick={handleEdit} disabled={isLoading}>
				<EditIcon class="mr-2 h-4 w-4" />
				Edit
			</Button>
			<Button variant="destructive" size="sm" onclick={handleDelete} disabled={isLoading}>
				<TrashIcon class="mr-2 h-4 w-4" />
				{isLoading ? 'Deleting...' : 'Delete'}
			</Button>
		</div>
	</div>

	<!-- Template Details -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Basic Information -->
		<Card>
			<CardHeader>
				<CardTitle>Template Information</CardTitle>
				<CardDescription>Basic details about this template</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex justify-between">
					<span class="font-medium">Updated:</span>
					<span>{formatRelativeTime(data.template.updated)}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">Native Language:</span>
					<span>{getLanguageName(data.template.nativeLanguage)}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">Learning Language:</span>
					<span>{getLanguageName(data.template.learningLanguage)}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">Language Level:</span>
					<Badge variant="secondary">{data.template.languageLevel}</Badge>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">Visibility:</span>
					<Badge variant={data.template.isPublic ? 'default' : 'outline'}>
						{data.template.isPublic ? 'Public' : 'Private'}
					</Badge>
				</div>
			</CardContent>
		</Card>

		<!-- Fields -->
		<Card>
			<CardHeader>
				<CardTitle>Fields ({data.fields.length})</CardTitle>
				<CardDescription>Data fields defined for this template</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.fields.length === 0}
					<p class="text-muted-foreground text-sm">No fields defined</p>
				{:else}
					<div class="space-y-3">
						{#each data.fields as field (field.id)}
							<div class="flex items-center justify-between rounded-md border p-3">
								<div>
									<div class="font-medium">{field.label}</div>
									{#if field.description}
										<div class="text-muted-foreground text-sm">{field.description}</div>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="text-xs">
										{getFieldTypeLabel(field.type)}
									</Badge>
									<Badge variant={field.isInput ? 'default' : 'secondary'} class="text-xs">
										{field.isInput ? 'Input' : 'Generated'}
									</Badge>
									<Badge variant="outline" class="text-xs">
										{getLanguageName(field.language)}
									</Badge>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Layouts -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Front Layout -->
		<Card>
			<CardHeader>
				<CardTitle>Front Layout</CardTitle>
				<CardDescription>HTML template for the front side of flashcards</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<!-- Rendered Preview -->
				<div>
					<div class="bg-card layout-preview min-h-[120px] rounded-md border p-4">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html frontPreview}
					</div>
				</div>

				<!-- Raw HTML Source -->
				<details class="space-y-2">
					<summary
						class="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium"
					>
						View HTML Source
					</summary>
					<div class="bg-muted rounded-md p-3 text-sm">
						<pre class="font-mono text-xs whitespace-pre-wrap">{data.template.frontLayout}</pre>
					</div>
				</details>
			</CardContent>
		</Card>

		<!-- Back Layout -->
		<Card>
			<CardHeader>
				<CardTitle>Back Layout</CardTitle>
				<CardDescription>HTML template for the back side of flashcards</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<!-- Rendered Preview -->
				<div>
					<div class="bg-card layout-preview min-h-[120px] rounded-md border p-4">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html backPreview}
					</div>
				</div>

				<!-- Raw HTML Source -->
				<details class="space-y-2">
					<summary
						class="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium"
					>
						View HTML Source
					</summary>
					<div class="bg-muted rounded-md p-3 text-sm">
						<pre class="font-mono text-xs whitespace-pre-wrap">{data.template.backLayout}</pre>
					</div>
				</details>
			</CardContent>
		</Card>
	</div>
</div>

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
	bind:open={showDeleteConfirmation}
	title="Delete Template"
	description="This will permanently delete the template and all associated fields. Any flashcards using this template will no longer have access to the template structure."
	itemName={data.template.name}
	itemType="template"
	fieldCount={data.fields.length}
	{isLoading}
	onConfirm={confirmDelete}
/>

<style>
	:global(.layout-preview) {
		font-family: inherit;
		line-height: 1.6;
	}

	:global(.layout-preview h1) {
		font-size: 1.5em;
		font-weight: bold;
		margin-bottom: 0.5em;
	}

	:global(.layout-preview h2) {
		font-size: 1.3em;
		font-weight: bold;
		margin-bottom: 0.4em;
	}

	:global(.layout-preview h3) {
		font-size: 1.1em;
		font-weight: bold;
		margin-bottom: 0.3em;
	}

	:global(.layout-preview p) {
		margin-bottom: 0.8em;
	}

	:global(.layout-preview strong) {
		font-weight: 600;
	}

	:global(.layout-preview em) {
		font-style: italic;
	}

	:global(.layout-preview .text-muted-foreground) {
		color: rgb(100 116 139);
	}
</style>
