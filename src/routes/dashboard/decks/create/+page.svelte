<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/pocketbase.js';
	import { deckService } from '$lib/services/deck.service.js';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state
	let name = $state('');
	let description = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!$currentUser) {
			error = 'You must be logged in to create a deck';
			return;
		}

		if (!name.trim()) {
			error = 'Deck name is required';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			// Create deck using PocketBase service
			const deckData = {
				name: name.trim(),
				description: description.trim() || '',
				user: $currentUser.id,
				isPublic: false
			};

			await deckService.create(deckData);

			// Navigate back to decks page
			goto('/dashboard/decks');
		} catch (err) {
			console.error('Error creating deck:', err);
			error = err instanceof Error ? err.message : 'Failed to create deck';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel(): void {
		goto('/dashboard/decks');
	}
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content="Create a new flashcard deck in BlendSphere." />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Create New Deck</h1>
			<p class="text-muted-foreground mt-2">
				Create a new flashcard deck to organize your learning materials.
			</p>
		</div>
		<Button variant="outline" size="sm" onclick={handleCancel}>
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Decks
		</Button>
	</div>

	<div class="mx-auto max-w-2xl">
		<Card>
			<CardHeader>
				<CardTitle>Deck Information</CardTitle>
				<CardDescription>Enter basic information about your new deck.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if error}
					<div
						class="bg-destructive/10 border-destructive/20 text-destructive mb-4 rounded-md border p-3"
					>
						{error}
					</div>
				{/if}

				<form id="deck-form" onsubmit={handleSubmit} class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Deck Name *</Label>
						<Input
							id="name"
							name="name"
							bind:value={name}
							required
							placeholder="e.g., Spanish Vocabulary"
							disabled={isSubmitting}
							maxlength={100}
						/>
					</div>

					<div class="space-y-2">
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							bind:value={description}
							placeholder="Brief description of this deck's content and purpose"
							rows={4}
							disabled={isSubmitting}
							maxlength={500}
						/>
					</div>
				</form>
			</CardContent>
			<CardFooter class="flex justify-between">
				<Button variant="outline" onclick={handleCancel} disabled={isSubmitting}>Cancel</Button>
				<Button type="submit" form="deck-form" disabled={!name || isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create Deck'}
				</Button>
			</CardFooter>
		</Card>
	</div>
</div>
