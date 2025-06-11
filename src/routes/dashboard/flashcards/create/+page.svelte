<script lang="ts">
	import FlashcardCreator from '$lib/components/feature/FlashcardCreator.svelte';
	import { templateService } from '$lib/services/template.service';
	import { deckService } from '$lib/services/deck.service';
	import { fieldService, type Field } from '$lib/services/field.service';
	import { flashcardService } from '$lib/services/flashcard.service';
	import { currentUser } from '$lib/pocketbase';
	import { get } from 'svelte/store';
	import type { PageData } from './$types';
	import type { Template } from '$lib/services/template.service';
	import type { Deck } from '$lib/services/deck.service';

	let { data }: { data: PageData } = $props();

	// State management
	let selectedTemplate = $state(data.selectedTemplate);
	let templates = $state<Template[]>(data.templates);
	let fields = $state<Field[]>(data.fields);
	let availableDecks = $state<Deck[]>(data.decks);
	let isRefreshing = $state(false);

	// Function to refresh data
	async function refreshData() {
		if (isRefreshing) return;

		isRefreshing = true;
		try {
			const user = get(currentUser);
			if (!user) {
				throw new Error('User not authenticated');
			}

			// Load templates and decks in parallel
			const [templatesResult, decksResult] = await Promise.all([
				// Try to load both user's templates and public templates
				Promise.all([
					templateService
						.list(1, 50, { user: user.id })
						.catch(() => ({ items: [], totalItems: 0, totalPages: 0 })),
					templateService
						.list(1, 50, { isPublic: true })
						.catch(() => ({ items: [], totalItems: 0, totalPages: 0 }))
				]).then(([userTemplates, publicTemplates]) => {
					// Combine and deduplicate templates
					const allTemplates = [...userTemplates.items, ...publicTemplates.items];
					const uniqueTemplates = allTemplates.filter(
						(template, index, arr) => arr.findIndex((t) => t.id === template.id) === index
					);
					return {
						items: uniqueTemplates,
						totalItems: uniqueTemplates.length,
						totalPages: Math.ceil(uniqueTemplates.length / 50)
					};
				}),
				deckService
					.listByUser(user.id, 1, 100)
					.catch(() => ({ items: [], totalItems: 0, totalPages: 0 }))
			]);

			// Load fields for all templates
			const allFields: Field[] = [];
			if (templatesResult.items.length > 0) {
				// Process templates sequentially to avoid overwhelming PocketBase
				console.log(`Refreshing fields for ${templatesResult.items.length} templates...`);

				for (let i = 0; i < templatesResult.items.length; i++) {
					const template = templatesResult.items[i];
					try {
						const result = await fieldService.listByTemplate(template.id);
						// Associate fields with the template
						template.fields = result.items;
						allFields.push(...result.items);
						console.log(`Refreshed ${result.items.length} fields for template ${template.name}`);
					} catch (error) {
						console.warn(`Failed to refresh fields for template ${template.id}:`, error);
						// Set empty fields array for this template
						template.fields = [];
					}
				}
			}

			// Load card counts for all decks
			if (decksResult.items.length > 0) {
				const cardCountPromises = decksResult.items.map((deck) =>
					flashcardService
						.listByDeck(deck.id, 1, 1) // Only need count, so fetch minimal data
						.then((result) => {
							deck.cardCount = result.totalItems;
							return result.totalItems;
						})
						.catch((error) => {
							console.warn(`Failed to load cards count for deck ${deck.id}:`, error);
							deck.cardCount = 0;
							return 0;
						})
				);

				await Promise.all(cardCountPromises);
			}

			// Update state
			templates = templatesResult.items;
			fields = allFields;
			availableDecks = decksResult.items;

			console.log('🔄 Data refreshed successfully');
			console.log('📋 Templates loaded:', templates.length);
			console.log('🏷️ Fields loaded:', fields.length);
			console.log('📚 Decks loaded:', availableDecks.length);
		} catch (error) {
			console.error('Error refreshing data:', error);
		} finally {
			isRefreshing = false;
		}
	}

	// Reactive update when data changes
	$effect(() => {
		templates = data.templates;
		fields = data.fields;
		availableDecks = data.decks;
		selectedTemplate = data.selectedTemplate;
	});

	// Expose refresh function globally for other components to call
	if (typeof window !== 'undefined') {
		(window as unknown as Record<string, unknown>).refreshFlashcardCreatorData = refreshData;
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="container mx-auto max-w-7xl space-y-6 p-6">
	<!-- Header Section -->
	<div class="space-y-4">
		<!-- Simple Breadcrumb -->
		<nav class="text-muted-foreground flex items-center space-x-1 text-sm">
			<a href="/dashboard" class="hover:text-foreground">Dashboard</a>
			<span>/</span>
			<a href="/dashboard/flashcards" class="hover:text-foreground">Flashcards</a>
			<span>/</span>
			<span class="text-foreground">Create</span>
		</nav>

		<!-- Header with actions -->
		<h1 class="text-3xl font-bold tracking-tight">Create Flashcards</h1>
	</div>

	<!-- Main Content -->
	<FlashcardCreator
		{templates}
		{fields}
		{availableDecks}
		initialTemplate={selectedTemplate || undefined}
		onDataRefreshNeeded={refreshData}
	/>
</div>
