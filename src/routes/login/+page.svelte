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
	import { validateLoginForm, sanitizeInput, type ValidationError } from '$lib/utils/validation';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	// Form state
	let email = $state('');
	let password = $state('');
	let errors: ValidationError[] = $state([]);
	let submitError = $state('');
	let showPassword = $state(false);

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

		// Sanitize inputs
		const sanitizedEmail = sanitizeInput(email);
		const sanitizedPassword = sanitizeInput(password);

		// Validate form
		const validation = validateLoginForm(sanitizedEmail, sanitizedPassword);

		if (!validation.isValid) {
			errors = validation.errors;
			return;
		}

		// Clear previous errors
		errors = [];
		submitError = '';

		try {
			await authStore.login(sanitizedEmail, sanitizedPassword);

			// Redirect on successful login
			goto(redirectTo);
		} catch (error) {
			console.error('Login error:', error);

			// Handle rate limiting errors
			if (error instanceof Error && error.message.includes('Too many login attempts')) {
				submitError = error.message;
				return;
			}

			// Handle email verification error specifically
			if (error instanceof Error && error.message.includes('verify your email')) {
				submitError = error.message;
				return;
			}

			// Handle specific PocketBase errors
			if (error && typeof error === 'object' && 'status' in error) {
				switch (error.status) {
					case 400:
						submitError = 'Invalid email or password. Please check your credentials and try again.';
						break;
					case 429:
						submitError = 'Too many login attempts. Please wait a moment before trying again.';
						break;
					case 500:
						submitError = 'Server error. Please try again later.';
						break;
					default:
						submitError = 'Login failed. Please check your credentials and try again.';
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
	<title>Login - BlendSphere</title>
	<meta
		name="description"
		content="Login to your BlendSphere account to continue learning languages with AI-powered flashcards."
	/>
</svelte:head>

<div
	class="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<!-- Left side - Login Form -->
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<!-- Header -->
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
				<p class="text-muted-foreground text-sm">Enter your credentials to access your account</p>
			</div>

			<!-- Login Form -->
			<Card>
				<CardHeader class="space-y-1">
					<CardTitle class="text-center text-2xl">Login</CardTitle>
					<CardDescription class="text-center">Enter your email and password below</CardDescription>
				</CardHeader>

				<form onsubmit={handleSubmit}>
					<CardContent class="space-y-4">
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
									placeholder="Enter your password"
									bind:value={password}
									oninput={() => clearFieldError('password')}
									onkeydown={handleKeydown}
									disabled={$isLoading}
									class={getFieldError('password') ? 'border-red-500' : ''}
									autocomplete="current-password"
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
						</div>

						<!-- Submit Error -->
						{#if submitError}
							<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
								{submitError}
							</div>
						{/if}
					</CardContent>

					<CardFooter class="my-4 flex flex-col space-y-4">
						<Button type="submit" class="w-full" disabled={$isLoading}>
							{#if $isLoading}
								<div
									class="border-background mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								></div>
								Signing in...
							{:else}
								Sign in
							{/if}
						</Button>

						<!-- Links -->
						<div class="text-center text-sm">
							<a href="/forgot-password" class="text-primary hover:underline">
								Forgot your password?
							</a>
						</div>

						<div class="text-center text-sm">
							Don't have an account?
							<a href="/signup" class="text-primary hover:underline"> Sign up </a>
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
					"BlendSphere has revolutionized how I learn languages. The AI-powered flashcards adapt to
					my learning style perfectly."
				</p>
				<footer class="text-sm">Sofia Chen - Language Teacher</footer>
			</blockquote>
		</div>
	</div>
</div>

<style>
	/* Prevent zoom on iOS when focusing inputs */
	@media screen and (max-width: 767px) {
		:global(input[type='email']),
		:global(input[type='password']) {
			font-size: 16px;
		}
	}
</style>
