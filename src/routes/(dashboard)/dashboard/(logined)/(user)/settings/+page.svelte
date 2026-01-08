<script lang="ts">
	import {
		Breadcrumb,
		BreadcrumbItem,
		Card,
		Button,
		Label,
		Input,
		Avatar,
		Badge,
		Heading,
		Helper,
		Hr
	} from 'flowbite-svelte';
	import { UserSolid, GithubSolid } from 'flowbite-svelte-icons';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, delayed } = superForm(data.form, {
		onError({ result }) {
			// Handle server errors
			console.error('Form submission error:', result);
		}
	});

	// Role color mapping
	const roleColors: Record<string, 'primary' | 'gray' | 'red' | 'green' | 'yellow' | 'purple'> = {
		owner: 'purple',
		admin: 'primary',
		user: 'green',
		none: 'gray'
	};

	let roleColor = $derived(roleColors[data.user.role] ?? 'gray');
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/admin">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>Settings</BreadcrumbItem>
	</Breadcrumb>

	<Heading tag="h1" class="mb-6 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
		>User Settings</Heading
	>

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Profile Card -->
		<Card class="p-6 lg:col-span-1">
			<div class="flex flex-col items-center pb-4">
				<Avatar
					src={data.user.avatarUrl ??
						`https://avatars.githubusercontent.com/u/${data.user.githubId}`}
					size="xl"
					class="mb-3 shadow-md"
					border
				/>
				<Heading tag="h5" class="mb-1 text-xl font-medium text-gray-900 dark:text-white">
					{data.user.displayName || data.user.username}
				</Heading>
				<span class="text-sm text-gray-500 dark:text-gray-400">@{data.user.username}</span>
				<div class="mt-3">
					<Badge color={roleColor} large>{data.user.role.toUpperCase()}</Badge>
				</div>
				<div class="mt-4 flex space-x-3">
					<Button
						href="https://github.com/{data.user.username}"
						target="_blank"
						rel="noopener noreferrer"
						color="light"
						size="xs"
					>
						<GithubSolid class="me-2 h-4 w-4" />
						View on GitHub
					</Button>
				</div>
			</div>
		</Card>

		<!-- Settings Form -->
		<Card class="p-6 lg:col-span-2">
			<Heading tag="h5" class="mb-4 text-xl font-bold text-gray-900 dark:text-white"
				>Profile Settings</Heading
			>
			<Hr class="mb-6" />

			<form method="POST" use:enhance class="space-y-6">
				<div>
					<Label for="displayUserName" class="mb-2">表示名</Label>
					<div class="relative">
						<div
							class="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-500 dark:text-gray-400"
						>
							<UserSolid class="h-5 w-5" />
						</div>
						<Input
							id="displayUserName"
							name="displayUserName"
							placeholder="表示名を入力"
							class="ps-10"
							aria-invalid={$errors.displayName ? 'true' : undefined}
							bind:value={$form.displayName}
						/>
					</div>
					{#if $errors.displayName}
						<Helper class="mt-2" color="red">
							<span class="font-medium">エラー!</span>
							{$errors.displayName}
						</Helper>
					{:else}
						<Helper class="mt-2">
							表示名を設定しない場合は、GitHubのユーザー名が使用されます。
						</Helper>
					{/if}
				</div>

				<div class="flex items-center gap-3 pt-4">
					<Button type="submit" color="blue" disabled={$delayed}>
						{#if $delayed}
							保存中...
						{:else}
							変更を保存
						{/if}
					</Button>
					<Button color="light" href="/admin">キャンセル</Button>
				</div>
			</form>
		</Card>
	</div>
</div>
