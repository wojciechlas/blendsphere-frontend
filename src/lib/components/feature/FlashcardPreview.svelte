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
		if (onClose) {
			onClose();
		}
		if (open !== undefined) {
			open = false;
		}
	};
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

			<!-- Flashcard Display -->
			<FlashcardRenderer
				{template}
				{data}
				mode="full"
				context={{
					deckName,
					templateName: template.name,
					showBadges: true
				}}
			/>

			<Dialog.Footer>
				<Button variant="ghost" onclick={handleClose}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<!-- Flashcard Display -->
	<FlashcardRenderer
		{template}
		{data}
		mode="full"
		context={{
			deckName,
			templateName: template.name,
			showBadges: true
		}}
	/>
{/if}
