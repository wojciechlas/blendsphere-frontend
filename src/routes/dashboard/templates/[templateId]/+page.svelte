<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Tabs, TabsList, TabsContent } from '$lib/components/ui/tabs';
	import {
		Sidebar,
		SidebarContent,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton
	} from '$lib/components/ui/sidebar';
	import { onMount } from 'svelte';
	import { templateService, type Template } from '$lib/services/template.service';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	let template: Template | null = null;
	let loading = true;
	let error = '';
	let activeTab: 'info' | 'fields' | 'layout' | 'style' | 'preview' = 'info';

	onMount(async () => {
		try {
			const { templateId } = get(page).params;
			template = await templateService.getById(templateId);
		} catch (e) {
			error = 'Failed to load template.';
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto flex flex-col gap-6 py-6 md:flex-row">
	<!-- Sidebar Navigation -->
	<Sidebar class="w-full shrink-0 md:w-64">
		<SidebarContent>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton isActive={activeTab === 'info'} on:click={() => (activeTab = 'info')}
						>Info</SidebarMenuButton
					>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						isActive={activeTab === 'fields'}
						on:click={() => (activeTab = 'fields')}>Fields</SidebarMenuButton
					>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						isActive={activeTab === 'layout'}
						on:click={() => (activeTab = 'layout')}>Layout</SidebarMenuButton
					>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton isActive={activeTab === 'style'} on:click={() => (activeTab = 'style')}
						>Style</SidebarMenuButton
					>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						isActive={activeTab === 'preview'}
						on:click={() => (activeTab = 'preview')}>Preview</SidebarMenuButton
					>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarContent>
	</Sidebar>

	<!-- Main Content -->
	<div class="flex-1">
		{#if loading}
			<Card><CardContent>Loading...</CardContent></Card>
		{:else if error}
			<Card><CardContent class="text-destructive">{error}</CardContent></Card>
		{:else if template}
			<Tabs value={activeTab} class="w-full">
				<TabsList class="hidden" />
				<!-- Hide default tab list, use sidebar instead -->
				<TabsContent value="info" class={activeTab === 'info' ? '' : 'hidden'}>
					<Card>
						<CardHeader><CardTitle>Template Info</CardTitle></CardHeader>
						<CardContent>
							<form class="max-w-xl space-y-6">
								<div class="space-y-2">
									<label for="name" class="block text-sm font-medium"
										>Name <span class="text-destructive">*</span></label
									>
									<input
										id="name"
										type="text"
										class="input input-bordered w-full"
										maxlength="100"
										required
										bind:value={template.name}
										placeholder="Template name"
									/>
								</div>
								<div class="space-y-2">
									<label for="description" class="block text-sm font-medium">Description</label>
									<textarea
										id="description"
										class="textarea textarea-bordered w-full"
										maxlength="500"
										rows="3"
										bind:value={template.description}
										placeholder="Describe the purpose/context for AI (optional)"
									></textarea>
									<div class="text-muted-foreground text-xs">
										Used as context for AI generation. Max 500 characters.
									</div>
								</div>
								<div class="flex gap-4">
									<div class="flex-1 space-y-2">
										<label for="nativeLanguage" class="block text-sm font-medium"
											>Native Language <span class="text-destructive">*</span></label
										>
										<select
											id="nativeLanguage"
											class="select select-bordered w-full"
											required
											bind:value={template.nativeLanguage}
										>
											<option value="EN">English</option>
											<option value="ES">Spanish</option>
											<option value="FR">French</option>
											<option value="DE">German</option>
											<option value="IT">Italian</option>
											<option value="PL">Polish</option>
										</select>
									</div>
									<div class="flex-1 space-y-2">
										<label for="learningLanguage" class="block text-sm font-medium"
											>Learning Language <span class="text-destructive">*</span></label
										>
										<select
											id="learningLanguage"
											class="select select-bordered w-full"
											required
											bind:value={template.learningLanguage}
										>
											<option value="EN">English</option>
											<option value="ES">Spanish</option>
											<option value="FR">French</option>
											<option value="DE">German</option>
											<option value="IT">Italian</option>
											<option value="PL">Polish</option>
										</select>
									</div>
									<div class="flex-1 space-y-2">
										<label for="languageLevel" class="block text-sm font-medium"
											>Level <span class="text-destructive">*</span></label
										>
										<select
											id="languageLevel"
											class="select select-bordered w-full"
											required
											bind:value={template.languageLevel}
										>
											<option value="A1">A1 - Beginner</option>
											<option value="A2">A2 - Elementary</option>
											<option value="B1">B1 - Intermediate</option>
											<option value="B2">B2 - Upper Intermediate</option>
											<option value="C1">C1 - Advanced</option>
											<option value="C2">C2 - Proficient</option>
										</select>
									</div>
								</div>
								<div class="flex gap-4">
									<div class="flex-1 space-y-2">
										<label for="version" class="block text-sm font-medium">Version</label>
										<input
											id="version"
											type="text"
											class="input input-bordered w-full"
											maxlength="20"
											bind:value={template.version}
											placeholder="1.0.0"
										/>
										<div class="text-muted-foreground text-xs">
											Semantic versioning (e.g. 1.0.0)
										</div>
									</div>
									<div class="flex-1 space-y-2">
										<label for="author" class="block text-sm font-medium">Author</label>
										<input
											id="author"
											type="text"
											class="input input-disabled w-full"
											value={template.author}
											readonly
											disabled
										/>
									</div>
								</div>
								<div class="pt-4">
									<button type="submit" class="btn btn-primary">Save</button>
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="fields" class={activeTab === 'fields' ? '' : 'hidden'}>
					<Card>
						<CardHeader><CardTitle>Field Management</CardTitle></CardHeader>
						<CardContent>
							<!-- TODO: Add field manager component -->
							<div class="text-muted-foreground">Field management UI goes here.</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="layout" class={activeTab === 'layout' ? '' : 'hidden'}>
					<Card>
						<CardHeader><CardTitle>Layout Editor</CardTitle></CardHeader>
						<CardContent>
							<!-- TODO: Add layout editor (rich text, placeholder insertion) -->
							<div class="text-muted-foreground">Layout editor UI goes here.</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="style" class={activeTab === 'style' ? '' : 'hidden'}>
					<Card>
						<CardHeader><CardTitle>Style Customizer</CardTitle></CardHeader>
						<CardContent>
							<!-- TODO: Add style customizer (theme, colors, typography, spacing, custom CSS) -->
							<div class="text-muted-foreground">Style customizer UI goes here.</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="preview" class={activeTab === 'preview' ? '' : 'hidden'}>
					<Card>
						<CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
						<CardContent>
							<!-- TODO: Add live preview panel -->
							<div class="text-muted-foreground">Live preview UI goes here.</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		{/if}
	</div>
</div>
