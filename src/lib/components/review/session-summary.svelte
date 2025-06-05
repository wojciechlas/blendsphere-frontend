<script lang="ts">
	import { cn } from '$lib/utils.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import CircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import HomeIcon from '@tabler/icons-svelte/icons/home';
	import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		summary,
		onStartNewSession,
		onReturnToDashboard,
		class: className,
		...restProps
	}: {
		summary: {
			cardsReviewed: number;
			totalTime: number; // in seconds
			averageTimePerCard: number; // in seconds
			correctPercentage: number;
			ratingDistribution: number[];
			ratingPercentages: number[];
			forecast: {
				dueTomorrow: number;
				dueThreeDays: number;
				dueLater: number;
			};
		};
		onStartNewSession: () => void;
		onReturnToDashboard: () => void;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();

	// Format time display
	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);

		if (minutes === 0) {
			return `${remainingSeconds}s`;
		}

		return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
	}

	// Rating labels
	const ratingLabels = ['Again', 'Hard', 'Good', 'Easy'];
</script>

<Card.Root class={cn('mx-auto w-full max-w-3xl', className)} {...restProps}>
	<Card.Header class="text-center">
		<Card.Title class="flex items-center justify-center gap-2 text-2xl">
			<CircleCheck class="text-primary h-6 w-6" />
			Review Session Complete!
		</Card.Title>
		<Card.Description>Great job! You've completed your review session.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		<!-- Session Stats -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<div class="rounded-lg border p-3 text-center">
				<div class="text-muted-foreground text-xs">Cards Reviewed</div>
				<div class="text-2xl font-bold">{summary.cardsReviewed}</div>
			</div>

			<div class="rounded-lg border p-3 text-center">
				<div class="text-muted-foreground text-xs">Total Time</div>
				<div class="text-2xl font-bold">{formatTime(summary.totalTime)}</div>
			</div>

			<div class="rounded-lg border p-3 text-center">
				<div class="text-muted-foreground text-xs">Avg Per Card</div>
				<div class="text-2xl font-bold">{Math.round(summary.averageTimePerCard)}s</div>
			</div>

			<div class="rounded-lg border p-3 text-center">
				<div class="text-muted-foreground text-xs">Accuracy</div>
				<div class="text-2xl font-bold">{Math.round(summary.correctPercentage)}%</div>
			</div>
		</div>

		<!-- Rating Distribution -->
		<div>
			<h4 class="mb-3 font-medium">Rating Distribution</h4>
			<div class="space-y-3">
				{#each summary.ratingDistribution as count, index (index)}
					<div class="space-y-1">
						<div class="flex justify-between">
							<span class="text-sm">{ratingLabels[index] || 'Unknown'}</span>
							<span class="text-muted-foreground text-sm">
								{count} cards ({Math.round(summary.ratingPercentages[index] || 0)}%)
							</span>
						</div>
						<Progress
							value={summary.ratingPercentages[index] || 0}
							class={cn(
								'h-2',
								index === 0
									? 'progress-destructive'
									: index === 1
										? 'progress-warning'
										: index === 2
											? 'progress-primary'
											: 'progress-success'
							)}
						/>
					</div>
				{/each}
			</div>
		</div>

		<!-- Forecast -->
		<div>
			<h4 class="mb-3 font-medium">Next Review</h4>
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span>{summary.forecast.dueTomorrow} cards due tomorrow</span>
				</div>
				<div class="flex justify-between text-sm">
					<span>{summary.forecast.dueThreeDays} cards due in 3 days</span>
				</div>
				<div class="flex justify-between text-sm">
					<span>{summary.forecast.dueLater} cards due in 7+ days</span>
				</div>
			</div>
		</div>
	</Card.Content>

	<Card.Footer class="flex justify-between">
		<Button variant="outline" onclick={onReturnToDashboard} class="gap-2">
			<HomeIcon class="h-4 w-4" />
			Return to Dashboard
		</Button>

		<Button onclick={onStartNewSession} class="gap-2">
			<RefreshIcon class="h-4 w-4" />
			Start New Session
		</Button>
	</Card.Footer>
</Card.Root>
