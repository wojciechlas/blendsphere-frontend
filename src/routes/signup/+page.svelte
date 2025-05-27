<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select'; // Changed import for Select
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
	import { Language, UserRole } from '$lib/components/schemas'; // Assuming schemas.ts exports these enums
	import { getLanguageName } from '$lib/constants/template.constants';

	// Form state
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let name = $state(''); // Optional
	let username = $state(''); // Required
	let nativeLanguage = $state(''); // Required
	let aboutMe = $state(''); // Optional
	let role = $state(UserRole.INDIVIDUAL_LEARNER); // Default role
	let errors: ValidationError[] = $state([]);
	let submitError = $state('');
	let successMessage = $state('');
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

		if (!agreedToTerms) {
			submitError = 'You must agree to the terms and conditions.';
			return;
		}

		// Sanitize inputs
		const sanitizedEmail = sanitizeInput(email);
		const sanitizedPassword = password; // Passwords are not typically sanitized like other text inputs
		const sanitizedPasswordConfirm = passwordConfirm;
		const sanitizedName = sanitizeInput(name);
		const sanitizedUsername = sanitizeInput(username);
		const sanitizedAboutMe = sanitizeInput(aboutMe);

		// Validate form (assuming validateSignupForm is updated to include new fields)
		const validation = validateSignupForm(
			sanitizedEmail,
			sanitizedPassword,
			sanitizedPasswordConfirm,
			sanitizedName || undefined,
			sanitizedUsername,
			nativeLanguage,
			role
			// aboutMe is optional and might not be part of initial validation, or handled differently
		);

		if (!validation.isValid) {
			errors = validation.errors;
			return;
		}

		// Clear previous errors
		errors = [];
		submitError = '';
		successMessage = '';

		try {
			const result = await authStore.signup(
				sanitizedEmail,
				sanitizedPassword,
				sanitizedPasswordConfirm,
				sanitizedName || undefined,
				sanitizedUsername,
				nativeLanguage,
				sanitizedAboutMe || undefined,
				role
			);

			// Show success message about email verification
			submitError = ''; // Clear any previous errors
			successMessage =
				result.message ||
				'Account created successfully! Please check your email to verify your account before logging in.';

			// Clear the form
			email = '';
			password = '';
			passwordConfirm = '';
			name = '';
			username = '';
			nativeLanguage = '';
			aboutMe = '';
			role = UserRole.INDIVIDUAL_LEARNER; // Reset to default instead of empty string
			agreedToTerms = false;
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
				if (errorData.username) {
					errors = [
						...errors,
						{ field: 'username', message: 'Username already exists or is invalid.' }
					];
				}
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
		if (event.key === 'Enter' && !$isLoading && agreedToTerms) {
			handleSubmit(new SubmitEvent('submit'));
		}
	};

	const languageOptions = Object.values(Language);
	const roleOptions = Object.values(UserRole);

	// Helper function to get display label for role
	const getRoleLabel = (role: UserRole): string => {
		const labels: Record<UserRole, string> = {
			[UserRole.ADMIN]: 'Admin',
			[UserRole.TEACHER]: 'Teacher',
			[UserRole.STUDENT]: 'Student',
			[UserRole.INDIVIDUAL_LEARNER]: 'Individual Learner'
		};
		return labels[role] || role;
	};
</script>

<svelte:head>
	<title>Sign Up - BlendSphere</title>
	<meta name="description" content="Create your BlendSphere account to start learning languages." />
</svelte:head>

