<script lang="ts">
	import { goto } from '$app/navigation';
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
		Spinner
	} from 'flowbite-svelte';
	import { TrashBinOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { getToken } from '$lib/auth';
	import { ghUploadImage, ghPutWork } from '$lib/github';
	import type { WorkFileData } from '$lib/github';
	import CartaEditor from '$lib/components/CartaEditor.svelte';
	import { workTypesOptions } from '$lib/types/work';
	import { toast } from '$lib/stores/toast';

	// Form state
	let id = $state('');
	let title = $state('');
	let type = $state('creation');
	let description = $state('');
	let creationPeriod = $state('');
	let article = $state('');
	let thumbnailFile = $state<File | null>(null);
	let urls = $state<{ title: string; url: string }[]>([]);
	let submitting = $state(false);

	// Validation
	let titleError = $state('');

	function addUrl() {
		urls = [...urls, { title: '', url: '' }];
	}

	function removeUrl(index: number) {
		urls = urls.filter((_, i) => i !== index);
	}

	function handleImportJson(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const json = JSON.parse(ev.target?.result as string);
				if (json.title) title = json.title;
				if (json.description != null) description = json.description ?? '';
				if (json.type) type = json.type;
				if (json.creationPeriod != null) creationPeriod = json.creationPeriod ?? '';
				if (json.article != null) article = json.article ?? '';
				if (Array.isArray(json.urls)) {
					urls = json.urls.map((u: { title: string; url: string }) => ({
						title: u.title ?? '',
						url: u.url ?? ''
					}));
				}
				toast.success('JSONをインポートしました');
			} catch {
				toast.error('JSONのパースに失敗しました');
			}
			input.value = '';
		};
		reader.readAsText(file);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		titleError = '';

		if (!title.trim()) {
			titleError = 'タイトルは必須です';
			return;
		}

		submitting = true;
		try {
			const token = getToken();

			let thumbnailFilename: string | null = null;
			if (thumbnailFile) {
				const buffer = await thumbnailFile.arrayBuffer();
				thumbnailFilename = await ghUploadImage(token, crypto.randomUUID(), buffer);
			}

			const now = new Date().toISOString();
			const workId = id.trim() || crypto.randomUUID();

			const workData: WorkFileData = {
				id: workId,
				title: title.trim(),
				description: description.trim() || null,
				thumbnail: thumbnailFilename,
				type,
				creationPeriod: creationPeriod.trim() || null,
				article: article.trim() || null,
				createdAt: now,
				updatedAt: now,
				urls: urls.map((u) => ({
					id: crypto.randomUUID(),
					title: u.title,
					url: u.url
				}))
			};

			await ghPutWork(token, workData);
			toast.success('作品を作成しました');
			goto('/dashboard/works');
		} catch (e) {
			const msg = e instanceof Error ? e.message : '作品の作成に失敗しました';
			toast.error(msg);
			console.error(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem href="/dashboard/works">Works</BreadcrumbItem>
		<BreadcrumbItem>New Work</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>Add new work</Heading
		>
		<div>
			<input
				type="file"
				accept="application/json"
				class="hidden"
				id="works-import-file"
				onchange={handleImportJson}
			/>
			<Button
				color="light"
				onclick={() => (document.getElementById('works-import-file') as HTMLInputElement).click()}
			>
				Import Work JSON
			</Button>
		</div>
	</div>

	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-1">
				<div>
					<Label for="id" class="mb-2">ID (Optional, auto-generated if empty)</Label>
					<Input type="text" id="id" bind:value={id} placeholder="Custom ID" />
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
					{#each urls as urlItem, index (index)}
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
					<Label for="thumbnail" class="mb-2">Thumbnail</Label>
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
					Creating...
				{:else}
					Create Work
				{/if}
			</Button>
		</div>
	</form>
</div>
