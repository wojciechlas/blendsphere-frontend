<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect authenticated users to dashboard
	onMount(() => {
		if ($isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>BlendSphere - AI-Powered Language Learning</title>
	<meta
		name="description"
		content="Learn languages effectively with AI-powered flashcards and spaced repetition system."
	/>
</svelte:head>

<div class="bg-background min-h-screen">
	<!-- Hero Section -->
	<section class="relative px-4 py-20">
		<div class="container mx-auto text-center">
			<div class="mb-6 flex items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-primary h-16 w-16"
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
			</div>

			<h1 class="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
				Welcome to <span class="text-primary">BlendSphere</span>
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-3xl text-xl md:text-2xl">
				Learn languages effectively with AI-powered flashcards, spaced repetition, and collaborative
				learning features designed for both individual learners and language schools.
			</p>

			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<Button size="lg" onclick={() => goto('/signup')}>Get Started</Button>
				<Button size="lg" variant="outline" onclick={() => goto('/login')}>Sign In</Button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="bg-muted/50 px-4 py-20">
		<div class="container mx-auto">
			<h2 class="mb-12 text-center text-3xl font-bold">Why Choose BlendSphere?</h2>

			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">🤖 AI-Powered</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Generate personalized flashcards automatically using advanced AI technology that
							adapts to your learning style and progress.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">🧠 Spaced Repetition</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Optimize your learning with our intelligent spaced repetition system that presents
							cards exactly when you need to review them.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">👥 Collaborative Learning</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Share flashcard decks, join classes, and learn together with other language learners
							in your community.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">🏫 For Schools</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Perfect for language schools with teacher-student management, class creation, and
							progress tracking features.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">📊 Progress Tracking</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Monitor your learning progress with detailed analytics and performance insights to
							stay motivated.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">🔒 Secure & Private</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Your data is protected with industry-standard security measures, rate limiting, and
							privacy-focused design.
						</CardDescription>
					</CardContent>
				</Card>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="px-4 py-20">
		<div class="container mx-auto text-center">
			<h2 class="mb-6 text-3xl font-bold">Ready to Transform Your Language Learning?</h2>
			<p class="text-muted-foreground mb-8 text-lg">
				Join thousands of learners who are already using BlendSphere to master new languages.
			</p>

			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<Button size="lg" onclick={() => goto('/signup')}>Create Free Account</Button>
				<Button size="lg" variant="outline" onclick={() => goto('/login')}>
					Sign In to Continue
				</Button>
			</div>
		</div>
	</section>
</div>
