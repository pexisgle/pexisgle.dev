<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Tooltip,
		Button,
		Card,
		Fileupload,
		Label,
		Breadcrumb,
		BreadcrumbItem,
		Heading
	} from 'flowbite-svelte';
	import { ClipboardSolid, ClipboardCheckSolid, UploadOutline } from 'flowbite-svelte-icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let copiedId: string | null = $state(null);

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
		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			use:enhance
			class="flex flex-col gap-4"
		>
			<div>
				<Label for="image" class="mb-2">Select Image</Label>
				<Fileupload id="image" name="image" accept="image/*" required />
			</div>
			<Button type="submit" color="blue" class="w-full self-end sm:w-auto">
				<UploadOutline class="mr-2 h-4 w-4" />
				Upload
			</Button>
		</form>
	</Card>

	<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
		{#each data.images as image (image.id)}
			<Card class="flex h-full flex-col p-4">
				<div
					class="mb-2 aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
				>
					<img
						src="/api/image/{image.id}"
						alt="Uploaded content"
						loading="lazy"
						class="h-full w-full object-cover"
					/>
				</div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs text-gray-500 dark:text-gray-400"
						>{image.createdAt?.toLocaleDateString()}</span
					>
				</div>
				<div class="mt-auto grid grid-cols-2 gap-2">
					<div class="relative">
						<Button
							size="xs"
							color="light"
							class="w-full"
							onclick={() => copyToClipboard(`/api/image/${image.id}`, `url-${image.id}`)}
						>
							{#if copiedId === `url-${image.id}`}
								<ClipboardCheckSolid class="me-1 h-3 w-3 text-green-500" /> URL
							{:else}
								<ClipboardSolid class="me-1 h-3 w-3" /> URL
							{/if}
						</Button>
						<Tooltip>Copy URL</Tooltip>
					</div>

					<div class="relative">
						<Button
							size="xs"
							color="light"
							class="w-full"
							onclick={() => copyToClipboard(image.id, `id-${image.id}`)}
						>
							{#if copiedId === `id-${image.id}`}
								<ClipboardCheckSolid class="me-1 h-3 w-3 text-green-500" /> ID
							{:else}
								<ClipboardSolid class="me-1 h-3 w-3" /> ID
							{/if}
						</Button>
						<Tooltip>Copy ID</Tooltip>
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>
