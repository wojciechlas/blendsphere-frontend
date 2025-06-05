<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button, type ButtonVariant } from '$lib/components/ui/button/index.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { RecallRating } from '$lib/services/srs-algorithm.service.js';
	import { onMount } from 'svelte';

	let {
		onRate,
		disabled = false,
		showKeyboardShortcuts = true,
		class: className,
		...restProps
	}: {
		onRate: (rating: RecallRating) => void;
		disabled?: boolean;
		showKeyboardShortcuts?: boolean;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();

	// Define ratings with descriptions and colors
	const ratings = [
		{
			value: RecallRating.AGAIN,
			label: 'Again',
			description: 'Complete failure to recall',
			color: 'destructive',
			key: '1'
		},
		{
			value: RecallRating.HARD,
			label: 'Hard',
			description: 'Significant difficulty recalling',
			color: 'warning',
			key: '2'
		},
		{
			value: RecallRating.GOOD,
			label: 'Good',
			description: 'Correct recall with effort',
			color: 'default',
			key: '3'
		},
		{
			value: RecallRating.EASY,
			label: 'Easy',
			description: 'Perfect recall with no hesitation',
			color: 'success',
			key: '4'
		}
	];

	// Map color values to valid Button variants
	function getButtonVariant(color: string): ButtonVariant {
		switch (color) {
			case 'warning':
				return 'outline';
			case 'success':
				return 'secondary';
			case 'destructive':
				return 'destructive';
			case 'default':
				return 'default';
			default:
				return 'default';
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		const key = event.key;
		if (key >= '1' && key <= '4') {
			event.preventDefault();
			const ratingValue = parseInt(key) as RecallRating;
			onRate(ratingValue);
		}
	}

	onMount(() => {
		// Add keyboard event listener
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class={cn('recall-rating flex flex-col space-y-2', className)} {...restProps}>
	<div class="mb-2 text-center">
		<p class="text-lg font-medium">How well did you recall this?</p>
	</div>

	<div class="grid grid-cols-4 gap-2">
		{#each ratings as { value, label, description, color, key } (key)}
			<div class="flex flex-col items-center">
				<Button
					variant={getButtonVariant(color)}
					size="lg"
					{disabled}
					onclick={() => onRate(value)}
					class="w-full"
					aria-label={`Rate as ${label}: ${description}`}
				>
					{label}
					{#if showKeyboardShortcuts}
						<span class="ml-1 opacity-70">({key})</span>
					{/if}
				</Button>
				<span class="text-muted-foreground mt-1 text-xs">{description}</span>
			</div>
		{/each}
	</div>
</div>
