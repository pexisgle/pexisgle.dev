<script lang="ts">
	import { Card, Button, Spinner } from 'flowbite-svelte';
	import { GridSolid, UploadSolid } from 'flowbite-svelte-icons';
	import { toast } from '$lib/stores/toast';
	import { menuItems, iconMap } from '$lib/menu';
	import { ghTriggerWorkflow } from '$lib/github';

	let { data } = $props();

	let building = $state(false);

	// Filter out the 'Dashboard' link itself and any items without description
	let dashboardItems = $derived(
		menuItems.filter((item) => item.label !== 'Dashboard' && item.description)
	);

	function getIcon(name: string) {
		return iconMap[name] || GridSolid;
	}

	async function handleBuild() {
		building = true;
		try {
			const token = data.token;
			await ghTriggerWorkflow(token, 'deploy.yml');
			toast.success(
				'デプロイワークフローをトリガーしました。GitHub Actionsで進捗を確認してください。'
			);
		} catch (e) {
			toast.error('デプロイに失敗しました: ' + e);
		} finally {
			building = false;
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
		<div class="flex flex-wrap gap-2">
			<Button color="blue" class="gap-2" disabled={building} onclick={handleBuild}>
				{#if building}
					<Spinner size="4" />
				{:else}
					<UploadSolid class="h-5 w-5" />
				{/if}
				{building ? 'Building...' : 'Build & Deploy'}
			</Button>
		</div>
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
