<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ClockIcon from '@tabler/icons-svelte/icons/clock';
	import ChartPieIcon from '@tabler/icons-svelte/icons/chart-pie';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		totalCards,
		completedCards,
		correctCards,
		elapsedTime,
		class: className,
		...restProps
	}: {
		totalCards: number;
		completedCards: number;
		correctCards: number;
		elapsedTime: number; // in seconds
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();

	// Calculate progress percentage
	let progressPercentage = $derived(
		totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0
	);

	// Calculate accuracy percentage
	let accuracyPercentage = $derived(
		completedCards > 0 ? Math.round((correctCards / completedCards) * 100) : 0
	);

	// Format elapsed time
	let formattedTime = $derived.by(() => {
		const minutes = Math.floor(elapsedTime / 60);
		const seconds = Math.floor(elapsedTime % 60);
		return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
	});

	// Calculate cards remaining
	let remainingCards = $derived(totalCards - completedCards);

	// Calculate average time per card
	let averageTimePerCard = $derived(
		completedCards > 0 ? Math.round(elapsedTime / completedCards) : 0
	);
</script>

<div class={cn('session-progress bg-card rounded-lg border p-4', className)} {...restProps}>
	<div class="flex flex-col space-y-3">
		<!-- Progress bar -->
		<div class="space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">Session Progress</span>
				<span class="text-muted-foreground text-sm">{completedCards} / {totalCards}</span>
			</div>
			<Progress value={progressPercentage} class="h-2" />
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-2 gap-2 pt-2">
			<div class="flex items-center gap-2">
				<ClockIcon class="text-muted-foreground h-4 w-4" />
				<div class="flex flex-col">
					<span class="text-muted-foreground text-xs">Time</span>
					<span class="text-sm font-medium">{formattedTime}</span>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<ChartPieIcon class="text-muted-foreground h-4 w-4" />
				<div class="flex flex-col">
					<span class="text-muted-foreground text-xs">Accuracy</span>
					<span class="text-sm font-medium">{accuracyPercentage}%</span>
				</div>
			</div>
		</div>

		<!-- Cards stats -->
		<div class="flex justify-between pt-1">
			<Badge variant="outline" class="gap-1">
				<span class="text-muted-foreground">Remaining:</span>
				{remainingCards}
			</Badge>

			<Badge variant="outline" class="gap-1">
				<span class="text-muted-foreground">Avg time:</span>
				{averageTimePerCard}s
			</Badge>
		</div>
	</div>
</div>
