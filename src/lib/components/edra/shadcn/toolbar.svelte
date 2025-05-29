<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { commands } from '../commands/commands.js';
	import EdraToolBarIcon from './components/EdraToolBarIcon.svelte';
	import QuickColor from './components/QuickColor.svelte';
	import FontSize from './components/FontSize.svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		class?: string;
		editor: Editor;
		children?: Snippet<[]>;
	}

	const { class: className = '', editor, children }: Props = $props();

	const excludedCommands = ['colors', 'fonts'];
</script>

<div class={cn('edra-toolbar flex h-fit w-full flex-wrap items-center gap-1 border-b', className)}>
	{#if children}
		{@render children()}
	{:else}
		{#each Object.keys(commands).filter((key) => !excludedCommands.includes(key)) as keys (keys)}
			{@const groups = commands[keys].commands}
			{#each groups as command (command)}
				<EdraToolBarIcon {command} {editor} />
			{/each}
		{/each}
		<FontSize {editor} />
		<QuickColor {editor} />
	{/if}
</div>
