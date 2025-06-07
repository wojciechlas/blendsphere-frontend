<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import FlashcardRenderer from '$lib/components/ui/flashcard/flashcard-renderer.svelte';
	import type { Template } from '$lib/services/template.service.js';

	interface Props {
		template: Template;
		data: Record<string, unknown>;
		deckName: string;
		open?: boolean;
		onClose?: () => void;
	}

	let { template, data, deckName, open = $bindable(), onClose }: Props = $props();

	const handleClose = () => {
		open = false;
		if (onClose) {
			onClose();
		}
	};
</script>

{#if open}
	<!-- Modal Version -->
	<Dialog.Root bind:open>
		<Dialog.Content class="flex  w-auto max-w-4xl flex-col">
			<Dialog.Header class="flex-shrink-0">
				<Dialog.Title>Flashcard Preview</Dialog.Title>
				<Dialog.Description>
					Preview how your flashcard will look and test the flip functionality.
				</Dialog.Description>
			</Dialog.Header>

			<!-- Flashcard Display -->
			<div class="flex min-h-0 flex-1 items-center justify-center p-4">
				<FlashcardRenderer
					class="h-full w-full max-w-2xl"
					{template}
					{data}
					mode="full"
					context={{
						deckName,
						templateName: template.name,
						showBadges: true
					}}
				/>
			</div>

			<Dialog.Footer class="flex-shrink-0 py-4">
				<Button variant="ghost" onclick={handleClose}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
