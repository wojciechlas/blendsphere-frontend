<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import FlashcardRenderer from '$lib/components/ui/flashcard/flashcard-renderer.svelte';
	import type { Flashcard } from '$lib/services/flashcard.service.js';
	import type { Template } from '$lib/services/template.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		flashcard,
		template,
		isFlipped: propIsFlipped = false,
		interactive = true,
		onFlip,
		class: className,
		...restProps
	}: {
		flashcard: Flashcard;
		template: Template & { fields?: Field[] };
		isFlipped?: boolean;
		interactive?: boolean;
		onFlip?: () => void;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();

	// Create a reactive state for isFlipped, initialized with the prop value
	let isFlipped = $derived(propIsFlipped);

	// Handle flipping the card
	function handleFlip() {
		if (!interactive) return;

		if (onFlip) {
			// Use external flip handler if provided (for review sessions)
			onFlip();
		} else {
			// Use internal state for standalone card usage
			isFlipped = !isFlipped;
		}
	}

	// Handle click on the container (delegated to FlashcardRenderer via onFlip)
	function handleContainerClick() {
		handleFlip();
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (!interactive) return;

		if (event.code === 'Space') {
			event.preventDefault();
			handleFlip();
		}
	}

	// Check for reduced motion preference and add keyboard event listener
	onMount(() => {
		// Add keyboard event listener
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div
	class={cn('review-card-container relative mx-auto w-full max-w-2xl', className)}
	onclick={handleContainerClick}
	role="button"
	tabindex="0"
	aria-label={isFlipped
		? 'Flashcard back side, click to flip to front'
		: 'Flashcard front side, click to flip to back'}
	{...restProps}
>
	<!-- FlashcardRenderer with proper constraints -->
	<div class="relative">
		<FlashcardRenderer
			{template}
			data={flashcard.data}
			dataFormat="field-labels"
			mode="full"
			interactive={false}
			externalFlipState={isFlipped}
			onFlip={handleFlip}
			class="w-full"
			context={{
				showBadges: false // We'll handle badges ourselves for review-specific ones
			}}
		/>

		<!-- Review-specific badges overlay -->
		<div class="pointer-events-none absolute top-2 right-2 z-20">
			{#if interactive}
				{#if !isFlipped}
					<Badge variant="outline" class="bg-background/80 text-xs backdrop-blur-sm"
						>Space to flip</Badge
					>
				{:else}
					<Badge variant="outline" class="bg-background/80 text-xs backdrop-blur-sm"
						>Rate after viewing</Badge
					>
				{/if}
			{/if}
		</div>

		<!-- Bounce arrow indicator for front side - REMOVED -->
		<!-- The animated down arrow has been removed per user request -->
	</div>
</div>
