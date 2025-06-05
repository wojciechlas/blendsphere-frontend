<script lang="ts">
	import { cn } from '$lib/utils.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import CircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import ChevronRightIcon from '@tabler/icons-svelte/icons/chevron-right';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		nextDueCards,
		onReviewAhead,
		class: className,
		...restProps
	}: {
		nextDueCards: {
			inHours: number;
			tomorrow: number;
		};
		onReviewAhead: () => void;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();
</script>

<Card.Root class={cn('mx-auto w-full max-w-xl', className)} {...restProps}>
	<Card.Header class="text-center">
		<Card.Title class="flex items-center justify-center gap-2 text-2xl">
			<CircleCheck class="text-success h-6 w-6" />
			All caught up! 🎉
		</Card.Title>
		<Card.Description>You have no cards due for review right now.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		<!-- Next Due Cards -->
		<div class="rounded-lg border p-4">
			<h4 class="mb-3 font-medium">Next review:</h4>
			<div class="space-y-2">
				{#if nextDueCards.inHours > 0}
					<div class="flex justify-between text-sm">
						<span>{nextDueCards.inHours} cards due in a few hours</span>
					</div>
				{/if}
				{#if nextDueCards.tomorrow > 0}
					<div class="flex justify-between text-sm">
						<span>{nextDueCards.tomorrow} cards due tomorrow</span>
					</div>
				{/if}
				{#if nextDueCards.inHours === 0 && nextDueCards.tomorrow === 0}
					<div class="text-muted-foreground text-sm">No cards scheduled for the near future.</div>
				{/if}
			</div>
		</div>

		<!-- Tip -->
		<div class="bg-muted/50 rounded-lg p-4">
			<p class="text-muted-foreground text-sm">
				Tip: Creating new flashcards or adjusting your review schedule can help maintain a
				consistent learning routine.
			</p>
		</div>
	</Card.Content>

	<Card.Footer class="flex justify-end">
		<Button onclick={onReviewAhead} class="gap-2">
			Review Ahead
			<ChevronRightIcon class="h-4 w-4" />
		</Button>
	</Card.Footer>
</Card.Root>