<div
	class="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<!-- Left side - Signup Form -->
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
			<Card class="w-full">
				<CardHeader class="space-y-1 text-center">
					<img src="/logo-color.svg" alt="BlendSphere Logo" class="mx-auto mb-4 h-16 w-auto" />
					<CardTitle class="text-2xl">Create an Account</CardTitle>
					<CardDescription>Enter your details below to get started</CardDescription>
				</CardHeader>

				<form onsubmit={handleSubmit}>
					<CardContent class="space-y-4">
						<!-- Name Field (Optional) -->
						<div class="space-y-2">
							<Label for="name">Full Name (Optional)</Label>
							<Input
								id="name"
								placeholder="John Doe"
								bind:value={name}
								oninput={() => clearFieldError('name')}
								disabled={$isLoading}
								class={getFieldError('name') ? 'border-red-500' : ''}
								autocomplete="name"
							/>
							{#if getFieldError('name')}
								<p class="text-sm text-red-500">{getFieldError('name')}</p>
							{/if}
						</div>

						<!-- Username Field (Required) -->
						<div class="space-y-2">
							<Label for="username">Username</Label>
							<Input
								id="username"
								placeholder="johndoe123"
								bind:value={username}
								oninput={() => clearFieldError('username')}
								onkeydown={handleKeydown}
								disabled={$isLoading}
								class={getFieldError('username') ? 'border-red-500' : ''}
								autocomplete="username"
								required
							/>
							{#if getFieldError('username')}
								<p class="text-sm text-red-500">{getFieldError('username')}</p>
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

						<!-- Native Language Field (Required) -->
						<div class="space-y-2">
							<Label for="nativeLanguage">Native Language</Label>
							<Select.Root type="single" bind:value={nativeLanguage}>
								<Select.Trigger
									id="nativeLanguage"
									class={getFieldError('nativeLanguage') ? 'border-red-500' : ''}
								>
									{nativeLanguage
										? getLanguageName(nativeLanguage as Language)
										: 'Select your native language'}
								</Select.Trigger>
								<Select.Content>
									{#each languageOptions as lang}
										<Select.Item value={lang}>{getLanguageName(lang)}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							{#if getFieldError('nativeLanguage')}
								<p class="text-sm text-red-500">{getFieldError('nativeLanguage')}</p>
							{/if}
						</div>

						<!-- Role Field (Defaulted, can be hidden or shown based on logic) -->
						<div class="space-y-2">
							<Label for="role">Account Type</Label>
							<Select.Root type="single" bind:value={role}>
								<Select.Trigger id="role" class={getFieldError('role') ? 'border-red-500' : ''}>
									{role ? getRoleLabel(role as UserRole) : 'Select account type'}
								</Select.Trigger>
								<Select.Content>
									{#each roleOptions as r}
										<Select.Item value={r}>{getRoleLabel(r)}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							{#if getFieldError('role')}
								<p class="text-sm text-red-500">{getFieldError('role')}</p>
							{/if}
						</div>

						<!-- About Me Field (Optional) -->
						<div class="space-y-2">
							<Label for="aboutMe">About Me (Optional)</Label>
							<Textarea
								id="aboutMe"
								placeholder="Tell us a bit about yourself, what you like and dislike, your interests, or hobbies..."
								bind:value={aboutMe}
								oninput={() => clearFieldError('aboutMe')}
								disabled={$isLoading}
								class="min-h-[80px] {getFieldError('aboutMe') ? 'border-red-500' : ''}"
								maxlength={500}
							/>
							{#if getFieldError('aboutMe')}
								<p class="text-sm text-red-500">{getFieldError('aboutMe')}</p>
							{/if}
						</div>

						<!-- Terms and Conditions -->
						<div class="flex items-center space-x-2 pt-2">
							<input
								type="checkbox"
								id="terms"
								bind:checked={agreedToTerms}
								disabled={$isLoading}
								class="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
							/>
							<Label for="terms" class="text-muted-foreground text-sm font-normal">
								I agree to the <a
									href="/terms"
									target="_blank"
									class="hover:text-primary underline underline-offset-4">terms and conditions</a
								>.
							</Label>
						</div>

						<!-- Success Message -->
						{#if successMessage}
							<div
								class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600"
							>
								{successMessage}
							</div>
						{/if}

						<!-- Submit Error -->
						{#if submitError}
							<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
								{submitError}
							</div>
						{/if}
					</CardContent>

					<CardFooter class="my-4 flex-col items-stretch space-y-4">
						<Button type="submit" class="w-full" disabled={$isLoading || !agreedToTerms}>
							{#if $isLoading}
								<svg
									class="mr-2 h-4 w-4 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Signing Up...
							{:else}
								Create Account
							{/if}
						</Button>

						<!-- Social Logins -->
						<div class="relative">
							<div class="absolute inset-0 flex items-center">
								<span class="w-full border-t"></span>
							</div>
							<div class="relative flex justify-center text-xs uppercase">
								<span class="bg-card text-muted-foreground px-2"> Or continue with </span>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<Button
								variant="outline"
								type="button"
								disabled={$isLoading}
								onclick={() => authStore.loginWithProvider('google', redirectTo)}
							>
								<!-- Google Icon -->
								<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
									<path d="M1 1h22v22H1z" fill="none" />
								</svg>
								Google
							</Button>
							<Button
								variant="outline"
								type="button"
								disabled={$isLoading}
								onclick={() => authStore.loginWithProvider('facebook', redirectTo)}
							>
								<!-- Facebook Icon -->
								<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"
									/>
								</svg>
								Facebook
							</Button>
						</div>
					</CardFooter>
				</form>

				<p class="text-muted-foreground mt-6 px-8 text-center text-sm">
					Already have an account? <a
						href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
						class="hover:text-primary underline underline-offset-4"
					>
						Log in
					</a>
				</p>
			</Card>
		</div>
	</div>

	<!-- Right side - Image/Branding -->
	<div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
		<div
			class="absolute inset-0 bg-cover bg-center"
			style="background-image: url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80');"
		></div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">
					&ldquo;BlendSphere has transformed my language learning. The AI tools and community make
					it engaging and effective.&rdquo;
				</p>
				<footer class="text-sm">Sofia Davis, Language Enthusiast</footer>
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
