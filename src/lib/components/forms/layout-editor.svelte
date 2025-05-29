<script lang="ts">
	import { Edra, EdraToolbar } from '$lib/components/edra/shadcn/index';
	import type { Editor } from '@tiptap/core';
	import type { FieldData } from '$lib/schemas/field.schemas';

	interface Props {
		editor?: Editor;
		content: string;
		onUpdate: ({ editor }: { editor: Editor }) => void;
		fields: FieldData[];
		previewContent: string;
	}

	let {
		editor = undefined,
		content = '',
		onUpdate,
		fields = [],
		previewContent = ''
	}: Props = $props();

	// Generate placeholder from field label
	function getFieldPlaceholder(field: FieldData): string {
		return `{{${field.label.toLowerCase().replace(/\s+/g, '_')}}}`;
	}

	// Insert placeholder into editor
	function insertPlaceholder(placeholder: string) {
		if (!editor) return;
		editor.chain().focus().insertContent(placeholder).run();
	}
</script>

<div class="space-y-6">
	<!-- Available Fields Info -->
	{#if fields.length > 0}
		<div class="bg-muted/50 rounded-lg p-4">
			<h4 class="mb-2 text-sm font-medium">Available Field Placeholders:</h4>
			<div class="flex flex-wrap gap-2">
				{#each fields as field (field.id)}
					{@const placeholder = getFieldPlaceholder(field)}
					<div class="flex items-center gap-1">
						<code class="bg-background rounded border px-2 py-1 text-xs">
							{placeholder}
						</code>
						<button
							type="button"
							class="ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-6 items-center justify-center rounded-md bg-transparent px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
							onclick={() => insertPlaceholder(placeholder)}
							title="Insert into layout"
						>
							Insert
						</button>
					</div>
				{/each}
			</div>
			<p class="text-muted-foreground mt-2 text-xs">
				Click Insert to add placeholders to the layout
			</p>
		</div>
	{:else}
		<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
			<p class="text-sm text-orange-800">
				💡 Add fields first to see available placeholders for your layouts
			</p>
		</div>
	{/if}

	<!-- Toolbar -->
	<div class="w-full">
		{#if editor}
			<EdraToolbar {editor} />
		{/if}
	</div>

	<!-- Editor and Preview Side by Side -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
		<!-- Editor -->
		<div class="space-y-4">
			<div class="min-h-[300px] rounded-md border">
				<Edra bind:editor {content} {onUpdate} class="py-4" showSlashCommands={false} />
			</div>
		</div>

		<!-- Live Preview -->
		<div class="space-y-4">
			{#if fields.length > 0}
				<div class="bg-card min-h-[300px] rounded-lg border px-8 py-6">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html previewContent}
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
</div>
