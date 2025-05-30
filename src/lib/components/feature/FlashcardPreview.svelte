<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
	import type { Template } from '$lib/services/template.service.js';
	import type { Field } from '$lib/services/field.service.js';

	interface Props {
		template: Template;
		data: Record<string, unknown>;
		deckName: string;
		open?: boolean;
		onClose?: () => void;
	}

	let { template, data, deckName, open = $bindable(), onClose }: Props = $props();

	let isFlipped = $state(false);
	let currentSide = $state<'front' | 'back'>('front');

	// Separate fields by front/back sides
	let frontFields = $derived(
		template.fields?.filter(
			(field: Field) => field.side === 'front' || field.side === 'both' || !field.side
		) || []
	);

	let backFields = $derived(
		template.fields?.filter((field: Field) => field.side === 'back' || field.side === 'both') || []
	);

	const handleFlip = () => {
		isFlipped = !isFlipped;
		currentSide = isFlipped ? 'back' : 'front';
	};

	const renderFieldValue = (field: Field, value: string | File | null | undefined): string => {
		if (!value) return '';

		switch (field.type) {
			case 'IMAGE':
				return (value as File)?.name || 'Image uploaded';
			case 'AUDIO':
				return (value as File)?.name || 'Audio uploaded';
			default:
				return String(value);
		}
	};

	const hasVisibleContent = (fields: Field[]): boolean => {
		return fields.some((field) => {
			const value = data[field.name] as string | File | null | undefined;
			return value && value !== '' && !(Array.isArray(value) && value.length === 0);
		});
	};

	const handleClose = () => {
		if (onClose) {
			onClose();
		}
		if (open !== undefined) {
			open = false;
		}
	};

	// Reset flip state when modal opens/closes
	$effect(() => {
		if (open !== undefined && !open) {
			isFlipped = false;
			currentSide = 'front';
		}
	});
</script>

