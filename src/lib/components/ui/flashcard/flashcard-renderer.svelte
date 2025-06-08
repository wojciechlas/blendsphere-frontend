<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
	import type { Template } from '$lib/services/template.service.js';
	import type { Field } from '$lib/services/field.service.js';
	import { replacePlaceholders } from '$lib/utils/template.utils.js';

	interface Props {
		template: Template & { fields?: Field[] };
		data: Record<string, unknown>;
		/**
		 * Fields array - if not provided, will try to get from template.fields
		 */
		fields?: Field[];
		/**
		 * Data format type - helps the renderer understand how to process the data
		 * - 'field-ids': data uses field IDs as keys (from database)
		 * - 'field-labels': data uses field labels as keys (for previews)
		 * - 'auto': automatically detect format (default)
		 */
		dataFormat?: 'field-ids' | 'field-labels' | 'auto';
		/**
		 * Display mode for the flashcard
		 * - 'full': Complete interactive card with flip animation
		 * - 'preview': Non-interactive preview (for template previews)
		 * - 'review': Optimized for review sessions
		 * - 'compact': Minimal display for lists
		 * - 'side-by-side': Front and back displayed simultaneously
		 */
		mode?: 'full' | 'preview' | 'review' | 'compact' | 'side-by-side';
		/**
		 * Which side to show initially or exclusively
		 */
		initialSide?: 'front' | 'back';
		/**
		 * Whether flip interaction is enabled
		 */
		interactive?: boolean;
		/**
		 * Additional context information to display
		 */
		context?: {
			deckName?: string;
			templateName?: string;
			showBadges?: boolean;
		};
		/**
		 * Custom styling
		 */
		class?: string;
		/**
		 * Loading state
		 */
		isLoading?: boolean;
		/**
		 * Error state
		 */
		error?: string;
		/**
		 * External flip state control - when provided, overrides internal flip state
		 */
		externalFlipState?: boolean;
		/**
		 * External flip handler - called when flip is triggered
		 */
		onFlip?: () => void;
	}

	let {
		template,
		data,
		fields,
		dataFormat = 'auto',
		mode = 'full',
		initialSide = 'front',
		interactive = true,
		context,
		class: className,
		isLoading = false,
		error,
		externalFlipState,
		onFlip
	}: Props = $props();

	let isFlipped = $state(initialSide === 'back');
	let currentSide = $state<'front' | 'back'>(initialSide);

	// Use external flip state when provided, otherwise use internal state
	$effect(() => {
		if (externalFlipState !== undefined) {
			isFlipped = externalFlipState;
			currentSide = externalFlipState ? 'back' : 'front';
		}
	});

	// Get fields from multiple sources with fallback
	let templateFields = $derived(() => {
		// Priority: explicit fields prop > template.fields > empty array
		if (fields && fields.length > 0) return fields;
		if (template.fields && template.fields.length > 0) return template.fields;
		return [];
	});

	// Smart data processing based on format detection
	let processedData = $derived(() => {
		const availableFields = templateFields();
		if (!availableFields.length) {
			return data;
		}

		// Auto-detect data format if needed
		let detectedFormat = dataFormat;
		if (dataFormat === 'auto') {
			const dataKeys = Object.keys(data);
			const fieldIds = availableFields.map((f) => f.id);
			const fieldLabels = availableFields.map((f) => f.label.toLowerCase().replace(/\s+/g, '_'));

			// Check if data keys match field IDs more than field labels
			const idMatches = dataKeys.filter((key) => fieldIds.includes(key)).length;
			const labelMatches = dataKeys.filter((key) => fieldLabels.includes(key)).length;

			detectedFormat = idMatches > labelMatches ? 'field-ids' : 'field-labels';
		}

		// Process data based on detected format
		if (detectedFormat === 'field-ids') {
			// Convert field IDs to field labels for template rendering
			const convertedData: Record<string, unknown> = {};
			Object.entries(data).forEach(([key, value]) => {
				const field = availableFields.find((f) => f.id === key);
				if (field) {
					const labelKey = field.label.toLowerCase().replace(/\s+/g, '_');
					// Safe object assignment with validated key
					if (labelKey && typeof labelKey === 'string') {
						convertedData[labelKey] = value;
					}
				} else {
					// Keep original key if no field found
					if (key && typeof key === 'string') {
						convertedData[key] = value;
					}
				}
			});
			return convertedData;
		}

		// For 'field-labels' format, data is already in the right format
		return data;
	});

	// Render the template layouts with processed data
	let frontContent = $derived.by(() => {
		if (!template.frontLayout)
			return '<p class="text-muted-foreground">No front layout defined</p>';

		// For replacement, we use processedData which should have label-based keys
		const processed = processedData();
		const fields = templateFields();

		const content = replacePlaceholders(template.frontLayout, processed, fields);
		return content;
	});

	let backContent = $derived.by(() => {
		if (!template.backLayout) return '<p class="text-muted-foreground">No back layout defined</p>';

		console.log('FlashcardRenderer - backContent generation:');
		console.log('Template backLayout:', template.backLayout);
		const processed = processedData();
		const fields = templateFields();
		console.log('Processed data:', processed);

		const content = replacePlaceholders(template.backLayout, processed, fields);
		console.log('Generated back content:', content);
		return content;
	});

	// Check if there's content to display
	let hasFrontContent = $derived(template.frontLayout && template.frontLayout.trim() !== '');

	let hasBackContent = $derived(template.backLayout && template.backLayout.trim() !== '');

	const handleFlip = () => {
		if (!interactive || mode === 'preview' || mode === 'compact') return;

		if (onFlip) {
			// Use external flip handler when provided
			onFlip();
		} else {
			// Use internal flip state
			isFlipped = !isFlipped;
			currentSide = isFlipped ? 'back' : 'front';
		}
	};

	// Reset flip state when mode changes
	$effect(() => {
		if (mode === 'preview' || mode === 'compact' || mode === 'side-by-side') {
			isFlipped = false;
			currentSide = 'front';
		}
	});
