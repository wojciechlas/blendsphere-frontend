<script lang="ts">
	import { onMount } from 'svelte';
	import { securityLogger, type SecurityEvent } from '$lib/utils/security-enhanced';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { IconAlertTriangle, IconShield, IconEye, IconRefresh } from '@tabler/icons-svelte';

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

	function getSeverityColor(
		severity: SecurityEvent['severity']
	): 'default' | 'secondary' | 'destructive' | 'outline' | undefined {
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
				return IconAlertTriangle;
			case 'medium':
				return IconEye;
			case 'low':
			default:
				return IconShield;
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
			<Button onclick={refreshEvents} variant="outline" size="sm">
				<IconRefresh class="mr-2 h-4 w-4" />
				Refresh
			</Button>
			<Button onclick={clearEvents} variant="outline" size="sm">Clear Events</Button>
		</div>
	</div>

	<!-- Security Stats -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-5">
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<IconShield class="h-5 w-5 text-blue-500" />
					<div>
						<p class="text-muted-foreground text-sm font-medium">Total Events</p>
						<p class="text-xl font-bold">{stats.total}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<IconAlertTriangle class="h-5 w-5 text-red-500" />
					<div>
						<p class="text-muted-foreground text-sm font-medium">Critical</p>
						<p class="text-xl font-bold">{stats.critical}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<IconAlertTriangle class="h-5 w-5 text-orange-500" />
					<div>
						<p class="text-muted-foreground text-sm font-medium">High</p>
						<p class="text-xl font-bold">{stats.high}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<IconEye class="h-5 w-5 text-yellow-500" />
					<div>
						<p class="text-muted-foreground text-sm font-medium">Medium</p>
						<p class="text-xl font-bold">{stats.medium}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<IconShield class="h-5 w-5 text-green-500" />
					<div>
						<p class="text-muted-foreground text-sm font-medium">Low</p>
						<p class="text-xl font-bold">{stats.low}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Recent Security Events -->
	<Card>
		<CardHeader>
			<CardTitle>Recent Security Events</CardTitle>
		</CardHeader>
		<CardContent>
			{#if securityEvents.length === 0}
				<p class="text-muted-foreground">No security events recorded recently.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									scope="col"
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Severity
								</th>
								<th
									scope="col"
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Timestamp
								</th>
								<th
									scope="col"
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Type
								</th>
								<th
									scope="col"
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Message
								</th>
								<th
									scope="col"
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Details
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each securityEvents as event (event.id)}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap">
										<Badge variant={getSeverityColor(event.severity)}>
											{@const Icon = getSeverityIcon(event.severity)}
											<Icon class="mr-1 h-3 w-3" />
											{event.severity}
										</Badge>
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
										{formatTimestamp(event.timestamp)}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{event.type}</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
										{event.message}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
										{#if event.details}
											<pre
												class="max-w-xs overflow-x-auto text-xs whitespace-pre-wrap">{JSON.stringify(
													event.details,
													null,
													2
												)}</pre>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
