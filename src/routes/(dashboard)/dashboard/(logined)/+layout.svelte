<script lang="ts">
	import '../layout.css';
	import { afterNavigate } from '$app/navigation';
	import {
		Navbar,
		NavBrand,
		NavHamburger,
		Sidebar,
		SidebarWrapper,
		Drawer,
		CloseButton,
		Avatar,
		Dropdown,
		DropdownHeader,
		DropdownItem,
		DarkMode
	} from 'flowbite-svelte';
	import { GridSolid, BellSolid } from 'flowbite-svelte-icons';
	import type { LayoutProps } from './$types';
	import SidebarNav from '$lib/components/SidebarNav.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { data, children }: LayoutProps = $props();

	let drawerOpen = $state(false);

	const closeDrawer = () => {
		drawerOpen = false;
	};

	// Close drawer on navigation
	afterNavigate(() => {
		closeDrawer();
	});
</script>

<header
	class="fixed top-0 z-40 mx-auto h-16 w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
>
	<Navbar fluid color="default" class="px-4 py-2.5">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center">
				<NavHamburger onclick={() => (drawerOpen = !drawerOpen)} class="mr-3 md:block lg:hidden" />
				<NavBrand href="/dashboard" class="mr-6">
					<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
						Pexisgle Dashboard
					</span>
				</NavBrand>
			</div>

			<div class="flex items-center gap-3 lg:order-2">
				<!-- Notifications -->
				<button
					type="button"
					class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-4 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-600"
				>
					<span class="sr-only">View notifications</span>
					<BellSolid class="h-5 w-5" />
				</button>

				<DarkMode
					class="rounded-lg p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
				/>

				<div class="relative flex cursor-pointer items-center gap-2">
					<Avatar size="sm" class="border border-gray-300 dark:border-gray-500">
						{data.user.username.slice(0, 2).toUpperCase()}
					</Avatar>
					<div class="hidden text-left md:block">
						<div class="text-sm font-medium text-gray-900 dark:text-white">
							{data.user.username}
						</div>
					</div>
				</div>
				<Dropdown placement="bottom-end">
					<DropdownHeader>
						<span class="block text-sm">{data.user.username}</span>
						<span class="block truncate text-sm font-medium">{data.user.role}</span>
					</DropdownHeader>
					<DropdownItem href="/dashboard/settings">Settings</DropdownItem>
					<DropdownItem class="p-0">
						<form action="/dashboard" method="POST" class="w-full">
							<button
								type="submit"
								class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
							>
								Logout
							</button>
						</form>
					</DropdownItem>
				</Dropdown>
			</div>
		</div>
	</Navbar>
</header>

<div class="flex h-screen overflow-hidden bg-gray-50 pt-16 dark:bg-gray-900">
	<div
		class="transition-width fixed top-16 bottom-0 left-0 z-20 hidden w-64 shrink-0 flex-col lg:flex"
		aria-label="Sidebar container"
	>
		<Sidebar
			class="relative h-full border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
		>
			<SidebarWrapper class="flex h-full flex-col overflow-y-auto pt-5 pb-4">
				<SidebarNav items={data.menu} />
			</SidebarWrapper>
		</Sidebar>
	</div>

	<div
		class="fixed inset-0 z-10 hidden bg-gray-900/50 dark:bg-gray-900/90"
		id="sidebarBackdrop"
		class:hidden={!drawerOpen}
		onclick={closeDrawer}
		role="presentation"
	></div>

	<div
		id="main-content"
		class="relative flex h-full w-full flex-col justify-between overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900"
	>
		<main>
			{@render children()}
		</main>
	</div>
</div>

<Drawer bind:open={drawerOpen} id="sidebar">
	<div class="flex items-center">
		<h5
			id="drawer-label"
			class="mb-4 inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
		>
			<GridSolid class="mr-2 h-5 w-5" />Menu
		</h5>
		<CloseButton onclick={() => (drawerOpen = false)} class="mb-4 dark:text-white" />
	</div>
	<Sidebar>
		<SidebarWrapper>
			<SidebarNav onclick={closeDrawer} items={data.menu} />
		</SidebarWrapper>
	</Sidebar>
</Drawer>

<ToastContainer />
