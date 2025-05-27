<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { templateService, type Template } from '$lib/services/template.service';
	import { fieldService } from '$lib/services/field.service';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import FilterIcon from '@tabler/icons-svelte/icons/filter';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import EditIcon from '@tabler/icons-svelte/icons/edit';
	import CopyIcon from '@tabler/icons-svelte/icons/copy';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import { pb } from '$lib/pocketbase';
	import { SUPPORTED_LANGUAGES, LANGUAGE_LEVELS } from '$lib/constants/template.constants';
	import { formatRelativeTime } from '$lib/utils';

	let templates: Template[] = [];
	let loading = true;
	let searchQuery = '';
	let languageFilter = 'all';
	let levelFilter = 'all';
	let error = '';

	// Pagination
	let currentPage = 1;
	let totalPages = 1;
	let totalItems = 0;
	const itemsPerPage = 12;

	const languages = [{ value: 'all', label: 'All Languages' }, ...SUPPORTED_LANGUAGES];

	const levels = [{ value: 'all', label: 'All Levels' }, ...LANGUAGE_LEVELS];

	onMount(() => {
		loadTemplates();
	});

	async function loadTemplates() {
		try {
			loading = true;
			error = '';

			// Get current user ID
			const currentUserId = pb.authStore.record?.id;
			if (!currentUserId) {
				error = 'Please log in to view your templates.';
				return;
			}

			const result = await templateService.list(currentPage, itemsPerPage, {
				user: currentUserId // Load user's own templates
			});

			templates = result.items;
			totalPages = result.totalPages;
			totalItems = result.totalItems;
		} catch (err) {
			error = 'Failed to load templates. Please try again.';
			console.error('Error loading templates:', err);
		} finally {
			loading = false;
		}
	}

	function handleCreateTemplate() {
		goto('/dashboard/templates/create');
	}

	function handleEditTemplate(templateId: string) {
		goto(`/dashboard/templates/${templateId}/edit`);
	}

	function handleViewTemplate(templateId: string) {
		goto(`/dashboard/templates/${templateId}`);
	}

	async function handleCloneTemplate(template: Template) {
		try {
			// Clone the template
			const newTemplate = await templateService.clone(template.id, `Copy of ${template.name}`);

			// Get the original template's fields and clone them
			const fieldsResult = await fieldService.listByTemplate(template.id);
			if (fieldsResult.items && fieldsResult.items.length > 0) {
				for (const field of fieldsResult.items) {
					const { id, created, updated, ...fieldData } = field;
					await fieldService.create({
						...fieldData,
						template: newTemplate.id
					});
				}
			}

			loadTemplates(); // Refresh the list
		} catch (err) {
			error = 'Failed to clone template. Please try again.';
			console.error('Error cloning template:', err);
		}
	}

	async function handleDeleteTemplate(templateId: string) {
		if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
			return;
		}

		try {
			await templateService.delete(templateId);
			loadTemplates(); // Refresh the list
		} catch (err) {
			error = 'Failed to delete template. Please try again.';
			console.error('Error deleting template:', err);
		}
	}

	function getLanguagePairDisplay(template: Template) {
		return `${template.nativeLanguage} → ${template.learningLanguage}`;
	}

	function getLevelBadgeVariant(
		level: string
	): 'default' | 'destructive' | 'outline' | 'secondary' {
		const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
			A1: 'default',
			A2: 'secondary',
			B1: 'outline',
			B2: 'default',
			C1: 'secondary',
			C2: 'destructive'
		};
		return variants[level] || 'default';
	}

	// Filter templates based on search and filters
	$: filteredTemplates = templates.filter((template) => {
		const matchesSearch =
			searchQuery === '' ||
			template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(template.description &&
				template.description.toLowerCase().includes(searchQuery.toLowerCase()));

		const matchesLanguage =
			languageFilter === 'all' ||
			template.learningLanguage === languageFilter ||
			template.nativeLanguage === languageFilter;

		const matchesLevel = levelFilter === 'all' || template.languageLevel === levelFilter;

		return matchesSearch && matchesLanguage && matchesLevel;
	});
</script>

