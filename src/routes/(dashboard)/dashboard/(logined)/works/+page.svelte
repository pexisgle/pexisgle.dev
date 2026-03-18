<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Button,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Spinner,
		Alert
	} from 'flowbite-svelte';
	import { PlusOutline, EditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { ghListFiles, ghGetWork, ghDeleteFile } from '$lib/github';
	import type { WorkFileData } from '$lib/github';
	import { toast } from '$lib/stores/toast';

	let { data } = $props();

	type LoadedWork = { data: WorkFileData; sha: string };

	let works = $state<LoadedWork[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	async function loadWorks() {
		loading = true;
		loadError = null;
		try {
			const token = data.token;
			const files = await ghListFiles(token, 'content/works');
			const mdFiles = files.filter((f) => f.name.endsWith('.md'));
			const results = await Promise.all(
				mdFiles.map(async (file) => {
					const id = file.name.replace(/\.md$/, '');
					return ghGetWork(token, id);
				})
			);
			works = results
				.filter((r): r is LoadedWork => r !== null)
				.sort(
					(a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
				);
		} catch (e) {
			const msg = e instanceof Error ? e.message : '作品の読み込みに失敗しました';
			loadError = msg;
			toast.error(msg);
		} finally {
			loading = false;
		}
	}

	async function handleDelete(work: LoadedWork) {
		if (!confirm(`"${work.data.title}" を削除しますか？`)) return;
		deletingId = work.data.id;
		try {
			const token = data.token;
			await ghDeleteFile(
				token,
				`content/works/${work.data.id}.md`,
				work.sha,
				`delete work: ${work.data.id}`
			);
			toast.success('作品を削除しました');
			await loadWorks();
		} catch (e) {
			toast.error('削除に失敗しました');
			console.error(e);
		} finally {
			deletingId = null;
		}
	}

	onMount(() => {
		loadWorks();
	});
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>Works</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>All Works</Heading
		>
		<div class="flex flex-wrap gap-2">
			<Button href="/dashboard/works/new" color="blue" size="sm" class="gap-2">
				<PlusOutline class="h-3.5 w-3.5" />
				Add new work
			</Button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner size="8" />
		</div>
	{:else if loadError}
		<Alert color="red" class="mb-4">
			<span class="font-semibold">Error:</span>
			{loadError}
			<Button color="red" size="xs" onclick={loadWorks} class="ml-4">Retry</Button>
		</Alert>
	{:else}
		<Table hoverable={true}>
			<TableHead>
				<TableHeadCell>Thumbnail</TableHeadCell>
				<TableHeadCell>Title</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each works as work (work.data.id)}
					<TableBodyRow>
						<TableBodyCell class="w-20 p-2">
							{#if work.data.thumbnail}
								<img
									src={work.data.thumbnail}
									alt={work.data.title}
									class="h-12 w-16 rounded object-cover"
								/>
							{:else}
								<div class="h-12 w-16 rounded bg-gray-100 dark:bg-gray-700"></div>
							{/if}
						</TableBodyCell>
						<TableBodyCell class="font-medium text-gray-900 dark:text-white">
							{work.data.title}
						</TableBodyCell>
						<TableBodyCell>
							<span
								class="rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300"
							>
								{work.data.type}
							</span>
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-2">
								<Button href="/dashboard/works/{work.data.id}/edit" size="xs" color="light">
									<EditOutline class="mr-2 h-4 w-4" />
									Edit
								</Button>
								<Button
									size="xs"
									color="red"
									class="p-2!"
									disabled={deletingId === work.data.id}
									onclick={() => handleDelete(work)}
								>
									{#if deletingId === work.data.id}
										<Spinner size="4" />
									{:else}
										<TrashBinOutline class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
				{#if works.length === 0}
					<TableBodyRow>
						<TableBodyCell colspan={4} class="text-center text-gray-500 dark:text-gray-400">
							No works found.
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			</TableBody>
		</Table>
	{/if}
</div>
