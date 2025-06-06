<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ImageIcon from '@tabler/icons-svelte/icons/photo';
	import MicrophoneIcon from '@tabler/icons-svelte/icons/microphone';
	import type { Template } from '$lib/services/template.service.js';
	import type { Field } from '$lib/services/field.service.js';

	interface Props {
		template: Template;
		initialData?: Record<string, unknown>;
		onSubmit: (data: Record<string, unknown>) => void;
		onCancel: () => void;
		isSubmitting?: boolean;
		errors?: Record<string, string>;
	}

	let {
		template,
		initialData = {},
		onSubmit,
		onCancel,
		isSubmitting = false,
		errors = {}
	}: Props = $props();

	// Helper functions for safe object access
	function safeGetFormData(data: Record<string, unknown>, key: string): unknown {
		return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	function safeSetFormData(data: Record<string, unknown>, key: string, value: unknown): void {
		if (typeof key === 'string' && key.length > 0) {
			data[key] = value;
		}
	}

	function safeHasFormData(data: Record<string, unknown>, key: string): boolean {
		return Object.prototype.hasOwnProperty.call(data, key);
	}

	// Form data state
	let fieldErrors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	// Use writable $derived for form data as recommended by Svelte
	let formData = $derived.by(() => {
		const newFormData: Record<string, unknown> = {};

		template.fields?.forEach((field: Field) => {
			const initialValue = initialData[field.name];

			if (initialValue !== undefined) {
				newFormData[field.name] = initialValue;
			} else {
				// Set appropriate default based on field type
				switch (field.type) {
					case 'TEXT':
						newFormData[field.name] = '';
						break;
					case 'IMAGE':
						newFormData[field.name] = null;
						break;
					case 'AUDIO':
						newFormData[field.name] = null;
						break;
					default:
						newFormData[field.name] = '';
				}
			}
		});

		return newFormData;
	});

	// Use writable derived for mutable form data that needs to be updated
	let mutableFormData = $derived.by(() => {
		return { ...formData };
	});

	// Derived values for performance
	let hasErrors = $derived(Object.keys(fieldErrors).length > 0);
	let isFormValid = $derived(!hasErrors && submitAttempted);

	// Update field errors when props change
	$effect(() => {
		fieldErrors = { ...errors };
	});

	const validateField = (field: Field, value: unknown): string | null => {
		if (field.required) {
			// Type-safe validation for different field types
			if (field.type === 'TEXT') {
				if (!value || (typeof value === 'string' && value.trim() === '')) {
					return `${field.label} is required`;
				}
			} else if (field.type === 'IMAGE' || field.type === 'AUDIO') {
				if (!value) {
					return `${field.label} is required`;
				}
			}
		}

		// Additional validation for TEXT fields
		if (value && field.type === 'TEXT' && typeof value === 'string') {
			// Basic validation patterns for text fields
			if (field.label.toLowerCase().includes('email')) {
				const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailPattern.test(value)) {
					return `${field.label} must be a valid email address`;
				}
			}
		}

		return null;
	};

	const handleFieldChange = (fieldName: string, value: unknown): void => {
		// Use safe object access patterns
		const fieldNameSafe = String(fieldName);
		if (fieldNameSafe && safeHasFormData(mutableFormData, fieldNameSafe)) {
			safeSetFormData(mutableFormData, fieldNameSafe, value);
		}

		// Clear field error when user starts typing
		if (
			fieldNameSafe &&
			safeHasFormData(fieldErrors, fieldNameSafe) &&
			fieldErrors[fieldNameSafe]
		) {
			fieldErrors = { ...fieldErrors, [fieldNameSafe]: '' };
		}
	};

	const handleSubmit = (event: Event): void => {
		event.preventDefault();
		submitAttempted = true;

		// Validate all fields
		const newErrors: Record<string, string> = {};
		let hasValidationErrors = false;

		template.fields?.forEach((field: Field) => {
			const fieldValue = safeGetFormData(mutableFormData, field.name);
			const error = validateField(field, fieldValue);
			if (error) {
				newErrors[field.name] = error;
				hasValidationErrors = true;
			}
		});

		fieldErrors = newErrors;

		if (!hasValidationErrors) {
			onSubmit(mutableFormData);
		}
	};

	const handleFileUpload = (fieldName: string, event: Event): void => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			// Validate file type and size
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				const fieldNameSafe = String(fieldName);
				fieldErrors = { ...fieldErrors, [fieldNameSafe]: 'File size must be less than 10MB' };
				return;
			}
			handleFieldChange(fieldName, file);
		}
	};
