<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Tooltip,
		Button,
		Card,
		Label,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Spinner
	} from 'flowbite-svelte';
	import {
		ClipboardSolid,
		ClipboardCheckSolid,
		UploadOutline,
		TrashBinSolid
	} from 'flowbite-svelte-icons';
	import { ghListFiles, ghUploadImage, ghDeleteFile } from '$lib/dashboard/github';
	import { toast } from '$lib/dashboard/stores/toast';

	let { data } = $props();

	type ImageFile = { name: string; sha: string; path: string };

	const IMAGE_EXTS = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg'];

	let images = $state<ImageFile[]>([]);
	let loading = $state(true);
	let uploading = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let copiedId: string | null = $state(null);

	onMount(async () => {
		await loadImages();
	});

	async function loadImages() {
		loading = true;
		try {
			const files = await ghListFiles(data.token, 'static/images');
			images = files.filter((f) => IMAGE_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext)));
		} catch (err) {
			toast.error('Failed to load images: ' + err);
		} finally {
			loading = false;
		}
	}

	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const buffer = await file.arrayBuffer();
			const uuid = crypto.randomUUID();
			const filename = await ghUploadImage(data.token, uuid, buffer);
			toast.success(`Uploaded: ${filename}`);
			await loadImages();
		} catch (err) {
			toast.error('Upload failed: ' + err);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function handleDelete(image: ImageFile) {
		if (!confirm(`Delete ${image.name}?`)) return;
		try {
			await ghDeleteFile(data.token, image.path, image.sha, `delete image: ${image.name}`);
			images = images.filter((i) => i.name !== image.name);
			toast.success(`Deleted: ${image.name}`);
		} catch (err) {
			toast.error('Delete failed: ' + err);
		}
	}

	function copyToClipboard(text: string, id: string) {
		navigator.clipboard.writeText(text);
		copiedId = id;
		setTimeout(() => {
			copiedId = null;
		}, 2000);
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/admin">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>Images</BreadcrumbItem>
	</Breadcrumb>

	<Heading tag="h1" class="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
		>Image Management</Heading
	>

	<Card class="mb-6 max-w-none p-6">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Upload New Image</h2>
		<div class="flex flex-col gap-4">
			<div>
				<Label for="image" class="mb-2">Select Image</Label>
				<input
					id="image"
					type="file"
					accept="image/*"
					bind:this={fileInput}
					onchange={handleUpload}
					class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
				/>
			</div>
			<Button
				color="blue"
				class="w-full self-end sm:w-auto"
				disabled={uploading}
				onclick={() => fileInput?.click()}
			>
				{#if uploading}
					<Spinner size="4" class="mr-2" />
					Uploading...
				{:else}
					<UploadOutline class="mr-2 h-4 w-4" />
					Upload
				{/if}
			</Button>
		</div>
	</Card>

	{#if loading}
		<div class="flex justify-center py-12">
			<Spinner size="8" />
		</div>
	{:else if images.length === 0}
		<p class="text-center text-gray-500 dark:text-gray-400">No images found.</p>
	{:else}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
			{#each images as image (image.sha)}
				<Card class="flex h-full flex-col p-4">
					<div
						class="mb-2 aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
					>
						<img
							src="/images/{image.name}"
							alt={image.name}
							loading="lazy"
							class="h-full w-full object-cover"
						/>
					</div>
					<p
						class="mb-3 truncate text-xs font-medium text-gray-700 dark:text-gray-300"
						title={image.name}
					>
						{image.name}
					</p>
					<div class="mt-auto grid grid-cols-2 gap-2">
						<div class="relative">
							<Button
								size="xs"
								color="light"
								class="w-full"
								onclick={() => copyToClipboard(`/images/${image.name}`, `url-${image.sha}`)}
							>
								{#if copiedId === `url-${image.sha}`}
									<ClipboardCheckSolid class="me-1 h-3 w-3 text-green-500" /> URL
								{:else}
									<ClipboardSolid class="me-1 h-3 w-3" /> URL
								{/if}
							</Button>
							<Tooltip>Copy URL</Tooltip>
						</div>

						<div class="relative">
							<Button size="xs" color="red" class="w-full" onclick={() => handleDelete(image)}>
								<TrashBinSolid class="me-1 h-3 w-3" /> Delete
							</Button>
							<Tooltip>Delete image</Tooltip>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
