<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import FlashcardCreator from '$lib/components/feature/FlashcardCreator.svelte';
	import type { PageData } from './$types';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';

	interface CreatedTemplate {
		id: string;
		name: string;
		// Add other template properties as needed
	}

	let { data }: { data: PageData } = $props();

	// State management
	let selectedTemplate = $state(data.selectedTemplate);

	// Navigation helpers
	function handleGoBack() {
		goto('/dashboard/flashcards');
	}

	// Handle successful card creation
	function handleCardsCreated(
		event: CustomEvent<{ cards: unknown[]; deckId: string; template: CreatedTemplate }>
	) {
		const { cards, deckId } = event.detail;
		// Navigate to the flashcards page with success message
		// TODO: Once deck detail pages are implemented, change this to:
		// goto(`/dashboard/decks/${deckId}?created=${cards.length}`);
		goto(`/dashboard/flashcards?created=${cards.length}&deck=${deckId}`);
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
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button variant="ghost" size="sm" onclick={handleGoBack} class="gap-2">
					<ArrowLeftIcon class="h-4 w-4" />
					Back to Flashcards
				</Button>

				<Separator orientation="vertical" class="h-6" />
				<div>
					<h1 class="text-3xl font-bold tracking-tight">Create Flashcards</h1>
					<p class="text-muted-foreground">
						{#if selectedTemplate}
							Using template: <span class="font-medium">{selectedTemplate.name}</span>
						{:else}
							Select a template to get started
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Status Indicators -->
		{#if selectedTemplate}
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="gap-1">
					🎴 {selectedTemplate.name}
				</Badge>
			</div>
		{/if}
	</div>

	<!-- Main Content -->
	<FlashcardCreator
		templates={data.templates}
		fields={data.fields}
		availableDecks={data.decks}
		initialTemplate={selectedTemplate || undefined}
		on:cardsCreated={handleCardsCreated}
		on:cancel={handleGoBack}
	/>
</div>
