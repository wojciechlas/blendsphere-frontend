<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import type { Template } from '$lib/services/template.service.js';
	import type { Field } from '$lib/services/field.service.js';

	interface Props {
		open: boolean;
		templates: Template[];
		onSelect: (template: Template) => void;
		onClose: () => void;
		selectedTemplateId?: string;
	}

	let { open = $bindable(), templates, onSelect, onClose, selectedTemplateId }: Props = $props();

	let searchQuery = $state('');
	let selectedTemplate = $state<Template | null>(null);
	let selectedLanguage = $state<string>('all');
	let selectedCategory = $state<string>('all');
	let showPreview = $state(false);

	// Get unique languages and categories
	let languages = $derived([...new Set(templates.map((t) => t.language).filter(Boolean))].sort());

	let categories = $derived([...new Set(templates.flatMap((t) => t.categories || []))].sort());

	// Filter templates
	let filteredTemplates = $derived(
		templates.filter((template) => {
			const matchesSearch =
				template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				template.description?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesLanguage = selectedLanguage === 'all' || template.language === selectedLanguage;

			const matchesCategory =
				selectedCategory === 'all' ||
				(template.categories && template.categories.includes(selectedCategory));

			return matchesSearch && matchesLanguage && matchesCategory;
		})
	);

	// Separate recent and all templates
	let recentTemplates = $derived(
		filteredTemplates
			.filter((template) => template.lastUsed)
			.sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
			.slice(0, 3)
	);

	let allTemplates = $derived(
		filteredTemplates.filter(
			(template) => !recentTemplates.some((recent) => recent.id === template.id)
		)
	);

	const handleTemplateSelect = (template: Template) => {
		selectedTemplate = template;
	};

	const handleContinue = () => {
		if (selectedTemplate) {
			onSelect(selectedTemplate);
			open = false;
		}
	};

	const handleClose = () => {
		selectedTemplate = null;
		searchQuery = '';
		selectedLanguage = 'all';
		selectedCategory = 'all';
		showPreview = false;
		onClose();
		open = false;
	};

	const handlePreview = (template: Template) => {
		selectedTemplate = template;
		showPreview = true;
	};

	const getFieldTypeDisplay = (field: Field): string => {
		switch (field.type) {
			case 'TEXT':
				return 'Text';
			case 'IMAGE':
				return 'Image';
			case 'AUDIO':
				return 'Audio';
			default:
				return field.type;
		}
	};

	// Reset selection when modal opens
	$effect(() => {
		if (open) {
			selectedTemplate = selectedTemplateId
				? templates.find((t) => t.id === selectedTemplateId) || null
				: null;
			searchQuery = '';
			selectedLanguage = 'all';
			selectedCategory = 'all';
			showPreview = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title>Choose Template</Dialog.Title>
			<Dialog.Description>
				Select a template to structure your flashcard content.
			</Dialog.Description>
		</Dialog.Header>

		{#if !showPreview}
			<div class="flex-1 space-y-6 overflow-hidden">
				<!-- Search and Filters -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="relative">
						<SearchIcon
							class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						/>
						<Input bind:value={searchQuery} placeholder="Search templates..." class="pl-10" />
					</div>

					<Select.Root type="single" bind:value={selectedLanguage}>
						<Select.Trigger>
							{selectedLanguage === 'all' ? 'All Languages' : selectedLanguage}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Languages</Select.Item>
							{#each languages as language (language)}
								<Select.Item value={language}>{language}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<Select.Root type="single" bind:value={selectedCategory}>
						<Select.Trigger>
							{selectedCategory === 'all' ? 'All Categories' : selectedCategory}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Categories</Select.Item>
							{#each categories as category (category)}
								<Select.Item value={category}>{category}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex-1 space-y-6 overflow-y-auto">
					<!-- Recent Templates -->
					{#if recentTemplates.length > 0}
						<div class="space-y-3">
							<h3 class="text-foreground text-sm font-medium">Recently Used</h3>
							<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
								{#each recentTemplates as template (template.id)}
									<div
										class={cn(
											'flex flex-col rounded-lg border p-4 transition-colors',
											selectedTemplate?.id === template.id
												? 'border-primary bg-primary/5 ring-primary/20 ring-2'
												: 'border-border hover:border-primary/50'
										)}
									>
										<div class="mb-2 flex items-start justify-between">
											<button
												type="button"
												class="flex-1 text-left"
												onclick={() => handleTemplateSelect(template)}
											>
												<div class="text-foreground font-medium">{template.name}</div>
												{#if template.description}
													<div class="text-muted-foreground mt-1 line-clamp-2 text-sm">
														{template.description}
													</div>
												{/if}
											</button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handlePreview(template)}
												class="ml-2"
											>
												<EyeIcon class="h-4 w-4" />
											</Button>
										</div>
										<div class="mt-2 flex items-center gap-2">
											<Badge variant="secondary" class="text-xs">
												{template.fields?.length || 0} fields
											</Badge>
											{#if template.language}
												<Badge variant="outline" class="text-xs">
													{template.language}
												</Badge>
											{/if}
											{#if template.categories && template.categories.length > 0}
												<Badge variant="outline" class="text-xs">
													{template.categories[0]}
												</Badge>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- All Templates -->
					{#if allTemplates.length > 0}
						<div class="space-y-3">
							<h3 class="text-foreground text-sm font-medium">All Templates</h3>
							<div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
								{#each allTemplates as template (template.id)}
									<div
										class={cn(
											'flex flex-col rounded-lg border p-3 transition-colors',
											selectedTemplate?.id === template.id
												? 'border-primary bg-primary/5 ring-primary/20 ring-2'
												: 'border-border hover:border-primary/50'
										)}
									>
										<div class="mb-2 flex items-start justify-between">
											<button
												type="button"
												class="flex-1 text-left"
												onclick={() => handleTemplateSelect(template)}
											>
												<div class="text-foreground text-sm font-medium">{template.name}</div>
												{#if template.description}
													<div class="text-muted-foreground mt-1 line-clamp-2 text-xs">
														{template.description}
													</div>
												{/if}
											</button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handlePreview(template)}
												class="ml-1"
											>
												<EyeIcon class="h-3 w-3" />
											</Button>
										</div>
										<div class="mt-1 flex items-center gap-1">
											<Badge variant="secondary" class="text-xs">
												{template.fields?.length || 0} fields
											</Badge>
											{#if template.language}
												<Badge variant="outline" class="text-xs">
													{template.language}
												</Badge>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if filteredTemplates.length === 0}
						<div class="text-muted-foreground py-8 text-center">
							<div class="text-lg font-medium">No templates found</div>
							<div class="mt-1 text-sm">
								{searchQuery || selectedLanguage !== 'all' || selectedCategory !== 'all'
									? 'Try adjusting your search or filters'
									: 'No templates available'}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleContinue} disabled={!selectedTemplate}>Continue</Button>
			</Dialog.Footer>
		{:else}
			<!-- Template Preview -->
			<div class="flex-1 space-y-6 overflow-hidden">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="text-lg font-semibold">{selectedTemplate?.name}</h3>
						{#if selectedTemplate?.description}
							<p class="text-muted-foreground mt-1">{selectedTemplate.description}</p>
						{/if}
					</div>
					<div class="flex gap-2">
						{#if selectedTemplate?.language}
							<Badge variant="outline">{selectedTemplate.language}</Badge>
						{/if}
						{#if selectedTemplate?.categories && selectedTemplate.categories.length > 0}
							{#each selectedTemplate.categories as category (category)}
								<Badge variant="secondary">{category}</Badge>
							{/each}
						{/if}
					</div>
				</div>

				<div class="space-y-4 overflow-y-auto">
					<h4 class="font-medium">Template Fields ({selectedTemplate?.fields?.length || 0})</h4>
					{#if selectedTemplate?.fields && selectedTemplate.fields.length > 0}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							{#each selectedTemplate.fields as field (field.id)}
								<div class="space-y-2 rounded-lg border p-3">
									<div class="flex items-start justify-between">
										<div class="font-medium">{field.label}</div>
										<Badge variant="outline" class="text-xs">
											{getFieldTypeDisplay(field)}
										</Badge>
									</div>
									{#if field.description}
										<div class="text-muted-foreground text-sm">{field.description}</div>
									{/if}
									{#if field.required}
										<Badge variant="destructive" class="text-xs">Required</Badge>
									{/if}
									{#if field.options && field.options.length > 0}
										<div class="text-muted-foreground text-xs">
											Options: {field.options.join(', ')}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-muted-foreground py-4 text-center">
							No fields defined for this template.
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="ghost" onclick={() => (showPreview = false)}>Back to Templates</Button>
				<Button onclick={handleContinue} disabled={!selectedTemplate}>Use This Template</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