</script>

<!-- Accessibility: Screen reader announcements -->
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
	{#if isSubmitting}
		Submitting form...
	{:else if hasErrors && submitAttempted}
		Form has {Object.keys(fieldErrors).length} errors
	{:else if isFormValid}
		Form is valid
	{/if}
</div>

<div class="space-y-6">
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold">{template.name}</h3>
				{#if template.description}
					<p class="text-muted-foreground mt-1 text-sm">{template.description}</p>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if template.language}
					<Badge variant="outline">{template.language}</Badge>
				{/if}
				{#if template.categories && template.categories.length > 0}
					<Badge variant="secondary">{template.categories[0]}</Badge>
				{/if}
			</div>
		</div>

		{#if template.fields && template.fields.length > 0}
			<form class="space-y-6" onsubmit={handleSubmit}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{#each template.fields as field (field.id)}
						<div class="space-y-2">
							<Label for={field.name} class="flex items-center gap-2">
								{field.label}
								{#if field.required}
									<span class="text-destructive">*</span>
								{/if}
							</Label>

							{#if field.description}
								<p class="text-muted-foreground text-xs">{field.description}</p>
							{/if}

							<!-- Text Input -->
							{#if field.type === 'TEXT'}
								<Input
									id={field.name}
									bind:value={mutableFormData[field.name]}
									placeholder={field.placeholder}
									disabled={isSubmitting}
									class={fieldErrors[field.name] ? 'border-destructive' : ''}
								/>

								<!-- Image Upload -->
							{:else if field.type === 'IMAGE'}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											onclick={() => document.getElementById(`${field.name}-file`)?.click()}
											disabled={isSubmitting}
											class="gap-2"
										>
											<ImageIcon class="h-4 w-4" />
											Choose Image
										</Button>
										{#if mutableFormData[field.name]}
											<span class="text-muted-foreground text-sm">
												{(mutableFormData[field.name] as File)?.name || 'Image selected'}
											</span>
										{/if}
									</div>
									<input
										id={`${field.name}-file`}
										type="file"
										accept="image/*"
										onchange={(e) => handleFileUpload(field.name, e)}
										class="hidden"
										disabled={isSubmitting}
									/>
								</div>

								<!-- Audio Upload -->
							{:else if field.type === 'AUDIO'}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											onclick={() => document.getElementById(`${field.name}-file`)?.click()}
											disabled={isSubmitting}
											class="gap-2"
										>
											<MicrophoneIcon class="h-4 w-4" />
											Choose Audio
										</Button>
										{#if mutableFormData[field.name]}
											<span class="text-muted-foreground text-sm">
												{(mutableFormData[field.name] as File)?.name || 'Audio selected'}
											</span>
										{/if}
									</div>
									<input
										id={`${field.name}-file`}
										type="file"
										accept="audio/*"
										onchange={(e) => handleFileUpload(field.name, e)}
										class="hidden"
										disabled={isSubmitting}
									/>
								</div>
							{/if}

							<!-- Field Error -->
							{#if fieldErrors[field.name]}
								<p class="text-destructive text-xs">{fieldErrors[field.name]}</p>
							{/if}
						</div>
					{/each}
				</div>

				<div class="flex justify-end gap-3 border-t pt-6">
					<Button type="button" variant="ghost" onclick={onCancel} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create Flashcard'}
					</Button>
				</div>
			</form>
		{:else}
			<div class="text-muted-foreground py-8 text-center">
				<p>This template has no fields defined.</p>
			</div>
		{/if}
	</div>
</div>
