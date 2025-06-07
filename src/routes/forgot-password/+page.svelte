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
	import { validatePasswordResetForm, sanitizeInput } from '$lib/utils/validation';
	import { pb } from '$lib/pocketbase';
	import { logSecurityEvent } from '$lib/utils/security';

	// Form state
	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);

	// Handle form submission
	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		// Sanitize and validate email
		const sanitizedEmail = sanitizeInput(email);

		// Validate using Zod schema
		const validation = validatePasswordResetForm(sanitizedEmail);

		if (!validation.isValid) {
			error = validation.errors[0]?.message || 'Invalid email';
			return;
		}

		// Clear previous errors
		error = '';
		isLoading = true;

		try {
			await pb.collection('users').requestPasswordReset(sanitizedEmail);

			logSecurityEvent('password_reset_requested', { email: sanitizedEmail });
			success = true;
		} catch (err) {
			console.error('Password reset error:', err);

			// Don't reveal if email exists for security reasons
			logSecurityEvent('password_reset_failed', { email: sanitizedEmail, error: String(err) });
			success = true; // Still show success to prevent email enumeration
		} finally {
			isLoading = false;
		}
	};
</script>

<svelte:head>
	<title>Reset Password - BlendSphere</title>
	<meta name="description" content="Reset your BlendSphere account password." />
</svelte:head>

<div
	class="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<!-- Left side - Reset Form -->
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<!-- Header -->
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Reset your password</h1>
				<p class="text-muted-foreground text-sm">
					Enter your email address and we'll send you a reset link
				</p>
			</div>

			<!-- Reset Form -->
			<Card>
				<CardHeader class="space-y-1">
					<CardTitle class="text-center text-2xl">Forgot Password</CardTitle>
					<CardDescription class="text-center">
						We'll send you a password reset link
					</CardDescription>
				</CardHeader>

				{#if success}
					<CardContent class="space-y-4">
						<div
							class="rounded-md border border-green-200 bg-green-50 p-4 text-center text-sm text-green-600"
						>
							<h3 class="mb-2 font-medium">Check your email</h3>
							<p>
								If an account with that email exists, we've sent you a password reset link. Please
								check your email and follow the instructions to reset your password.
							</p>
						</div>
					</CardContent>

					<CardFooter class="flex flex-col space-y-4">
						<div class="space-y-2 text-center text-sm">
							<p>Didn't receive the email?</p>
							<Button
								variant="outline"
								onclick={() => {
									success = false;
									email = '';
								}}
								class="w-full"
							>
								Try again
							</Button>
						</div>

						<div class="text-center text-sm">
							Remember your password?
							<a href="/login" class="text-primary hover:underline"> Sign in </a>
						</div>
					</CardFooter>
				{:else}
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
									oninput={() => (error = '')}
									disabled={isLoading}
									class={error ? 'border-red-500' : ''}
									autocomplete="email"
									required
								/>
								{#if error}
									<p class="text-sm text-red-500">{error}</p>
								{/if}
							</div>
						</CardContent>

						<CardFooter class="my-4 flex flex-col space-y-4">
							<Button type="submit" class="w-full" disabled={isLoading}>
								{#if isLoading}
									<div
										class="border-background mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
									></div>
									Sending reset link...
								{:else}
									Send reset link
								{/if}
							</Button>

							<div class="text-center text-sm">
								Remember your password?
								<a href="/login" class="text-primary hover:underline"> Sign in </a>
							</div>

							<div class="text-center text-sm">
								Don't have an account?
								<a href="/signup" class="text-primary hover:underline"> Sign up </a>
							</div>
						</CardFooter>
					</form>
				{/if}
			</Card>
		</div>
	</div>

	<!-- Right side - Background/Branding -->
	<div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-l">
		<div class="from-primary to-primary/80 absolute inset-0 bg-gradient-to-br"></div>
		<div class="relative z-20 flex items-center text-lg font-medium">
			<img src="/blendsphere-logo-h.svg" alt="BlendSphere Logo" class="h-8 w-auto" />
		</div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">
					"Security is our priority. Your account and data are protected with industry-standard
					security measures."
				</p>
				<footer class="text-sm">BlendSphere Security Team</footer>
			</blockquote>
		</div>
	</div>
</div>
