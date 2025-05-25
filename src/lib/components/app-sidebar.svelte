<script lang="ts">
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import BookIcon from '@tabler/icons-svelte/icons/book';
	import UsersIcon from '@tabler/icons-svelte/icons/users';
	import CardsFilled from '@tabler/icons-svelte/icons/cards-filled';
	import BrainIcon from '@tabler/icons-svelte/icons/brain';
	import ChartLineIcon from '@tabler/icons-svelte/icons/chart-line';
	import TemplateIcon from '@tabler/icons-svelte/icons/template';
	import FileAiIcon from '@tabler/icons-svelte/icons/file-ai';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import HelpIcon from '@tabler/icons-svelte/icons/help';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import LayersIntersect from '@tabler/icons-svelte/icons/layers-intersect';
	import NavDocuments from './nav-documents.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { user } from '$lib/stores/auth.store';
	import type { ComponentProps } from 'svelte';

	const data = {
		navMain: [
			{
				title: 'Daily Review',
				url: '/review',
				icon: BrainIcon
			},
			{
				title: 'Dashboard',
				url: '/dashboard',
				icon: DashboardIcon
			},
			{
				title: 'My Decks',
				url: '/decks',
				icon: LayersIntersect
			},
			{
				title: 'Flashcards',
				url: '/flashcards',
				icon: CardsFilled
			},
			{
				title: 'Classes',
				url: '/classes',
				icon: UsersIcon
			}
		],
		navLearning: [
			{
				title: 'Templates',
				icon: TemplateIcon,
				url: '/templates'
			},
			{
				title: 'Progress',
				icon: ChartLineIcon,
				url: '/progress'
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '/settings',
				icon: SettingsIcon
			},
			{
				title: 'Help',
				url: '/help',
				icon: HelpIcon
			},
			{
				title: 'Search',
				url: '/search',
				icon: SearchIcon
			}
		],
		resources: [
			{
				name: 'Learning Resources',
				url: '/resources',
				icon: BookIcon
			}
		]
	};

	// Using let with props() function for Svelte 5
	let props = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...props}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<BrainIcon class="!size-5" />
							<span class="text-base font-semibold">BlendSphere</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavDocuments title="Learning Tools" items={data.navLearning} />
		<NavDocuments title="Resources" items={data.resources} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if $user}
			<NavUser
				user={{
					name: $user.name || 'User',
					email: $user.email || '',
					avatar: $user.avatar || '/avatars/default.jpg'
				}}
			/>
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
