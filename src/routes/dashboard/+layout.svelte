<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();
</script>

<SidebarProvider>
	<AppSidebar />
	<SidebarInset>
		{@render children()}
	</SidebarInset>
</SidebarProvider>
