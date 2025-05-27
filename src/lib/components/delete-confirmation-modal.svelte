<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import AlertTriangleIcon from '@tabler/icons-svelte/icons/alert-triangle';

	export let open = false;
	export let title = '';
	export let description = '';
	export let itemName = '';
	export let itemType = 'item';
	export let destructiveAction = 'Delete';
	export let fieldCount = 0;
	export let isLoading = false;
	export let onConfirm: () => void = () => {};
	export let onCancel: () => void = () => {};

	function handleConfirm() {
		onConfirm();
	}

	function handleCancel() {
		open = false;
		onCancel();
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<div class="flex items-center gap-3">
				<div class="bg-destructive/15 flex h-10 w-10 items-center justify-center rounded-full">
					<AlertTriangleIcon class="text-destructive h-5 w-5" />
				</div>
				<div>
					<DialogTitle>{title || `${destructiveAction} ${itemType}`}</DialogTitle>
				</div>
			</div>
			<DialogDescription class="pt-2">
				{description ||
					`Are you sure you want to ${destructiveAction.toLowerCase()} this ${itemType}?`}
			</DialogDescription>
		</DialogHeader>

		<!-- Item Details -->
		{#if itemName}
			<div class="space-y-3 rounded-md border p-3">
				<div class="flex items-center justify-between">
					<span class="font-medium">{itemType}:</span>
					<span class="font-mono text-sm">{itemName}</span>
				</div>

				{#if fieldCount > 0}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">Fields to delete:</span>
						<Badge variant="destructive" class="text-xs">
							{fieldCount} field{fieldCount !== 1 ? 's' : ''}
						</Badge>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Warning -->
		<div class="bg-destructive/10 rounded-md p-3 text-sm">
			<div class="flex items-center gap-2">
				<TrashIcon class="text-destructive h-4 w-4" />
				<span class="text-destructive font-medium">This action cannot be undone</span>
			</div>
			<p class="text-destructive/80 mt-1">
				This will permanently delete the {itemType} and all associated data.
			</p>
		</div>

		<DialogFooter class="gap-2">
			<Button variant="outline" disabled={isLoading} onclick={handleCancel}>Cancel</Button>
			<Button variant="destructive" disabled={isLoading} onclick={handleConfirm}>
				{#if isLoading}
					Deleting...
				{:else}
					{destructiveAction}
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