<svelte:head>
	<title>Templates - BlendSphere</title>
</svelte:head>

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Templates</h1>
			<p class="text-muted-foreground">Create and manage your flashcard templates</p>
		</div>
		<Button onclick={handleCreateTemplate} class="w-fit">
			<PlusIcon class="mr-2 h-4 w-4" />
			Create Template
		</Button>
	</div>

	<!-- Filters and Search -->
	<div class="flex flex-col gap-4 md:flex-row">
		<div class="relative flex-1">
			<SearchIcon
				class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
			/>
			<Input bind:value={searchQuery} placeholder="Search templates..." class="pl-10" />
		</div>
		<div class="flex gap-2">
			<Select.Root type="single" bind:value={languageFilter}>
				<Select.Trigger class="w-[180px]">
					{languages.find((l) => l.value === languageFilter)?.label || 'Language'}
				</Select.Trigger>
				<Select.Content>
					{#each languages as language}
						<Select.Item value={language.value}>{language.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={levelFilter}>
				<Select.Trigger class="w-[180px]">
					{levels.find((l) => l.value === levelFilter)?.label || 'Level'}
				</Select.Trigger>
				<Select.Content>
					{#each levels as level}
						<Select.Item value={level.value}>{level.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
			{error}
		</div>
	{/if}

	<!-- Templates Grid -->
	{#if loading}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(8) as _}
				<Card class="animate-pulse">
					<CardHeader>
						<div class="bg-muted h-4 w-3/4 rounded"></div>
						<div class="bg-muted h-3 w-full rounded"></div>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							<div class="bg-muted h-3 w-1/2 rounded"></div>
							<div class="bg-muted h-3 w-2/3 rounded"></div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if filteredTemplates.length === 0}
		<div class="py-12 text-center">
			<div class="text-muted-foreground mx-auto mb-4 h-12 w-12">
				<FilterIcon class="h-full w-full" />
			</div>
			<h3 class="mb-2 text-lg font-semibold">No templates found</h3>
			<p class="text-muted-foreground mb-4">
				{searchQuery || languageFilter !== 'all' || levelFilter !== 'all'
					? 'Try adjusting your search or filters'
					: 'Create your first template to get started'}
			</p>
			{#if !searchQuery && languageFilter === 'all' && levelFilter === 'all'}
				<Button onclick={handleCreateTemplate}>
					<PlusIcon class="mr-2 h-4 w-4" />
					Create Your First Template
				</Button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredTemplates as template (template.id)}
				<Card class="flex flex-col transition-shadow hover:shadow-md">
					<CardHeader>
						<CardTitle class="line-clamp-2 text-lg">{template.name}</CardTitle>
						{#if template.description}
							<CardDescription class="line-clamp-2">
								{template.description}
							</CardDescription>
						{/if}
					</CardHeader>
					<CardContent class="flex flex-1 flex-col justify-end space-y-3">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Languages:</span>
							<span class="font-medium">{getLanguagePairDisplay(template)}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">Level:</span>
							<Badge variant={getLevelBadgeVariant(template.languageLevel)}>
								{template.languageLevel}
							</Badge>
						</div>
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Updated:</span>
							<span>{formatRelativeTime(template.updated)}</span>
						</div>
					</CardContent>
					<CardFooter class="flex gap-2">
						<Button variant="outline" size="sm" onclick={() => handleViewTemplate(template.id)}>
							<EyeIcon class="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm" onclick={() => handleEditTemplate(template.id)}>
							<EditIcon class="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm" onclick={() => handleCloneTemplate(template)}>
							<CopyIcon class="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => handleDeleteTemplate(template.id)}
							class="text-destructive hover:text-destructive"
						>
							<TrashIcon class="h-4 w-4" />
						</Button>
					</CardFooter>
				</Card>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between">
				<p class="text-muted-foreground text-sm">
					Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
						currentPage * itemsPerPage,
						totalItems
					)} of {totalItems} templates
				</p>
				<div class="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage <= 1}
						onclick={() => {
							currentPage--;
							loadTemplates();
						}}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage >= totalPages}
						onclick={() => {
							currentPage++;
							loadTemplates();
						}}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>
