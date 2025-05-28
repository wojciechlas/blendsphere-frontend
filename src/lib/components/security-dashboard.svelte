<script lang="ts">
	import { onMount } from 'svelte';
	import { securityLogger, type SecurityEvent } from '$lib/utils/security-enhanced';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, Shield, Eye, RefreshCw } from 'lucide-svelte';

	let securityEvents: SecurityEvent[] = [];
	let stats = {
		total: 0,
		critical: 0,
		high: 0,
		medium: 0,
		low: 0
	};

	function refreshEvents() {
		securityEvents = securityLogger.getRecentEvents(50);
		updateStats();
	}

	function updateStats() {
		stats.total = securityEvents.length;
		stats.critical = securityLogger.getEventsBySeverity('critical').length;
		stats.high = securityLogger.getEventsBySeverity('high').length;
		stats.medium = securityLogger.getEventsBySeverity('medium').length;
		stats.low = securityLogger.getEventsBySeverity('low').length;
	}

	function getSeverityColor(severity: SecurityEvent['severity']): string {
		switch (severity) {
			case 'critical':
				return 'destructive';
			case 'high':
				return 'destructive';
			case 'medium':
				return 'default';
			case 'low':
				return 'secondary';
			default:
				return 'secondary';
		}
	}

	function getSeverityIcon(severity: SecurityEvent['severity']) {
		switch (severity) {
			case 'critical':
			case 'high':
				return AlertTriangle;
			case 'medium':
				return Eye;
			case 'low':
			default:
				return Shield;
		}
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	function clearEvents() {
		// In a real implementation, this would call a method to clear events
		// For now, we'll just refresh to show it's working
		refreshEvents();
	}

	onMount(() => {
		refreshEvents();

		// Refresh every 30 seconds
		const interval = setInterval(refreshEvents, 30000);

		return () => clearInterval(interval);
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">Security Monitoring</h2>
			<p class="text-muted-foreground">Real-time security event tracking and analysis</p>
		</div>
		<div class="flex gap-2">
			<Button on:click={refreshEvents} variant="outline" size="sm">
				<RefreshCw class="mr-2 h-4 w-4" />
				Refresh
			</Button>
			<Button on:click={clearEvents} variant="outline" size="sm">Clear Events</Button>
		</div>
	</div>

	<!-- Security Stats -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-5">
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<Shield class="h-5 w-5 text-blue-500" />
					<div>
						<p class="text-sm font-medium">Total Events</p>
						<p class="text-2xl font-bold">{stats.total}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<AlertTriangle class="h-5 w-5 text-red-500" />
					<div>
						<p class="text-sm font-medium">Critical</p>
						<p class="text-2xl font-bold text-red-500">{stats.critical}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<AlertTriangle class="h-5 w-5 text-orange-500" />
					<div>
						<p class="text-sm font-medium">High</p>
						<p class="text-2xl font-bold text-orange-500">{stats.high}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<Eye class="h-5 w-5 text-yellow-500" />
					<div>
						<p class="text-sm font-medium">Medium</p>
						<p class="text-2xl font-bold text-yellow-500">{stats.medium}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<Shield class="h-5 w-5 text-green-500" />
					<div>
						<p class="text-sm font-medium">Low</p>
						<p class="text-2xl font-bold text-green-500">{stats.low}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Recent Events -->
	<Card>
		<CardHeader>
			<CardTitle>Recent Security Events</CardTitle>
		</CardHeader>
		<CardContent>
			{#if securityEvents.length === 0}
				<div class="text-muted-foreground py-8 text-center">
					<Shield class="mx-auto mb-4 h-12 w-12 opacity-50" />
					<p>No security events recorded</p>
					<p class="text-sm">This is good news! Your application is secure.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each securityEvents as event (event.timestamp + event.type)}
						<div class="flex items-start space-x-4 rounded-lg border p-4">
							<div class="flex-shrink-0">
								{#if getSeverityIcon(event.severity)}
									<svelte:component
										this={getSeverityIcon(event.severity)}
										class="h-5 w-5 text-{getSeverityColor(event.severity) === 'destructive'
											? 'red'
											: getSeverityColor(event.severity) === 'default'
												? 'yellow'
												: 'gray'}-500"
									/>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="font-medium">{event.type.replace(/_/g, ' ').toUpperCase()}</h4>
										<p class="text-muted-foreground text-sm">{formatTimestamp(event.timestamp)}</p>
									</div>
									<Badge variant={getSeverityColor(event.severity)}>
										{event.severity}
									</Badge>
								</div>
								{#if Object.keys(event.details).length > 0}
									<div class="mt-2">
										<details class="text-sm">
											<summary class="text-muted-foreground hover:text-foreground cursor-pointer">
												Event Details
											</summary>
											<div class="bg-muted mt-2 rounded p-2 font-mono text-xs">
												{JSON.stringify(event.details, null, 2)}
											</div>
										</details>
									</div>
								{/if}
								{#if event.userAgent}
									<p class="text-muted-foreground mt-1 text-xs">
										User Agent: {event.userAgent.slice(0, 80)}...
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Security Recommendations -->
	<Card>
		<CardHeader>
			<CardTitle>Security Recommendations</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<div class="flex items-start space-x-3">
					<Shield class="mt-0.5 h-5 w-5 text-green-500" />
					<div>
						<h4 class="font-medium">Regular Security Audits</h4>
						<p class="text-muted-foreground text-sm">
							Review security events weekly and investigate any unusual patterns.
						</p>
					</div>
				</div>

				<div class="flex items-start space-x-3">
					<Shield class="mt-0.5 h-5 w-5 text-blue-500" />
					<div>
						<h4 class="font-medium">Keep Dependencies Updated</h4>
						<p class="text-muted-foreground text-sm">
							Run <code class="bg-muted rounded px-1">npm audit</code> regularly and update vulnerable
							packages.
						</p>
					</div>
				</div>

				<div class="flex items-start space-x-3">
					<Shield class="mt-0.5 h-5 w-5 text-purple-500" />
					<div>
						<h4 class="font-medium">Monitor Rate Limiting</h4>
						<p class="text-muted-foreground text-sm">
							Watch for excessive rate limiting events which may indicate attack attempts.
						</p>
					</div>
				</div>

				<div class="flex items-start space-x-3">
					<Shield class="mt-0.5 h-5 w-5 text-orange-500" />
					<div>
						<h4 class="font-medium">Review Authentication Logs</h4>
						<p class="text-muted-foreground text-sm">
							Investigate failed login attempts and unusual authentication patterns.
						</p>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
