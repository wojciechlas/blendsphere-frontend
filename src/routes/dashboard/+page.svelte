<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { user } from '$lib/stores/auth.store';
	import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { srsAlgorithmService } from '$lib/services/srs-algorithm.service.js';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';
	import TemplateIcon from '@tabler/icons-svelte/icons/template';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import BrainIcon from '@tabler/icons-svelte/icons/brain';
	import ClockIcon from '@tabler/icons-svelte/icons/clock';

	// State for review statistics
	let dueCardsCount = $state(0);
	let learningStreak = $state(0);
	let isLoadingStats = $state(true);

	function handleCreateTemplate() {
		goto('/dashboard/templates/create');
	}

	function handleViewTemplates() {
		goto('/dashboard/templates');
	}

	function handleStartReview() {
		goto('/dashboard/review');
	}

	// Load review statistics when component mounts
	onMount(async () => {
		if ($user?.id) {
			try {
				// Get due cards count
				dueCardsCount = await srsAlgorithmService.getDueCardsCount($user.id);

				// TODO: Implement actual learning streak calculation
				// For now, using a mock value based on user activity
				learningStreak = 7; // This should be calculated from actual review history
			} catch (error) {
				console.error('Error loading review statistics:', error);
				dueCardsCount = 0;
				learningStreak = 0;
			} finally {
				isLoadingStats = false;
			}
		}
	});
</script>

<svelte:head>
	<title>Dashboard - BlendSphere</title>
	<meta name="description" content="Your BlendSphere learning dashboard." />
</svelte:head>

<header
	class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<SidebarTrigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
		<h1 class="text-lg font-semibold">Dashboard</h1>
	</div>
</header>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
		<div class="p-6">
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<!-- Welcome Card -->
				<Card class="md:col-span-2 lg:col-span-3">
					<CardHeader>
						<CardTitle>
							Welcome{#if $user?.name}, {$user.name}{/if}! 🎉
						</CardTitle>
						<CardDescription
							>Your AI-powered language learning journey continues here.</CardDescription
						>
					</CardHeader>
					<CardContent>
						<p class="text-muted-foreground">
							Great to see you back! You're logged in and ready to continue your language learning
							journey with BlendSphere's AI-powered flashcard system.
						</p>
					</CardContent>
				</Card>

				<!-- Review Card -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<BrainIcon class="h-5 w-5" />
							Review Session
						</CardTitle>
						<CardDescription>Practice with your flashcards using spaced repetition</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Cards due today:</span>
								{#if isLoadingStats}
									<span class="text-muted-foreground">Loading...</span>
								{:else}
									<span class="font-medium">{dueCardsCount}</span>
								{/if}
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Learning streak:</span>
								{#if isLoadingStats}
									<span class="text-muted-foreground">Loading...</span>
								{:else}
									<span class="font-medium">{learningStreak} days</span>
								{/if}
							</div>
							<Button
								class="w-full"
								onclick={handleStartReview}
								disabled={isLoadingStats || dueCardsCount === 0}
							>
								<ClockIcon class="mr-2 h-4 w-4" />
								{dueCardsCount === 0 ? 'No Cards Due' : 'Start Review Session'}
							</Button>
						</div>
					</CardContent>
				</Card>

				<!-- Quick Actions -->
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Get started with your learning journey</CardDescription>
					</CardHeader>
					<CardContent class="space-y-3">
						<Button class="w-full justify-start" onclick={handleStartReview}>
							<BrainIcon class="mr-2 h-4 w-4" />
							Start Review Session
						</Button>
						<Button class="w-full justify-start" variant="outline" onclick={handleCreateTemplate}>
							<PlusIcon class="mr-2 h-4 w-4" />
							Create Template
						</Button>
						<Button class="w-full justify-start" variant="outline" onclick={handleViewTemplates}>
							<EyeIcon class="mr-2 h-4 w-4" />
							View Templates
						</Button>
						<Button class="w-full justify-start" variant="outline" disabled>
							<TemplateIcon class="mr-2 h-4 w-4" />
							Create Flashcard Deck
						</Button>
						<div class="border-t pt-2">
							<p class="text-muted-foreground text-xs">Some features coming soon!</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</div>
