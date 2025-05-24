<script lang="ts">
	import DotsIcon from '@tabler/icons-svelte/icons/dots';
	import FolderIcon from '@tabler/icons-svelte/icons/folder';
	import Share3Icon from '@tabler/icons-svelte/icons/share-3';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import type { Icon } from '@tabler/icons-svelte';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	// Support both types of items (with name or title property)
	type ItemWithName = { name: string; url: string; icon: Icon };
	type ItemWithTitle = {
		title: string;
		url: string;
		icon: Icon;
		items?: { title: string; url: string }[];
	};
	type NavItem = ItemWithName | ItemWithTitle;

	let props = $props<{
		items: NavItem[];
		title?: string;
	}>();

	// Set a default title if none is provided
	const title = props.title || 'Documents';

	const sidebar = Sidebar.useSidebar();

	// Helper function to determine if an item has a name or title property
	function hasName(item: NavItem): item is ItemWithName {
		return 'name' in item;
	}

	// Helper function to determine if an item has nested items
	function hasItems(
		item: NavItem
	): item is ItemWithTitle & { items: { title: string; url: string }[] } {
		return 'items' in item && !!item.items && item.items.length > 0;
	}
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>{title}</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each props.items as item (hasName(item) ? item.name : item.title)}
			<Sidebar.MenuItem>
				{#if hasItems(item)}
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<button {...props}>
								{#if item.icon}
									{@const Icon = item.icon}
									<Icon />
								{/if}
								<span>{item.title}</span>
								<span class="ml-auto">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="h-4 w-4"
									>
										<path d="m9 18 6-6-6-6" />
									</svg>
								</span>
							</button>
						{/snippet}
					</Sidebar.MenuButton>
					<!-- Create nested menu structure -->
					<Sidebar.Menu>
						{#each item.items as subItem (subItem.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a {...props} href={subItem.url}>
											<span>{subItem.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				{:else}
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a {...props} href={item.url}>
								{#if item.icon}
									{@const Icon = item.icon}
									<Icon />
								{/if}
								<span>{hasName(item) ? item.name : item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuAction
									{...props}
									showOnHover
									class="data-[state=open]:bg-accent rounded-sm"
								>
									<DotsIcon />
									<span class="sr-only">More</span>
								</Sidebar.MenuAction>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							class="w-24 rounded-lg"
							side={sidebar.isMobile ? 'bottom' : 'right'}
							align={sidebar.isMobile ? 'end' : 'start'}
						>
							<DropdownMenu.Item>
								<FolderIcon />
								<span>Open</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<Share3Icon />
								<span>Share</span>
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<TrashIcon />
								<span>Delete</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
