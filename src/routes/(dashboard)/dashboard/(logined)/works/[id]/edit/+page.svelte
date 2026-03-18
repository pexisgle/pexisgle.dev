<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Label,
		Input,
		Textarea,
		Select,
		Fileupload,
		Button,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Helper,
		Spinner,
		Alert
	} from 'flowbite-svelte';
	import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { ghGetWork, ghPutWork, ghUploadImage, ghDeleteFile } from '$lib/github';

	let { data } = $props();
	import type { WorkFileData } from '$lib/github';
	import CartaEditor from '$lib/components/dashboard/CartaEditor.svelte';
	import { workTypesOptions } from '$lib/types/work';
	import { toast } from '$lib/stores/toast';

	const workId = $derived(page.params.id ?? '');

	// Loading state
	let loading = $state(true);
	let notFound = $state(false);
	let submitting = $state(false);

	// Persisted from loaded data
	let sha = $state<string | null>(null);
	let originalCreatedAt = $state('');

	// Form state
	let formId = $state('');
	let title = $state('');
	let type = $state('creation');
	let description = $state('');
	let creationPeriod = $state('');
	let article = $state('');
	let currentThumbnail = $state<string | null>(null);
	let thumbnailFile = $state<File | null>(null);
	let urls = $state<{ id: string; title: string; url: string }[]>([]);

	// Validation
	let titleError = $state('');

	async function loadWork() {
		loading = true;
		notFound = false;
		try {
			const result = await ghGetWork(data.token, workId);
			if (!result) {
				notFound = true;
				return;
			}
			const { data: workData, sha: fileSha } = result;
			sha = fileSha;
			originalCreatedAt = workData.createdAt;
			formId = workData.id;
			title = workData.title;
			type = workData.type;
			description = workData.description ?? '';
			creationPeriod = workData.creationPeriod ?? '';
			article = workData.article ?? '';
			currentThumbnail = workData.thumbnail ?? null;
			urls = workData.urls.map((u) => ({ id: u.id, title: u.title, url: u.url }));
		} catch (e) {
			toast.error('作品の読み込みに失敗しました');
			console.error(e);
			notFound = true;
		} finally {
			loading = false;
		}
	}

	function addUrl() {
		urls = [...urls, { id: crypto.randomUUID(), title: '', url: '' }];
	}

	function removeUrl(index: number) {
		urls = urls.filter((_, i) => i !== index);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		titleError = '';

		if (!title.trim()) {
			titleError = 'タイトルは必須です';
			return;
		}
		if (!sha) return;

		submitting = true;
		try {
			let newThumbnail = currentThumbnail;
			if (thumbnailFile) {
				const buffer = await thumbnailFile.arrayBuffer();
				newThumbnail = await ghUploadImage(data.token, crypto.randomUUID(), buffer);
			}

			const newId = formId.trim() || workId;

			const updatedWork: WorkFileData = {
				id: newId,
				title: title.trim(),
				description: description.trim(),
				thumbnail: newThumbnail || undefined,
				type,
				creationPeriod: creationPeriod.trim() || undefined,
				article: article.trim() || undefined,
				createdAt: originalCreatedAt,
				updatedAt: new Date().toISOString(),
				urls: urls.map((u) => ({ id: u.id, title: u.title, url: u.url }))
			};

			if (newId !== workId) {
				// ID changed: create file at new path, then delete old path
				await ghPutWork(data.token, updatedWork);
				await ghDeleteFile(
					data.token,
					`content/works/${workId}.md`,
					sha,
					`rename work: ${workId} -> ${newId}`
				);
			} else {
				await ghPutWork(data.token, updatedWork, sha);
			}

			toast.success('作品を更新しました');
			goto('/dashboard/works');
		} catch (e) {
			const msg = e instanceof Error ? e.message : '作品の更新に失敗しました';
			toast.error(msg);
			console.error(e);
		} finally {
			submitting = false;
		}
	}

	onMount(() => {
		loadWork();
	});
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem href="/dashboard/works">Works</BreadcrumbItem>
		<BreadcrumbItem>Edit Work</BreadcrumbItem>
	</Breadcrumb>

	<Heading tag="h1" class="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
		Edit work: {title || workId}
	</Heading>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner size="8" />
		</div>
	{:else if notFound}
		<Alert color="red">
			<span class="font-semibold">Not found:</span>
			Work "{workId}" could not be loaded.
			<Button color="red" size="xs" onclick={() => goto('/dashboard/works')} class="ml-4">
				Back to Works
			</Button>
		</Alert>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-1">
					<div>
						<Label for="id" class="mb-2">ID</Label>
						<Input type="text" id="id" bind:value={formId} required />
					</div>

					<div>
						<Label for="title" class="mb-2">Title</Label>
						<Input
							type="text"
							id="title"
							bind:value={title}
							required
							color={titleError ? 'red' : undefined}
						/>
						{#if titleError}
							<Helper class="mt-2" color="red">{titleError}</Helper>
						{/if}
					</div>

					<div>
						<Label for="type" class="mb-2">Type</Label>
						<Select
							id="type"
							items={workTypesOptions}
							bind:value={type}
							placeholder="Select Type"
							required
						/>
					</div>

					<div>
						<Label for="creationPeriod" class="mb-2">Creation Period</Label>
						<Input
							type="text"
							id="creationPeriod"
							bind:value={creationPeriod}
							placeholder="e.g. 2023 Summer"
						/>
					</div>

					<div>
						<Label for="description" class="mb-2">Description (Short)</Label>
						<Textarea id="description" bind:value={description} rows={3} class="w-full" />
					</div>

					<div>
						<Label class="mb-2">URLs</Label>
						{#each urls as urlItem, index (urlItem.id)}
							<div class="mb-2 flex gap-2">
								<Input type="text" placeholder="Title" bind:value={urlItem.title} />
								<Input type="text" placeholder="URL" bind:value={urlItem.url} />
								<Button color="red" size="xs" onclick={() => removeUrl(index)} class="p-2!">
									<TrashBinOutline class="h-4 w-4" />
								</Button>
							</div>
						{/each}
						<Button color="light" size="sm" onclick={addUrl} class="mt-2">
							<PlusOutline class="mr-2 h-3.5 w-3.5" />
							Add URL
						</Button>
					</div>

					<div>
						<Label for="thumbnail" class="mb-2">Thumbnail (Leave empty to keep existing)</Label>
						{#if currentThumbnail}
							<div class="mt-2 mb-2">
								<img
									src={currentThumbnail}
									alt="Current thumbnail"
									class="h-auto max-h-37.5 max-w-full rounded border border-gray-200 dark:border-gray-600"
								/>
							</div>
						{/if}
						<Fileupload
							id="thumbnail"
							accept="image/*"
							onchange={(e) => {
								const input = e.target as HTMLInputElement;
								thumbnailFile = input.files?.[0] ?? null;
							}}
						/>
					</div>
				</div>

				<div class="flex h-full flex-col space-y-6 lg:col-span-2">
					<div class="flex flex-1 flex-col">
						<Label for="article" class="mb-2">Article (Markdown)</Label>
						<CartaEditor
							bind:value={article}
							placeholder="# Write your article here..."
							mode="tabs"
						/>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
				<Button color="alternative" href="/dashboard/works">Cancel</Button>
				<Button type="submit" color="blue" disabled={submitting}>
					{#if submitting}
						<Spinner size="4" class="mr-2" />
						Updating...
					{:else}
						Update Work
					{/if}
				</Button>
			</div>
		</form>
	{/if}
</div>