{#if open !== undefined}
	<!-- Modal Version -->
	<Dialog.Root bind:open>
		<Dialog.Content class="max-w-4xl">
			<Dialog.Header>
				<Dialog.Title>Flashcard Preview</Dialog.Title>
				<Dialog.Description>
					Preview how your flashcard will look and test the flip functionality.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-6">
				<!-- Preview Controls -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Badge variant="outline">{deckName}</Badge>
						<Badge variant="secondary">{template.name}</Badge>
					</div>
					<Button variant="outline" onclick={handleFlip} class="gap-2">
						<RefreshIcon class="h-4 w-4" />
						Flip Card
					</Button>
				</div>

				<!-- Flashcard Display -->
				<div class="perspective-1000 relative min-h-[300px]">
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
							<Card.Header>
								<div class="flex items-center justify-between">
									<Card.Title class="text-lg">Front</Card.Title>
									<Badge variant="outline">
										{frontFields.length} field{frontFields.length !== 1 ? 's' : ''}
									</Badge>
								</div>
							</Card.Header>
							<Card.Content class="space-y-4">
								{#if hasVisibleContent(frontFields)}
									{#each frontFields as field (field.id)}
										{@const fieldValue = data[field.name] as string | File | null | undefined}
										{#if fieldValue && fieldValue !== '' && !(Array.isArray(fieldValue) && fieldValue.length === 0)}
											<div class="space-y-1">
												<div class="text-muted-foreground text-sm font-medium">
													{field.label}
												</div>
												<div class="text-base">
													{#if field.type === 'IMAGE' && fieldValue}
														<div class="text-muted-foreground flex items-center gap-2">
															<div class="bg-muted h-4 w-4 rounded"></div>
															{renderFieldValue(field, fieldValue)}
														</div>
													{:else if field.type === 'AUDIO' && fieldValue}
														<div class="text-muted-foreground flex items-center gap-2">
															<div class="bg-muted h-4 w-4 rounded"></div>
															{renderFieldValue(field, fieldValue)}
														</div>
													{:else}
														{renderFieldValue(field, fieldValue)}
													{/if}
												</div>
											</div>
										{/if}
									{/each}
								{:else}
									<div class="text-muted-foreground py-8 text-center">
										<p>No content for front side</p>
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
							<Card.Header>
								<div class="flex items-center justify-between">
									<Card.Title class="text-lg">Back</Card.Title>
									<Badge variant="outline">
										{backFields.length} field{backFields.length !== 1 ? 's' : ''}
									</Badge>
								</div>
							</Card.Header>
							<Card.Content class="space-y-4">
								{#if hasVisibleContent(backFields)}
									{#each backFields as field (field.id)}
										{@const fieldValue = data[field.name] as string | File | null | undefined}
										{#if fieldValue && fieldValue !== '' && !(Array.isArray(fieldValue) && fieldValue.length === 0)}
											<div class="space-y-1">
												<div class="text-muted-foreground text-sm font-medium">
													{field.label}
												</div>
												<div class="text-base">
													{#if field.type === 'IMAGE' && fieldValue}
														<div class="text-muted-foreground flex items-center gap-2">
															<div class="bg-muted h-4 w-4 rounded"></div>
															{renderFieldValue(field, fieldValue)}
														</div>
													{:else if field.type === 'AUDIO' && fieldValue}
														<div class="text-muted-foreground flex items-center gap-2">
															<div class="bg-muted h-4 w-4 rounded"></div>
															{renderFieldValue(field, fieldValue)}
														</div>
													{:else}
														{renderFieldValue(field, fieldValue)}
													{/if}
												</div>
											</div>
										{/if}
									{/each}
								{:else}
									<div class="text-muted-foreground py-8 text-center">
										<p>No content for back side</p>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</div>
				</div>

				<!-- Side Indicator -->
				<div class="text-center">
					<Badge variant={currentSide === 'front' ? 'default' : 'secondary'}>
						Currently showing: {currentSide === 'front' ? 'Front' : 'Back'}
					</Badge>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="ghost" onclick={handleClose}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<!-- Inline Version -->
	<div class="space-y-6">
		<!-- Preview Controls -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Badge variant="outline">{deckName}</Badge>
				<Badge variant="secondary">{template.name}</Badge>
			</div>
			<Button variant="outline" onclick={handleFlip} class="gap-2">
				<RefreshIcon class="h-4 w-4" />
				Flip Card
			</Button>
		</div>

		<!-- Flashcard Display -->
		<div class="perspective-1000 relative min-h-[300px]">
			<div
				class={cn(
					'transform-style-preserve-3d relative h-full w-full transition-transform duration-500',
					isFlipped && 'rotate-y-180'
				)}
			>
				<!-- Front Side -->
				<Card.Root
					class={cn('absolute inset-0 h-full w-full backface-hidden', !isFlipped ? 'z-10' : 'z-0')}
				>
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title class="text-lg">Front</Card.Title>
							<Badge variant="outline">
								{frontFields.length} field{frontFields.length !== 1 ? 's' : ''}
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						{#if hasVisibleContent(frontFields)}
							{#each frontFields as field (field.id)}
								{@const fieldValue = data[field.name] as string | File | null | undefined}
								{#if fieldValue && fieldValue !== '' && !(Array.isArray(fieldValue) && fieldValue.length === 0)}
									<div class="space-y-1">
										<div class="text-muted-foreground text-sm font-medium">
											{field.label}
										</div>
										<div class="text-base">
											{#if field.type === 'IMAGE' && fieldValue}
												<div class="text-muted-foreground flex items-center gap-2">
													<div class="bg-muted h-4 w-4 rounded"></div>
													{renderFieldValue(field, fieldValue)}
												</div>
											{:else if field.type === 'AUDIO' && fieldValue}
												<div class="text-muted-foreground flex items-center gap-2">
													<div class="bg-muted h-4 w-4 rounded"></div>
													{renderFieldValue(field, fieldValue)}
												</div>
											{:else}
												{renderFieldValue(field, fieldValue)}
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						{:else}
							<div class="text-muted-foreground py-8 text-center">
								<p>No content for front side</p>
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
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title class="text-lg">Back</Card.Title>
							<Badge variant="outline">
								{backFields.length} field{backFields.length !== 1 ? 's' : ''}
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						{#if hasVisibleContent(backFields)}
							{#each backFields as field (field.id)}
								{@const fieldValue = data[field.name] as string | File | null | undefined}
								{#if fieldValue && fieldValue !== '' && !(Array.isArray(fieldValue) && fieldValue.length === 0)}
									<div class="space-y-1">
										<div class="text-muted-foreground text-sm font-medium">
											{field.label}
										</div>
										<div class="text-base">
											{#if field.type === 'IMAGE' && fieldValue}
												<div class="text-muted-foreground flex items-center gap-2">
													<div class="bg-muted h-4 w-4 rounded"></div>
													{renderFieldValue(field, fieldValue)}
												</div>
											{:else if field.type === 'AUDIO' && fieldValue}
												<div class="text-muted-foreground flex items-center gap-2">
													<div class="bg-muted h-4 w-4 rounded"></div>
													{renderFieldValue(field, fieldValue)}
												</div>
											{:else}
												{renderFieldValue(field, fieldValue)}
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						{:else}
							<div class="text-muted-foreground py-8 text-center">
								<p>No content for back side</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</div>

		<!-- Side Indicator -->
		<div class="text-center">
			<Badge variant={currentSide === 'front' ? 'default' : 'secondary'}>
				Currently showing: {currentSide === 'front' ? 'Front' : 'Back'}
			</Badge>
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
</style>
