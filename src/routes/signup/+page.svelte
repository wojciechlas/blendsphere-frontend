<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { authStore, isLoading } from '$lib/stores/auth.store';
	import { validateSignupForm, sanitizeInput, type ValidationError } from '$lib/utils/validation';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	// Form state
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let name = $state('');
	let errors: ValidationError[] = $state([]);
	let submitError = $state('');
	let showPassword = $state(false);
	let showPasswordConfirm = $state(false);
	let agreedToTerms = $state(false);

	// Get redirect URL from query params or default to dashboard
	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/dashboard');

	// Helper to get field error
	const getFieldError = (field: string): string => {
		const error = errors.find((e) => e.field === field);
		return error ? error.message : '';
	};

	// Clear errors when user starts typing
	const clearFieldError = (field: string) => {
		errors = errors.filter((e) => e.field !== field);
		submitError = '';
	};

	// Handle form submission
	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		// Check terms agreement
		if (!agreedToTerms) {
			submitError = 'Please agree to the Terms of Service and Privacy Policy to continue.';
			return;
		}

		// Sanitize inputs
		const sanitizedEmail = sanitizeInput(email);
		const sanitizedPassword = sanitizeInput(password);
		const sanitizedPasswordConfirm = sanitizeInput(passwordConfirm);
		const sanitizedName = sanitizeInput(name);

		// Validate form
		const validation = validateSignupForm(
			sanitizedEmail,
			sanitizedPassword,
			sanitizedPasswordConfirm,
			sanitizedName || undefined
		);

		if (!validation.isValid) {
			errors = validation.errors;
			return;
		}

		// Clear previous errors
		errors = [];
		submitError = '';

		try {
			await authStore.signup(
				sanitizedEmail,
				sanitizedPassword,
				sanitizedPasswordConfirm,
				sanitizedName || undefined
			);

			// Redirect on successful signup
			goto(redirectTo);
		} catch (error) {
			console.error('Signup error:', error);

			// Handle rate limiting errors
			if (error instanceof Error && error.message.includes('Too many signup attempts')) {
				submitError = error.message;
				return;
			}

			// Handle specific PocketBase errors
			if (error && typeof error === 'object' && 'data' in error && error.data) {
				const errorData = error.data as Record<string, any>;

				// Handle field-specific errors
				if (errorData.email) {
					errors = [
						...errors,
						{
							field: 'email',
							message:
								'This email is already registered. Please use a different email or try logging in.'
						}
					];
				} else if (errorData.password) {
					errors = [
						...errors,
						{ field: 'password', message: 'Password does not meet requirements.' }
					];
				} else {
					submitError = 'Registration failed. Please try again.';
				}
			} else if (error && typeof error === 'object' && 'status' in error) {
				switch (error.status) {
					case 400:
						submitError = 'Registration failed. Please check your information and try again.';
						break;
					case 429:
						submitError =
							'Too many registration attempts. Please wait a moment before trying again.';
						break;
					case 500:
						submitError = 'Server error. Please try again later.';
						break;
					default:
						submitError = 'Registration failed. Please try again.';
				}
			} else {
				submitError = 'An unexpected error occurred. Please try again.';
			}
		}
	};

	// Handle Enter key in form
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !$isLoading) {
			const target = event.target as HTMLElement;
			const form = target.closest('form');
			if (form) {
				form.requestSubmit();
			}
		}
	};
</script>

<svelte:head>
	<title>Sign Up - BlendSphere</title>
	<meta
		name="description"
		content="Create your BlendSphere account and start learning languages with AI-powered flashcards."
	/>
</svelte:head>

