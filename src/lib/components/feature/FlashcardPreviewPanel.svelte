<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	import ClockIcon from '@tabler/icons-svelte/icons/clock';
	import BrainIcon from '@tabler/icons-svelte/icons/brain';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import EditIcon from '@tabler/icons-svelte/icons/edit';
	import PlayIcon from '@tabler/icons-svelte/icons/player-play';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import TrendingUpIcon from '@tabler/icons-svelte/icons/trending-up';
	import RepeatIcon from '@tabler/icons-svelte/icons/repeat';

	import type { FlashcardWithSRS } from '$lib/types/deck-browser.js';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		selectedFlashcard: FlashcardWithSRS | null;
		isLoading: boolean;
		error: string | null;
		isMobile?: boolean;
	}

	let {
		selectedFlashcard = null,
		isLoading = false,
		error = null,
		isMobile = false
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		backToFlashcardList: void;
		editFlashcard: { flashcardId: string };
		startReview: { flashcardId: string };
	}>();

	function getStateBadgeVariant(
		state: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (state) {
			case 'NEW':
				return 'outline';
			case 'LEARNING':
				return 'secondary';
			case 'REVIEW':
				return 'default';
			case 'RELEARNING':
				return 'destructive';
			case 'MASTERED':
				return 'default';
			default:
				return 'outline';
		}
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return 'Never';

		const date = new Date(dateString);
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays === -1) return 'Tomorrow';
		if (diffDays < 0) return `In ${Math.abs(diffDays)} days`;
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString();
	}

	function getDifficultyLabel(difficulty: number | undefined): string {
		if (!difficulty) return 'Unknown';

		const percentage = Math.round(difficulty * 100);
		if (percentage < 30) return 'Easy';
		if (percentage < 60) return 'Medium';
		if (percentage < 80) return 'Hard';
		return 'Very Hard';
	}

	function getStabilityLabel(stability: number | undefined): string {
		if (!stability) return 'Unknown';

		if (stability < 1) return 'Very Unstable';
		if (stability < 7) return 'Unstable';
		if (stability < 30) return 'Moderate';
		if (stability < 90) return 'Stable';
		return 'Very Stable';
	}

	function renderFlashcardContent(data: Record<string, unknown>): string {
		// For now, just display the raw data
		// In a real implementation, this would use the template to render properly
		if (!data || typeof data !== 'object') return 'No content available';

		const entries = Object.entries(data);
		if (entries.length === 0) return 'No content available';

		// Try to find the most relevant field (usually the first string field)
		const primaryField = entries.find(([, value]) => typeof value === 'string' && value.length > 0);
		if (primaryField) {
			return primaryField[1] as string;
		}

		// Fallback to showing all fields
		return entries
			.filter(([, value]) => typeof value === 'string' && value.length > 0)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
	}
</script>

