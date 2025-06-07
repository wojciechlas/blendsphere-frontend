<script lang="ts">
	import FlashcardCreator from '$lib/components/feature/FlashcardCreator.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State management
	let selectedTemplate = $state(data.selectedTemplate);
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
		templates={data.templates}
		fields={data.fields}
		availableDecks={data.decks}
		initialTemplate={selectedTemplate || undefined}
	/>
</div>
