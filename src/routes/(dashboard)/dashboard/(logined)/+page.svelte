<script lang="ts">
	import { Card, Button } from 'flowbite-svelte';
	import {
		GridSolid,
		UsersGroupSolid,
		ImageSolid,
		BriefcaseSolid,
		NewspaperSolid,
		AwardSolid,
		BadgeCheckSolid,
		LightbulbSolid,
		ShareNodesSolid,
		CogSolid,
		DownloadSolid
	} from 'flowbite-svelte-icons';
	import type { Component } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const iconMap: Record<string, Component> = {
		GridSolid,
		UsersGroupSolid,
		ImageSolid,
		BriefcaseSolid,
		NewspaperSolid,
		AwardSolid,
		BadgeCheckSolid,
		LightbulbSolid,
		ShareNodesSolid,
		CogSolid
	};

	// Filter out the 'Dashboard' link itself and any items without description
	// (though all should have description now)
	let dashboardItems = $derived(
		data.menu.filter((item) => item.label !== 'Dashboard' && item.description)
	);

	function getIcon(name: string) {
		return iconMap[name] || GridSolid;
	}

	function isRoleOverAdmin(role: string): boolean {
		const levels: Record<string, number> = {
			none: 0,
			user: 1,
			admin: 2,
			owner: 3
		};
		return (levels[role] ?? 0) >= 2;
	}

	async function handleExport() {
		try {
			const res = await fetch('/dashboard/api/admin/export');
			if (!res.ok) throw new Error('Failed to export data');

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pexisgle-backup-${new Date().toISOString()}.json`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
		} catch (e) {
			alert('Export failed. Please check console for details.');
			console.error(e);
		}
	}
</script>

<div class="p-4 pt-6">
	<div class="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
			<p class="mt-1 text-gray-500 dark:text-gray-400">
				Welcome back! Here's an overview of the system.
			</p>
		</div>
		{#if isRoleOverAdmin(data.user.role)}
			<Button color="alternative" class="gap-2" onclick={handleExport}>
				<DownloadSolid class="h-5 w-5" />
				Export All Data
			</Button>
		{/if}
	</div>

	<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each dashboardItems as item (item.label)}
			<a href={item.href}>
				<Card
					class="p-6 transition-transform hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-gray-800"
				>
					{@const Icon = getIcon(item.iconName)}
					<Icon class="mb-2 h-8 w-8 {item.color || 'text-gray-600 dark:text-gray-500'}" />
					<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
						{item.label}
					</h5>
					<p class="font-normal text-gray-700 dark:text-gray-400">
						{item.description}
					</p>
				</Card>
			</a>
		{/each}
	</div>
</div>
