<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Toggle,
		Label,
		Input,
		Textarea,
		Fileupload,
		Button,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Spinner
	} from 'flowbite-svelte';
	import CartaEditor from '$lib/dashboard/components/CartaEditor.svelte';
	import {
		ghGetBlog,
		ghPutFile,
		ghDeleteFile,
		ghUploadImage,
		serializeBlog
	} from '$lib/dashboard/github';

	let { data } = $props();
	import type { BlogFileData } from '$lib/dashboard/github';
	import { toast } from '$lib/dashboard/stores/toast';

	const originalId = page.params.id ?? '';

	let loading = $state(true);
	let notFound = $state(false);
	let submitting = $state(false);

	let originalSha = $state('');
	let id = $state('');
	let title = $state('');
	let description = $state('');
	let content = $state('');
	let published = $state(false);
	let thumbnailFile = $state<File | null>(null);
	let existingThumbnail = $state<string | null>(null);
	let createdAt = $state('');

	onMount(async () => {
		const result = await ghGetBlog(data.token, originalId);
		if (!result) {
			notFound = true;
			loading = false;
			return;
		}
		originalSha = result.sha;
		id = result.data.id;
		title = result.data.title;
		description = result.data.description ?? '';
		content = result.data.content ?? '';
		published = result.data.published ?? false;
		existingThumbnail = result.data.thumbnail ?? null;
		createdAt = result.data.createdAt;
		loading = false;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) {
			toast.error('Title is required');
			return;
		}
		submitting = true;
		try {
			const now = new Date().toISOString();
			const newId = id.trim() || originalId;
			const idChanged = newId !== originalId;

			let thumbnailFilename: string | undefined = existingThumbnail ?? undefined;
			if (thumbnailFile) {
				const buffer = await thumbnailFile.arrayBuffer();
				thumbnailFilename = await ghUploadImage(data.token, crypto.randomUUID(), buffer);
			}

			const blogData: BlogFileData = {
				id: newId,
				title: title.trim(),
				description: description.trim() || undefined,
				thumbnail: thumbnailFilename,
				published,
				publishedAt: published ? now : undefined,
				createdAt,
				updatedAt: now,
				content
			};

			const newPath = `content/blog/${newId}.md`;
			// When the id changes we create a brand-new file (no sha); when updating
			// in place we pass the existing sha so GitHub can do a conflict check.
			await ghPutFile(
				data.token,
				newPath,
				serializeBlog(blogData),
				`${idChanged ? 'create' : 'update'} blog: ${newId}`,
				idChanged ? undefined : originalSha
			);

			if (idChanged) {
				await ghDeleteFile(
					data.token,
					`content/blog/${originalId}.md`,
					originalSha,
					`delete blog: ${originalId}`
				);
			}

			toast.success('Blog post updated');
			goto('/dashboard/blog');
		} catch (e) {
			console.error(e);
			toast.error(e instanceof Error ? e.message : 'Failed to update blog post');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem href="/dashboard/blog">Blog</BreadcrumbItem>
		<BreadcrumbItem>Edit Post</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>Edit blog post</Heading
		>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<Spinner size="10" />
		</div>
	{:else if notFound}
		<p class="text-red-500">Blog post not found.</p>
		<Button href="/dashboard/blog" class="mt-4">Back to Blog</Button>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-1">
					<div>
						<Label for="id" class="mb-2">ID</Label>
						<Input type="text" id="id" bind:value={id} required />
					</div>

					<div>
						<Label for="title" class="mb-2">Title</Label>
						<Input type="text" id="title" bind:value={title} required />
					</div>

					<div>
						<Toggle bind:checked={published} class="cursor-pointer">Published</Toggle>
					</div>

					<div>
						<Label for="description" class="mb-2">Description (Short)</Label>
						<Textarea id="description" bind:value={description} rows={3} class="w-full" />
					</div>

					<div>
						<Label for="thumbnail" class="mb-2">Thumbnail</Label>
						{#if existingThumbnail}
							<div class="mb-2">
								<img
									src={existingThumbnail}
									alt="Current Thumbnail"
									class="h-auto max-h-37.5 max-w-full rounded border border-gray-200 dark:border-gray-600"
								/>
							</div>
						{/if}
						<Fileupload
							id="thumbnail"
							accept="image/*"
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								thumbnailFile = target.files?.[0] ?? null;
							}}
						/>
					</div>
				</div>

				<div class="flex h-full flex-col space-y-6 lg:col-span-2">
					<div class="flex flex-1 flex-col">
						<Label for="content" class="mb-2">Content (Markdown)</Label>
						<CartaEditor bind:value={content} placeholder="# Write your post here..." mode="tabs" />
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
				<Button color="alternative" href="/dashboard/blog">Cancel</Button>
				<Button type="submit" color="blue" disabled={submitting}>
					{#if submitting}
						<Spinner class="mr-2" size="4" />
						Updating...
					{:else}
						Update Post
					{/if}
				</Button>
			</div>
		</form>
	{/if}
</div>
