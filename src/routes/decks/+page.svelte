<script lang="ts">
	import DeckBrowser from '$lib/components/feature/DeckBrowser.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	// Using data for future enhancements
	$: console.log('Page data:', data);
</script>

<svelte:head>
	<title>Decks - BlendSphere</title>
	<meta name="description" content="Browse and manage your flashcard decks in BlendSphere." />
</svelte:head>

<main class="container mx-auto px-4 py-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold tracking-tight">My Decks</h1>
		<p class="text-muted-foreground mt-2">
			Browse your flashcard decks, preview cards, and manage your learning progress.
		</p>
	</div>

	<DeckBrowser />
</main>

<style>
	main {
		min-height: calc(100vh - 4rem);
	}
</style>
