<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { templateService, type Template, type TemplateStyles } from '$lib/services/template.service';
	import { ArrowLeft, Save, Eye } from 'lucide-svelte';

	let saving = false;
	let error = '';
	let success = '';

	// Template basic information
	let templateName = '';
	let templateDescription = '';
	let nativeLanguage = '';
	let learningLanguage = '';
	let languageLevel = '';
	let isPublic = false;

	// Layout templates - start with basic placeholders
	let frontLayout = `<div class="flashcard-front">
	<h2>{{word}}</h2>
	<p class="pronunciation">{{pronunciation}}</p>
</div>`;

	let backLayout = `<div class="flashcard-back">
	<h2>{{translation}}</h2>
	<p class="example">{{example}}</p>
</div>`;

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
		{ value: 'B2', label: 'B2 - Upper Intermediate' },
		{ value: 'C1', label: 'C1 - Advanced' },
		{ value: 'C2', label: 'C2 - Proficient' }
	];

	// Default styles
	const defaultStyles: TemplateStyles = {
		theme: 'default',
		colors: {
			primary: '#2563eb',
			secondary: '#64748b',
			background: '#ffffff',
			text: '#1e293b',
			accent: '#f59e0b'
		},
		typography: {
			fontFamily: 'Inter, sans-serif',
			fontSize: '16px',
			fontWeight: '400',
			lineHeight: '1.5'
		},
		spacing: {
			padding: '1rem',
			margin: '0.5rem',
			borderRadius: '0.5rem'
		}
	};

	async function handleSave() {
		try {
			saving = true;
			error = '';
			success = '';

			// Validate required fields
			if (!templateName.trim()) {
				error = 'Template name is required';
				return;
			}
			if (!nativeLanguage) {
				error = 'Native language is required';
				return;
			}
			if (!learningLanguage) {
				error = 'Learning language is required';
				return;
			}
			if (!languageLevel) {
				error = 'Language level is required';
				return;
			}
			if (nativeLanguage === learningLanguage) {
				error = 'Native and learning languages must be different';
				return;
			}

			const templateData = {
				name: templateName.trim(),
				description: templateDescription.trim() || undefined,
				version: '1.0.0',
				author: 'User', // This will be overridden by the service with actual user data
				nativeLanguage: nativeLanguage as Template['nativeLanguage'],
				learningLanguage: learningLanguage as Template['learningLanguage'],
				languageLevel: languageLevel as Template['languageLevel'],
				frontLayout,
				backLayout,
				styles: defaultStyles,
				user: '', // This will be set by the service
				isPublic
			};

			const newTemplate = await templateService.create(templateData);
			success = 'Template created successfully!';
			
			// Redirect to template list after a short delay
			setTimeout(() => {
				goto('/dashboard/templates');
			}, 1500);

		} catch (err) {
			error = 'Failed to create template. Please try again.';
			console.error('Error creating template:', err);
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/dashboard/templates');
	}

	function handlePreview() {
		// TODO: Implement preview functionality
		alert('Preview functionality will be implemented in the next step');
	}
</script>

<svelte:head>
	<title>Create Template - BlendSphere</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-4xl space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="sm" on:click={handleCancel}>
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Create Template</h1>
			<p class="text-muted-foreground">
				Define the structure and appearance of your flashcards
			</p>
		</div>
	</div>

	<!-- Messages -->
	{#if error}
		<div class="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="bg-green-100 text-green-800 text-sm p-3 rounded-md">
			{success}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Template Information -->
		<Card>
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
				<CardDescription>
					Set up the basic properties of your template
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Template Name *</Label>
					<Input
						id="name"
						bind:value={templateName}
						placeholder="e.g., Basic Vocabulary"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						bind:value={templateDescription}
						placeholder="Describe what this template is for (used as AI context)"
						rows={3}
					/>
				</div>

				<Separator />

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label>Native Language *</Label>
						<Select bind:value={nativeLanguage}>
							<SelectTrigger>
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent>
								{#each languages as language}
									<SelectItem value={language.value}>{language.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label>Learning Language *</Label>
						<Select bind:value={learningLanguage}>
							<SelectTrigger>
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent>
								{#each languages as language}
									<SelectItem value={language.value}>{language.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div class="space-y-2">
					<Label>Language Level *</Label>
					<Select bind:value={languageLevel}>
						<SelectTrigger>
							<SelectValue placeholder="Select level" />
						</SelectTrigger>
						<SelectContent>
							{#each levels as level}
								<SelectItem value={level.value}>{level.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="public"
						bind:checked={isPublic}
						class="rounded border-gray-300"
					/>
					<Label for="public">Make this template public (others can see and clone it)</Label>
				</div>
			</CardContent>
		</Card>

		<!-- Layout Templates -->
		<Card>
			<CardHeader>
				<CardTitle>Layout Templates</CardTitle>
				<CardDescription>
					Define the HTML structure for front and back of flashcards
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="front-layout">Front Layout</Label>
					<Textarea
						id="front-layout"
						bind:value={frontLayout}
						placeholder="HTML template for the front of the flashcard"
						rows={6}
						class="font-mono text-sm"
					/>
					<p class="text-xs text-muted-foreground">
						Use `{{'{{fieldName}}'}}` to insert field values
					</p>
				</div>

				<div class="space-y-2">
					<Label for="back-layout">Back Layout</Label>
					<Textarea
						id="back-layout"
						bind:value={backLayout}
						placeholder="HTML template for the back of the flashcard"
						rows={6}
						class="font-mono text-sm"
					/>
					<p class="text-xs text-muted-foreground">
						Use `{{'{{fieldName}}'}}` to insert field values
					</p>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Actions -->
	<div class="flex justify-between">
		<div class="flex gap-2">
			<Button variant="outline" on:click={handleCancel} disabled={saving}>
				Cancel
			</Button>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" on:click={handlePreview} disabled={saving}>
				<Eye class="mr-2 h-4 w-4" />
				Preview
			</Button>
			<Button on:click={handleSave} disabled={saving || !templateName.trim()}>
				{#if saving}
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
				{:else}
					<Save class="mr-2 h-4 w-4" />
				{/if}
				Save Template
			</Button>
		</div>
	</div>
</div>
