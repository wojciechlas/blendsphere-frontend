<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { templateService, type Template } from '$lib/services/template.service';
	import FieldManager from '$lib/components/template/field-manager.svelte';

	let template: Template | null = null;
	let loading = true;
	let error = '';
	$: templateId = $page.params.templateId;

	const languages = [
		{ value: 'EN', label: 'English' },
		{ value: 'ES', label: 'Spanish' },
		{ value: 'FR', label: 'French' },
		{ value: 'DE', label: 'German' },
		{ value: 'IT', label: 'Italian' },
		{ value: 'PL', label: 'Polish' }
	];

	const levels = [
		{ value: 'A1', label: 'A1 - Beginner' },
		{ value: 'A2', label: 'A2 - Elementary' },
		{ value: 'B1', label: 'B1 - Intermediate' },
		{ value: 'B2', label: 'B2 - Upper-Intermediate' },
		{ value: 'C1', label: 'C1 - Advanced' },
		{ value: 'C2', label: 'C2 - Proficient' }
	];

	onMount(async () => {
		if (templateId) {
			try {
				template = await templateService.getById(templateId);
			} catch (e) {
				error = 'Failed to load template.';
			} finally {
				loading = false;
			}
		}
	});

	let activeTab = 'info';

	async function handleSave() {
		if (!template) return;

		try {
			await templateService.update(template.id, template);
			// TODO: Show success toast
		} catch (e) {
			error = 'Failed to save template.';
			console.error('Error saving template:', e);
		}
	}
</script>

<div class="container mx-auto py-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold tracking-tight">Template Editor</h1>
		<p class="text-muted-foreground">Edit your flashcard template</p>
	</div>

	{#if loading}
		<Card><CardContent class="p-8 text-center">Loading...</CardContent></Card>
	{:else if error}
		<Card><CardContent class="text-destructive p-8 text-center">{error}</CardContent></Card>
	{:else if template}
		<Tabs bind:value={activeTab} class="w-full">
			<TabsList class="grid w-full grid-cols-5">
				<TabsTrigger value="info">Info</TabsTrigger>
				<TabsTrigger value="fields">Fields</TabsTrigger>
				<TabsTrigger value="layout">Layout</TabsTrigger>
				<TabsTrigger value="style">Style</TabsTrigger>
				<TabsTrigger value="preview">Preview</TabsTrigger>
			</TabsList>
			<TabsContent value="info">
				<Card>
					<CardHeader><CardTitle>Template Info</CardTitle></CardHeader>
					<CardContent>
						<form class="max-w-xl space-y-6">
							<div class="space-y-2">
								<Label for="name">Name <span class="text-destructive">*</span></Label>
								<Input
									id="name"
									type="text"
									maxlength={100}
									required
									bind:value={template.name}
									placeholder="Template name"
								/>
							</div>
							<div class="space-y-2">
								<Label for="description">Description</Label>
								<Textarea
									id="description"
									maxlength={500}
									rows={3}
									bind:value={template.description}
									placeholder="Describe the purpose/context for AI (optional)"
								/>
								<div class="text-muted-foreground text-xs">
									Used as context for AI generation. Max 500 characters.
								</div>
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div class="space-y-2">
									<Label for="nativeLanguage"
										>Native Language <span class="text-destructive">*</span></Label
									>
									<Select.Root type="single" bind:value={template.nativeLanguage}>
										<Select.Trigger>
											{template?.nativeLanguage
												? languages.find((l) => l.value === template?.nativeLanguage)?.label
												: 'Select language'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="EN">English</Select.Item>
											<Select.Item value="ES">Spanish</Select.Item>
											<Select.Item value="FR">French</Select.Item>
											<Select.Item value="DE">German</Select.Item>
											<Select.Item value="IT">Italian</Select.Item>
											<Select.Item value="PL">Polish</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
								<div class="space-y-2">
									<Label for="learningLanguage"
										>Learning Language <span class="text-destructive">*</span></Label
									>
									<Select.Root type="single" bind:value={template.learningLanguage}>
										<Select.Trigger>
											{template?.learningLanguage
												? languages.find((l) => l.value === template?.learningLanguage)?.label
												: 'Select language'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="EN">English</Select.Item>
											<Select.Item value="ES">Spanish</Select.Item>
											<Select.Item value="FR">French</Select.Item>
											<Select.Item value="DE">German</Select.Item>
											<Select.Item value="IT">Italian</Select.Item>
											<Select.Item value="PL">Polish</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
								<div class="space-y-2">
									<Label for="languageLevel">Level <span class="text-destructive">*</span></Label>
									<Select.Root type="single" bind:value={template.languageLevel}>
										<Select.Trigger>
											{template?.languageLevel
												? levels.find((l) => l.value === template?.languageLevel)?.label
												: 'Select level'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="A1">A1 - Beginner</Select.Item>
											<Select.Item value="A2">A2 - Elementary</Select.Item>
											<Select.Item value="B1">B1 - Intermediate</Select.Item>
											<Select.Item value="B2">B2 - Upper Intermediate</Select.Item>
											<Select.Item value="C1">C1 - Advanced</Select.Item>
											<Select.Item value="C2">C2 - Proficient</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="version">Version</Label>
									<Input
										id="version"
										type="text"
										maxlength={20}
										bind:value={template.version}
										placeholder="1.0.0"
									/>
									<div class="text-muted-foreground text-xs">Semantic versioning (e.g. 1.0.0)</div>
								</div>
								<div class="space-y-2">
									<Label for="author">Author</Label>
									<Input id="author" type="text" value={template.author} readonly disabled />
								</div>
							</div>
							<div class="pt-4">
								<Button type="submit" onclick={handleSave}>Save Changes</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="fields">
				<Card>
					<CardHeader><CardTitle>Field Management</CardTitle></CardHeader>
					<CardContent>
						<FieldManager templateId={template.id} />
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="layout">
				<Card>
					<CardHeader><CardTitle>Layout Editor</CardTitle></CardHeader>
					<CardContent>
						<!-- TODO: Add layout editor (rich text, placeholder insertion) -->
						<div class="text-muted-foreground">Layout editor UI goes here.</div>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="style">
				<Card>
					<CardHeader><CardTitle>Style Customizer</CardTitle></CardHeader>
					<CardContent>
						<!-- TODO: Add style customizer (theme, colors, typography, spacing, custom CSS) -->
						<div class="text-muted-foreground">Style customizer UI goes here.</div>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="preview">
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
