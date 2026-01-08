<script lang="ts">
	import { page } from '$app/stores';
	import { SidebarGroup, SidebarItem } from 'flowbite-svelte';
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
		CogSolid
	} from 'flowbite-svelte-icons';
	import type { Component } from 'svelte';

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
				? $page.url.pathname === item.href
				: $page.url.pathname.startsWith(item.href)}
			{onclick}
		>
			{#snippet icon()}
				<Icon class={iconClass} />
			{/snippet}
		</SidebarItem>
	{/each}
</SidebarGroup>
<SidebarGroup>
	<SidebarItem
		label="Settings"
		href="/dashboard/settings"
		active={$page.url.pathname.startsWith('/dashboard/settings')}
		{onclick}
	>
		{#snippet icon()}
			<CogSolid class={iconClass} />
		{/snippet}
	</SidebarItem>
</SidebarGroup>
