<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Select,
		Button,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Avatar,
		Badge
	} from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Helper to get initials
	const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

	const roles = [
		{ value: 'none', name: 'None' },
		{ value: 'user', name: 'User' },
		{ value: 'admin', name: 'Admin' },
		{ value: 'owner', name: 'Owner' }
	];
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/admin">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>Users</BreadcrumbItem>
	</Breadcrumb>

	<Heading tag="h1" class="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
		>User Management</Heading
	>

	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell>User</TableHeadCell>
			<TableHeadCell>Role</TableHeadCell>
			<TableHeadCell>Actions</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.users as user (user.id)}
				{@const isDisabled =
					user.id === data.user?.id ||
					(data.user?.role !== 'owner' && (user.role === 'admin' || user.role === 'owner'))}
				<TableBodyRow>
					<TableBodyCell class="flex items-center gap-4">
						<Avatar class="h-10 w-10 border-gray-300 dark:border-gray-500">
							{getInitials(user.username)}
						</Avatar>
						<div>
							<div class="font-semibold text-gray-900 dark:text-white">{user.username}</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</div>
						</div>
					</TableBodyCell>
					<TableBodyCell>
						<Badge
							color={user.role === 'owner' ? 'purple' : user.role === 'admin' ? 'blue' : 'gray'}
						>
							{user.role}
						</Badge>
					</TableBodyCell>
					<TableBodyCell>
						<form
							method="POST"
							action="?/updateRole"
							use:enhance={() => {
								return async ({ update }) => {
									await update();
								};
							}}
							class="flex items-center gap-2"
						>
							<input type="hidden" name="userId" value={user.id} />

							<div class="w-32">
								<Select
									items={roles}
									name="role"
									value={user.role}
									disabled={isDisabled}
									size="sm"
								/>
							</div>

							<Button type="submit" size="xs" color="blue" disabled={isDisabled}>Update</Button>
						</form>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>