<div class="flex h-full flex-col">
	{#if selectedFlashcard}
		<div
			class="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b p-4 backdrop-blur"
		>
			<!-- Mobile back button -->
			{#if isMobile}
				<Button
					variant="ghost"
					size="sm"
					class="mb-3 -ml-2"
					onclick={() => dispatch('backToFlashcardList')}
				>
					<ArrowLeftIcon class="mr-2 h-4 w-4" />
					Back to Cards
				</Button>
			{/if}

			<!-- Header actions -->
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Badge variant={getStateBadgeVariant(selectedFlashcard.state)}>
						{selectedFlashcard.state}
					</Badge>
					{#if selectedFlashcard.isDue}
						<Badge variant="destructive">
							<ClockIcon class="mr-1 h-3 w-3" />
							Due Now
						</Badge>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => dispatch('editFlashcard', { flashcardId: selectedFlashcard.id })}
					>
						<EditIcon class="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						onclick={() => dispatch('startReview', { flashcardId: selectedFlashcard.id })}
						disabled={!selectedFlashcard.isDue}
					>
						<PlayIcon class="mr-2 h-4 w-4" />
						Review
					</Button>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 space-y-6 overflow-y-auto p-4">
			{#if isLoading}
				<!-- Loading skeleton -->
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-1/3" />
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-3/4" />
							<Skeleton class="h-4 w-1/2" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-1/4" />
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 gap-4">
							{#each Array(6).fill(0), i (i)}
								<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
								<div>
									<Skeleton class="mb-1 h-4 w-full" />
									<Skeleton class="h-3 w-2/3" />
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{:else if error}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div class="text-destructive mb-2">Failed to load flashcard</div>
					<p class="text-muted-foreground mb-4 text-sm">{error}</p>
					<Button variant="outline" onclick={() => window.location.reload()}>Try Again</Button>
				</div>
			{:else}
				<!-- Flashcard content -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<EyeIcon class="h-5 w-5" />
							Flashcard Content
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							<!-- Template info -->
							{#if selectedFlashcard.expand?.template}
								<div class="text-muted-foreground text-sm">
									Template: <span class="font-medium">{selectedFlashcard.expand.template.name}</span
									>
								</div>
							{/if}

							<!-- Content preview -->
							<div class="bg-muted/50 rounded-lg p-4">
								<pre class="font-mono text-sm whitespace-pre-wrap">{renderFlashcardContent(
										selectedFlashcard.data
									)}</pre>
							</div>

							<!-- Raw data (for debugging - can be removed in production) -->
							{#if Object.keys(selectedFlashcard.data || {}).length > 0}
								<details class="text-xs">
									<summary class="text-muted-foreground hover:text-foreground cursor-pointer">
										View raw data
									</summary>
									<pre class="bg-muted/30 mt-2 overflow-x-auto rounded p-2 text-xs">{JSON.stringify(
											selectedFlashcard.data,
											null,
											2
										)}</pre>
								</details>
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- SRS Information -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<BrainIcon class="h-5 w-5" />
							Learning Progress
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<!-- Review Schedule -->
							<div class="space-y-3">
								<h4 class="text-sm font-medium">Review Schedule</h4>

								<div class="flex items-center gap-2 text-sm">
									<CalendarIcon class="text-muted-foreground h-4 w-4" />
									<span class="text-muted-foreground">Last Review:</span>
									<span class="font-medium">{formatDate(selectedFlashcard.lastReview)}</span>
								</div>

								<div class="flex items-center gap-2 text-sm">
									<ClockIcon class="text-muted-foreground h-4 w-4" />
									<span class="text-muted-foreground">Next Review:</span>
									<span
										class={cn(
											'font-medium',
											selectedFlashcard.isDue ? 'text-destructive' : 'text-muted-foreground'
										)}
									>
										{formatDate(selectedFlashcard.nextReview)}
									</span>
								</div>

								<div class="flex items-center gap-2 text-sm">
									<RepeatIcon class="text-muted-foreground h-4 w-4" />
									<span class="text-muted-foreground">Review Count:</span>
									<span class="font-medium">{selectedFlashcard.reviewCount}</span>
								</div>
							</div>

							<!-- SRS Parameters -->
							<div class="space-y-3">
								<h4 class="text-sm font-medium">SRS Parameters</h4>

								<div class="flex items-center gap-2 text-sm">
									<TrendingUpIcon class="text-muted-foreground h-4 w-4" />
									<span class="text-muted-foreground">Difficulty:</span>
									<span class="font-medium">
										{getDifficultyLabel(selectedFlashcard.difficulty)}
										{#if selectedFlashcard.difficulty}
											<span class="text-muted-foreground ml-1">
												({Math.round(selectedFlashcard.difficulty * 100)}%)
											</span>
										{/if}
									</span>
								</div>

								{#if selectedFlashcard.stability}
									<div class="flex items-center gap-2 text-sm">
										<span class="text-muted-foreground h-4 w-4">📊</span>
										<span class="text-muted-foreground">Stability:</span>
										<span class="font-medium">
											{getStabilityLabel(selectedFlashcard.stability)}
											<span class="text-muted-foreground ml-1">
												({Math.round(selectedFlashcard.stability)} days)
											</span>
										</span>
									</div>
								{/if}

								{#if selectedFlashcard.retrievability}
									<div class="flex items-center gap-2 text-sm">
										<span class="text-muted-foreground h-4 w-4">🎯</span>
										<span class="text-muted-foreground">Retrievability:</span>
										<span class="font-medium">
											{Math.round(selectedFlashcard.retrievability * 100)}%
										</span>
									</div>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Metadata -->
				<Card>
					<CardHeader>
						<CardTitle class="text-base">Metadata</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
							<div>
								<span class="text-muted-foreground">Created:</span>
								<span class="ml-2 font-medium">{formatDate(selectedFlashcard.created)}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Updated:</span>
								<span class="ml-2 font-medium">{formatDate(selectedFlashcard.updated)}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Card ID:</span>
								<span class="ml-2 font-mono text-xs">{selectedFlashcard.id}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Template ID:</span>
								<span class="ml-2 font-mono text-xs">{selectedFlashcard.template}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	{:else}
		<!-- No flashcard selected -->
		<div class="flex h-full flex-col items-center justify-center p-8 text-center">
			<EyeIcon class="text-muted-foreground mb-4 h-16 w-16" />
			<h3 class="mb-2 text-lg font-semibold">Select a flashcard</h3>
			<p class="text-muted-foreground text-sm">
				Choose a flashcard from the list to view its details and SRS information
			</p>
		</div>
	{/if}
</div>
