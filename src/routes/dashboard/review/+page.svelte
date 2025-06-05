<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ReviewCard from '$lib/components/review/review-card.svelte';
	import RecallRating from '$lib/components/review/recall-rating.svelte';
	import SessionProgress from '$lib/components/review/session-progress.svelte';
	import NoDueCards from '$lib/components/review/no-due-cards.svelte';
	import SessionSummary from '$lib/components/review/session-summary.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import AlertTriangleIcon from '@tabler/icons-svelte/icons/alert-triangle';
	import { RecallRating as RecallRatingEnum } from '$lib/services/srs-algorithm.service.js';
	import { reviewSessionStore, reviewSessionActions } from '$lib/stores/review-session.store.js';
	import { templateService, type Template } from '$lib/services/template.service.js';
	import { fieldService } from '$lib/services/field.service.js';

	// Session summary type definition
	interface SessionSummary {
		cardsReviewed: number;
		totalTime: number;
		averageTimePerCard: number;
		correctPercentage: number;
		ratingDistribution: number[];
		ratingPercentages: number[];
		forecast: {
			dueTomorrow: number;
			dueThreeDays: number;
			dueLater: number;
		};
	}

	// Get deck ID from query parameters - using $derived instead of $state + $effect
	let deckId = $page.url.searchParams.get('deckId');

	// Initialize state variables
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let templates = $state<Record<string, Template>>({});
	let elapsedTime = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | undefined = undefined;
	let autoSaveCompleted = $state(false);
	let showSessionSummary = $state(false);
	let sessionSummaryData = $state<SessionSummary | null>(null);

	// Derived state variables using $derived
	let currentCard = $derived(() => {
		const store = $reviewSessionStore;
		if (store.cards && store.currentCardIndex < store.cards.length) {
			return store.cards[store.currentCardIndex];
		}
		return null;
	});

	let currentTemplate = $derived(() => {
		const card = currentCard();
		if (card && templates[card.template]) {
			return templates[card.template];
		}
		return null;
	});

	let sessionStats = $derived(() => {
		const store = $reviewSessionStore;
		if (store.session) {
			return {
				totalCards: store.session.totalCards,
				completedCards: store.session.completedCards,
				correctCards: store.session.totalCorrect,
				elapsedTime: elapsedTime
			};
		}
		return {
			totalCards: 0,
			completedCards: 0,
			correctCards: 0,
			elapsedTime: 0
		};
	});

	let noCardsError = $derived(() => {
		return $reviewSessionStore.error === 'No cards due for review';
	});

	let nextDueCardsInfo = $state({
		inHours: 5,
		tomorrow: 12
	});

	// Initialize review session
	async function initializeSession() {
		isLoading = true;
		error = null;

		try {
			const success = await reviewSessionActions.initializeSession(deckId);

			if (success) {
				// Load templates for the cards
				await loadTemplates();

				// Start timer
				startTimer();
			}

			isLoading = false;
		} catch (err) {
			error =
				err instanceof Error ? err.message : 'An error occurred while initializing the session';
			isLoading = false;
		}
	}

	// Load templates for the cards
	async function loadTemplates() {
		const store = $reviewSessionStore;

		if (!store.cards || store.cards.length === 0) return;

		// Get unique template IDs
		const templateIds = [...new Set(store.cards.map((card) => card.template))];

		// Load templates with their fields
		for (const templateId of templateIds) {
			try {
				const template = await templateService.getById(templateId);

				// Load fields for this template
				const fieldsResult = await fieldService.listByTemplate(templateId);

				// Add fields to the template object
				const templateWithFields = {
					...template,
					fields: fieldsResult.items
				};

				templates = { ...templates, [templateId]: templateWithFields };
			} catch (err) {
				console.error(`Error loading template ${templateId}:`, err);
			}
		}

		// Update derived state after templates are loaded
		// No need to call updateDerivedState() since we're using $derived
	}

	// Start the timer
	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);

		timerInterval = setInterval(() => {
			elapsedTime += 1;
		}, 1000);
	}

	// Handle card rating
	async function handleRate(rating: RecallRatingEnum) {
		await reviewSessionActions.rateCard(rating);
		saveProgress();

		// Check if session is complete
		if ($reviewSessionStore.currentCardIndex >= $reviewSessionStore.cards.length) {
			await finishSession();
		}
	}

	// Finish the session and show summary
	async function finishSession() {
		// Stop timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = undefined;
		}

		// Save progress and mark session as complete
		saveProgress();

		// Get session summary data
		sessionSummaryData = await getSessionSummary();
		showSessionSummary = true;

		// Auto-navigate to dashboard after showing summary for 3 seconds
		setTimeout(() => {
			goto('/dashboard');
		}, 3000);
	}

	// Handle review ahead (when no due cards)
	function handleReviewAhead() {
		// Implementation of review ahead functionality
		// This would typically involve fetching cards that are due soon
		alert('Review ahead functionality is not implemented yet');
	}

	// Handle returning to dashboard (simplified - just save and go)
	function handleReturnToDashboard() {
		saveProgress();
		goto('/dashboard');
	}

	// Save session progress
	function saveProgress() {
		if (autoSaveCompleted) return;

		// Stop timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = undefined;
		}

		// Mark as complete if there are reviewed cards
		const store = $reviewSessionStore;
		if (store.session && store.session.completedCards > 0) {
			store.session.endTime = new Date();
			store.session.isComplete = true;
		}

		autoSaveCompleted = true;
	}

	// Handle keyboard shortcuts
	function handleKeydown() {
		// Space to flip card is handled by the ReviewCard component
	}

	// Handle beforeunload event
	function handleBeforeUnload() {
		// Always save progress when user leaves the page
		saveProgress();

		// No confirmation dialog - let user leave freely
	}

	// Get session summary
	async function getSessionSummary() {
		try {
			return await reviewSessionActions.getSessionSummaryAsync();
		} catch (error) {
			console.error('Error getting session summary:', error);
			return reviewSessionActions.getSessionSummary();
		}
	}

	// Handle start new session
	function handleStartNewSession() {
		showSessionSummary = false;
		reviewSessionActions.resetSession();
		initializeSession();
	}

	// Handle return to dashboard from summary
	function handleReturnToDashboardFromSummary() {
		showSessionSummary = false;
		reviewSessionActions.resetSession();
		goto('/dashboard');
	}

	// Initialize when component mounts
	onMount(async () => {
		await initializeSession();

		// Add event listeners
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('beforeunload', handleBeforeUnload);
	});

	// Cleanup when component unmounts
	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
		}

		// Remove event listeners
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('beforeunload', handleBeforeUnload);

		// Save progress before leaving
		saveProgress();
	});