<div
	class="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<!-- Left side - Signup Form -->
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
			<!-- Header -->
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Create an account</h1>
				<p class="text-muted-foreground text-sm">
					Enter your information below to create your account
				</p>
			</div>

			<!-- Signup Form -->
			<Card>
				<CardHeader class="space-y-1">
					<CardTitle class="text-center text-2xl">Sign Up</CardTitle>
					<CardDescription class="text-center">
						Join BlendSphere to start your language learning journey
					</CardDescription>
				</CardHeader>

				<form onsubmit={handleSubmit}>
					<CardContent class="space-y-4">
						<!-- Name Field (Optional) -->
						<div class="space-y-2">
							<Label for="name">Name (Optional)</Label>
							<Input
								id="name"
								type="text"
								placeholder="Your full name"
								bind:value={name}
								oninput={() => clearFieldError('name')}
								onkeydown={handleKeydown}
								disabled={$isLoading}
								class={getFieldError('name') ? 'border-red-500' : ''}
								autocomplete="name"
							/>
							{#if getFieldError('name')}
								<p class="text-sm text-red-500">{getFieldError('name')}</p>
							{/if}
						</div>

						<!-- Email Field -->
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								bind:value={email}
								oninput={() => clearFieldError('email')}
								onkeydown={handleKeydown}
								disabled={$isLoading}
								class={getFieldError('email') ? 'border-red-500' : ''}
								autocomplete="email"
								required
							/>
							{#if getFieldError('email')}
								<p class="text-sm text-red-500">{getFieldError('email')}</p>
							{/if}
						</div>

						<!-- Password Field -->
						<div class="space-y-2">
							<Label for="password">Password</Label>
							<div class="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Create a strong password"
									bind:value={password}
									oninput={() => clearFieldError('password')}
									onkeydown={handleKeydown}
									disabled={$isLoading}
									class={getFieldError('password') ? 'border-red-500' : ''}
									autocomplete="new-password"
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
									onclick={() => (showPassword = !showPassword)}
									disabled={$isLoading}
								>
									{showPassword ? 'Hide' : 'Show'}
								</Button>
							</div>
							{#if getFieldError('password')}
								<p class="text-sm text-red-500">{getFieldError('password')}</p>
							{/if}
							<p class="text-muted-foreground text-xs">
								Password must be at least 8 characters with uppercase, lowercase, number, and
								special character.
							</p>
						</div>

						<!-- Confirm Password Field -->
						<div class="space-y-2">
							<Label for="passwordConfirm">Confirm Password</Label>
							<div class="relative">
								<Input
									id="passwordConfirm"
									type={showPasswordConfirm ? 'text' : 'password'}
									placeholder="Confirm your password"
									bind:value={passwordConfirm}
									oninput={() => clearFieldError('passwordConfirm')}
									onkeydown={handleKeydown}
									disabled={$isLoading}
									class={getFieldError('passwordConfirm') ? 'border-red-500' : ''}
									autocomplete="new-password"
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
									onclick={() => (showPasswordConfirm = !showPasswordConfirm)}
									disabled={$isLoading}
								>
									{showPasswordConfirm ? 'Hide' : 'Show'}
								</Button>
							</div>
							{#if getFieldError('passwordConfirm')}
								<p class="text-sm text-red-500">{getFieldError('passwordConfirm')}</p>
							{/if}
						</div>

						<!-- Terms Agreement -->
						<div class="flex items-start space-x-2">
							<input
								type="checkbox"
								id="terms"
								bind:checked={agreedToTerms}
								disabled={$isLoading}
								class="mt-1"
								required
							/>
							<Label for="terms" class="text-sm leading-5">
								I agree to the{' '}
								<a href="/terms" target="_blank" class="text-primary hover:underline">
									Terms of Service
								</a>
								{' '}and{' '}
								<a href="/privacy" target="_blank" class="text-primary hover:underline">
									Privacy Policy
								</a>
							</Label>
						</div>

						<!-- Submit Error -->
						{#if submitError}
							<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
								{submitError}
							</div>
						{/if}
					</CardContent>

					<CardFooter class="flex flex-col space-y-4">
						<Button type="submit" class="w-full" disabled={$isLoading || !agreedToTerms}>
							{#if $isLoading}
								<div
									class="border-background mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								></div>
								Creating account...
							{:else}
								Create account
							{/if}
						</Button>

						<div class="text-center text-sm">
							Already have an account?{' '}
							<a href="/login" class="text-primary hover:underline"> Sign in </a>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	</div>

	<!-- Right side - Background/Branding -->
	<div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-l">
		<div class="from-primary to-primary/80 absolute inset-0 bg-gradient-to-br"></div>
		<div class="relative z-20 flex items-center text-lg font-medium">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mr-2 h-6 w-6"
			>
				<path d="M12 2L2 7l10 5 10-5-10-5z" />
				<path d="M2 17l10 5 10-5" />
				<path d="M2 12l10 5 10-5" />
			</svg>
			BlendSphere
		</div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">
					"The spaced repetition system combined with AI-generated flashcards has made learning
					vocabulary incredibly efficient."
				</p>
				<footer class="text-sm">Marcus Rodriguez - Medical Student</footer>
			</blockquote>
		</div>
	</div>
</div>

<style>
	/* Prevent zoom on iOS when focusing inputs */
	@media screen and (max-width: 767px) {
		:global(input[type='email']),
		:global(input[type='password']),
		:global(input[type='text']) {
			font-size: 16px;
		}
	}
</style>
