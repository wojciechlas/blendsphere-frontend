<script lang="ts">
	import DeckBrowser from '$lib/components/feature/DeckBrowser.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content="Browse and manage your flashcard decks in BlendSphere." />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold tracking-tight">My Decks</h1>
		<p class="text-muted-foreground mt-2">
			Browse your flashcard decks, preview cards, and manage your learning progress.
		</p>
	</div>

	<div class="min-h-[calc(100vh-16rem)]">
		<DeckBrowser />
	</div>
</div>