</script>

<svelte:head>
	<title>Review Session - BlendSphere</title>
</svelte:head>

<div class="bg-muted/50 flex h-screen">
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<header
			class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<SidebarTrigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<h1 class="text-lg font-semibold">Review Session</h1>
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 overflow-hidden">
			{#if showSessionSummary && sessionSummaryData}
				<div class="flex h-full items-center justify-center p-4">
					<SessionSummary
						summary={sessionSummaryData}
						onStartNewSession={handleStartNewSession}
						onReturnToDashboard={handleReturnToDashboardFromSummary}
					/>
				</div>
			{:else if isLoading}
				<div class="flex h-full items-center justify-center">
					<div class="flex flex-col items-center space-y-4">
						<Skeleton class="h-[200px] w-[400px] rounded-lg" />
						<div class="space-y-2">
							<Skeleton class="h-4 w-[250px]" />
							<Skeleton class="h-4 w-[200px]" />
						</div>
					</div>
				</div>
			{:else if error || noCardsError()}
				<div class="flex h-full items-center justify-center">
					{#if noCardsError()}
						<NoDueCards nextDueCards={nextDueCardsInfo} onReviewAhead={handleReviewAhead} />
					{:else}
						<div class="text-center">
							<div
								class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
							>
								<AlertTriangleIcon class="h-6 w-6 text-red-600" />
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">Error</h3>
							<p class="mt-1 text-sm text-gray-500">{error}</p>
							<div class="mt-6">
								<Button variant="outline" onclick={handleReturnToDashboard}>
									Return to Dashboard
								</Button>
							</div>
						</div>
					{/if}
				</div>
			{:else if currentCard() && currentTemplate()}
				<div class="container mx-auto flex h-full max-w-4xl flex-col gap-6 p-6">
					<!-- Session Progress -->
					<SessionProgress
						totalCards={sessionStats().totalCards}
						completedCards={sessionStats().completedCards}
						correctCards={sessionStats().correctCards}
						elapsedTime={sessionStats().elapsedTime}
					/>

					<!-- Review Card -->
					<div class="flex-1">
						<ReviewCard
							flashcard={currentCard()!}
							template={currentTemplate()!}
							isFlipped={$reviewSessionStore.isFlipped}
							onFlip={reviewSessionActions.flipCard}
						/>
					</div>

					<!-- Rating Component -->
					<div class="flex justify-center">
						<RecallRating disabled={!$reviewSessionStore.isFlipped} onRate={handleRate} />
					</div>
				</div>
			{:else}
				<div class="flex h-full items-center justify-center">
					<div class="text-center">
						<h3 class="mt-2 text-sm font-medium text-gray-900">No cards available</h3>
						<p class="mt-1 text-sm text-gray-500">There are no cards to review at this time.</p>
						<div class="mt-6">
							<Button variant="outline" onclick={handleReturnToDashboard}>
								Return to Dashboard
							</Button>
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>
</div>