</script>

{#if error}
	<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
		<div class="text-destructive text-sm font-medium">Error loading flashcard</div>
		<div class="text-destructive/80 text-sm">{error}</div>
	</div>
{:else if isLoading}
	<div class="flex h-full items-center justify-center rounded-lg border">
		<div class="text-muted-foreground text-center">
			<div class="text-sm">Loading flashcard...</div>
		</div>
	</div>
{:else if mode === 'compact'}
	<!-- Compact Mode: Single line display -->
	<div class={cn('flex items-center gap-2 rounded-md border p-2', className)}>
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm">
				{#if hasFrontContent}
					<!-- Show truncated front content -->
					{@const textContent = frontContent.replace(/<[^>]*>/g, '').substring(0, 50)}
					{textContent}{textContent.length >= 50 ? '...' : ''}
				{:else}
					No front content
				{/if}
			</div>
		</div>
		{#if context?.showBadges}
			<Badge variant="outline" class="text-xs">{template.name}</Badge>
		{/if}
	</div>
{:else if mode === 'side-by-side'}
	<!-- Side-by-Side Mode: Show both sides simultaneously -->
	<div class={cn('space-y-4', className)}>
		{#if context?.showBadges}
			<div class="flex items-center gap-2">
				{#if context.deckName}
					<Badge variant="outline">{context.deckName}</Badge>
				{/if}
				<Badge variant="secondary">{context.templateName || template.name}</Badge>
			</div>
		{/if}

		<div class="grid gap-4 md:grid-cols-2">
			<!-- Front Side -->
			<Card.Root>
				<Card.Header class="flex h-16 items-center justify-center">
					<Card.Title class="w-full text-center text-lg">Front</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if hasFrontContent}
						<div class="flashcard-content">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html frontContent}
						</div>
					{:else}
						<div class="text-muted-foreground py-4 text-center text-sm">
							No front layout defined
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Back Side -->
			<Card.Root>
				<Card.Header class="pb-3">
					<div class="flex items-center justify-between">
						<Card.Title class="text-lg">Back</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if hasBackContent}
						<div class="flashcard-content">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html backContent}
						</div>
					{:else}
						<div class="text-muted-foreground py-4 text-center text-sm">No back layout defined</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Side Indicator -->
		<div class="text-center">
			<Badge variant="secondary" class="text-xs">Showing both front and back</Badge>
		</div>
	</div>
{:else}
	<!-- Full/Preview Mode: Interactive or static card with flip -->
	<div class={cn('space-y-4', className)}>
		<!-- Context and Controls -->
		{#if context?.showBadges || interactive}
			<div class="flex items-center justify-between">
				{#if context?.showBadges}
					<div class="flex items-center gap-2">
						{#if context.deckName}
							<Badge variant="outline">{context.deckName}</Badge>
						{/if}
						<Badge variant="secondary">{context.templateName || template.name}</Badge>
					</div>
				{:else}
					<div></div>
				{/if}
				{#if interactive && mode === 'full'}
					<Button variant="outline" onclick={handleFlip} class="gap-2">
						<RefreshIcon class="h-4 w-4" />
						Flip Card
					</Button>
				{/if}
			</div>
		{/if}

		<!-- Flashcard Display -->
		<div
			class={cn('relative h-full w-full')}
			style={interactive && mode === 'full' ? 'perspective: 1000px;' : ''}
		>
			{#if interactive && mode === 'full'}
				<!-- Interactive flip card -->
				<div
					class={cn(
						'transform-style-preserve-3d relative h-full w-full transition-transform duration-500',
						isFlipped && 'rotate-y-180'
					)}
				>
					<!-- Front Side -->
					<Card.Root
						class={cn(
							'absolute inset-0 h-full w-full backface-hidden',
							!isFlipped ? 'z-10' : 'z-0'
						)}
					>
						<Card.Header class="pb-3">
							<Card.Title class="text-center text-lg">Front</Card.Title>
						</Card.Header>
						<Card.Content class="flex-1 space-y-3 overflow-hidden p-6">
							{#if hasFrontContent}
								<div class="flashcard-content flex h-full max-w-full items-center justify-center">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html frontContent}
								</div>
							{:else}
								<div
									class="text-muted-foreground flex h-full items-center justify-center text-center"
								>
									<p>No front layout defined</p>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Back Side -->
					<Card.Root
						class={cn(
							'absolute inset-0 h-full w-full rotate-y-180 backface-hidden',
							isFlipped ? 'z-10' : 'z-0'
						)}
					>
						<Card.Header class="pb-3">
							<Card.Title class="text-center text-lg">Back</Card.Title>
						</Card.Header>
						<Card.Content class="space-y-3 overflow-hidden">
							{#if hasBackContent}
								<div class="flashcard-content max-w-full">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html backContent}
								</div>
							{:else}
								<div class="text-muted-foreground py-8 text-center">
									<p>No back layout defined</p>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			{:else}
				<!-- Static display for preview mode -->
				<Card.Root class="h-full w-full">
					<Card.Header class="pb-3">
						<div class="flex items-center justify-between">
							<Card.Title class="text-lg">
								{currentSide === 'front' ? 'Front' : 'Back'}
							</Card.Title>
						</div>
					</Card.Header>
					<Card.Content class="space-y-3 overflow-hidden">
						{@const contentToShow = currentSide === 'front' ? frontContent : backContent}
						{@const hasContent = currentSide === 'front' ? hasFrontContent : hasBackContent}
						{#if hasContent}
							<div class="flashcard-content max-w-full">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html contentToShow}
							</div>
						{:else}
							<div class="text-muted-foreground py-8 text-center">
								<p>No {currentSide} layout defined</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
{/if}

<style>
	.perspective-1000 {
		perspective: 1000px;
	}

	.transform-style-preserve-3d {
		transform-style: preserve-3d;
	}

	.backface-hidden {
		backface-visibility: hidden;
	}

	.rotate-y-180 {
		transform: rotateY(180deg);
	}

	/* Flashcard content styling */
	.flashcard-content {
		word-wrap: break-word;
		overflow-wrap: break-word;
		max-width: 100%;
		overflow: hidden;
		hyphens: auto;
	}

	:global(.flashcard-content *) {
		max-width: 100% !important;
		word-break: break-word;
		overflow-wrap: break-word;
	}

	:global(.flashcard-content img) {
		max-width: 100% !important;
		height: auto;
		border-radius: 0.375rem;
		object-fit: contain;
	}

	:global(.flashcard-content audio) {
		width: 100%;
		max-width: 100%;
	}

	:global(.flashcard-content video) {
		width: 100%;
		max-width: 100%;
		height: auto;
	}

	:global(.flashcard-content pre) {
		white-space: pre-wrap;
		overflow-wrap: break-word;
		max-width: 100%;
		overflow-x: auto;
	}

	:global(.flashcard-content table) {
		max-width: 100%;
		overflow-x: auto;
		display: block;
		white-space: nowrap;
	}

	:global(.flashcard-content p, .flashcard-content div, .flashcard-content span) {
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
</style>
