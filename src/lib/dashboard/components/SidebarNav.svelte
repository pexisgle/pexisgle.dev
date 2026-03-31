<script lang="ts">
	import { page } from '$app/state';
	import type { MenuItem } from '$lib/dashboard/menu';
	import { SidebarGroup, SidebarItem } from 'flowbite-svelte';
	interface Props {
		onclick?: () => void;
		items: MenuItem[];
	}

	let { onclick, items = [] }: Props = $props();

	const iconClass =
		'h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white';
</script>

<SidebarGroup>
	{#each items as item (item.href)}
		<SidebarItem
			label={item.label}
			href={item.href}
			active={item.exact
				? page.url.pathname === item.href
				: page.url.pathname.startsWith(item.href)}
			{onclick}
		>
			{#snippet icon()}
				<item.icon class={iconClass} />
			{/snippet}
		</SidebarItem>
	{/each}
</SidebarGroup>
