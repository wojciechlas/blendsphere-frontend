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
	<div class="grid auto-rows-min gap-4 md:grid-cols-3">
		<div class="bg-muted/50 aspect-video rounded-xl"></div>
		<div class="bg-muted/50 aspect-video rounded-xl"></div>
		<div class="bg-muted/50 aspect-video rounded-xl"></div>
	</div>
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

				<!-- User Info Card -->
				{#if $user}
					<Card>
						<CardHeader>
							<CardTitle>Account Information</CardTitle>
							<CardDescription>Your BlendSphere account details</CardDescription>
						</CardHeader>
						<CardContent class="space-y-3">
							<div class="flex items-center space-x-3">
								<div class="flex-shrink-0">
									<div
										class="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full font-semibold"
									>
										{$user.name
											? $user.name.charAt(0).toUpperCase()
											: $user.email.charAt(0).toUpperCase()}
									</div>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-foreground text-sm font-medium">
										{$user.name || 'User'}
									</p>
									<p class="text-muted-foreground truncate text-sm">
										{$user.email}
									</p>
								</div>
							</div>
							<div class="border-t pt-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Account Status:</span>
									<span class="font-medium text-green-600">Active</span>
								</div>
								<div class="mt-1 flex justify-between text-sm">
									<span class="text-muted-foreground">Member Since:</span>
									<span class="font-medium">
										{new Date($user.created).toLocaleDateString()}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Quick Actions -->
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<Button class="w-full" variant="outline" disabled>Create Flashcard Deck</Button>
						<Button class="w-full" variant="outline" disabled>Join a Class</Button>
						<Button class="w-full" variant="outline" disabled>Start Learning</Button>
						<p class="text-muted-foreground mt-2 text-xs">Features coming soon!</p>
					</CardContent>
				</Card>

				<!-- Security Info -->
				<Card>
					<CardHeader>
						<CardTitle>Security Features</CardTitle>
					</CardHeader>
					<CardContent>
						<ul class="text-muted-foreground space-y-1 text-sm">
							<li>✅ Secure authentication</li>
							<li>✅ Password encryption</li>
							<li>✅ Rate limiting protection</li>
							<li>✅ Session timeout</li>
							<li>✅ Input validation</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</div>
