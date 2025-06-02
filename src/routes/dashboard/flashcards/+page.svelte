<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import CardsIcon from '@tabler/icons-svelte/icons/cards';
	import BookIcon from '@tabler/icons-svelte/icons/book';

	function handleCreateSingle() {
		goto('/dashboard/flashcards/create');
	}

	function handleViewDecks() {
		goto('/dashboard/decks');
	}

	function handleViewTemplates() {
		goto('/dashboard/templates');
	}
</script>

<svelte:head>
	<title>Flashcards - BlendSphere</title>
</svelte:head>

<div class="container mx-auto max-w-6xl space-y-6 py-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Flashcards</h1>
		<p class="text-muted-foreground">Create and manage your learning materials</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Create Single Flashcard -->
		<Card class="cursor-pointer transition-shadow hover:shadow-md" onclick={handleCreateSingle}>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<PlusIcon class="h-5 w-5" />
					Create Flashcard
				</CardTitle>
				<CardDescription>
					Create individual flashcards using templates with AI assistance
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button class="w-full" onclick={handleCreateSingle}>Get Started</Button>
			</CardContent>
		</Card>

		<!-- Browse Decks -->
		<Card>
			<CardHeader>
				<CardTitle class="text-lg">My Decks</CardTitle>
				<CardDescription>Organize your flashcards into collections</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" class="w-full" onclick={handleViewDecks}>Manage Decks</Button>
			</CardContent>
		</Card>

		<!-- Browse Templates -->
		<Card class="cursor-pointer transition-shadow hover:shadow-md" onclick={handleViewTemplates}>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BookIcon class="h-5 w-5" />
					Browse Templates
				</CardTitle>
				<CardDescription>
					Explore available templates or create custom ones for your flashcards
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" class="w-full" onclick={handleViewTemplates}>
					View Templates
				</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Links -->
	<div class="grid gap-4 md:grid-cols-2">
		<!-- Recent Activity Section -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CardsIcon class="h-5 w-5" />
					Recent Activity
				</CardTitle>
				<CardDescription>Your recently created flashcards and decks</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
					<p class="text-muted-foreground">No recent flashcard activity.</p>
					<p class="text-muted-foreground mt-1 text-sm">
						Create your first flashcard to see activity here.
					</p>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<CardTitle class="text-lg">Study Session</CardTitle>
				<CardDescription>Practice with spaced repetition</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" class="w-full" disabled>
					Start Review
					<span class="ml-2 text-xs">(Coming Soon)</span>
				</Button>
			</CardContent>
		</Card>
	</div>
</div>
