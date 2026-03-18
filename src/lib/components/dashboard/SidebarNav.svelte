<script lang="ts">
	import { page } from '$app/state';
	import { SidebarGroup, SidebarItem } from 'flowbite-svelte';
	import { GridSolid } from 'flowbite-svelte-icons';
	import { iconMap } from '$lib/menu';

	interface Props {
		onclick?: () => void;
		items: {
			label: string;
			href: string;
			iconName: string;
			exact?: boolean;
		}[];
	}

	let { onclick, items = [] }: Props = $props();

	const iconClass =
		'h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white';
</script>

<SidebarGroup>
	{#each items as item (item.href)}
		{@const Icon = iconMap[item.iconName] || GridSolid}
		<SidebarItem
			label={item.label}
			href={item.href}
			active={item.exact
				? page.url.pathname === item.href
				: page.url.pathname.startsWith(item.href)}
			{onclick}
		>
			{#snippet icon()}
				<Icon class={iconClass} />
			{/snippet}
		</SidebarItem>
	{/each}
</SidebarGroup>
