<script lang="ts">
	import { goto } from '$app/navigation';
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
	import CartaEditor from '$lib/components/dashboard/CartaEditor.svelte';
	import { ghPutFile, ghUploadImage, serializeBlog } from '$lib/github';

	let { data } = $props();
	import type { BlogFileData } from '$lib/github';
	import { toast } from '$lib/stores/toast';

	let id = $state('');
	let title = $state('');
	let description = $state('');
	let content = $state('');
	let published = $state(false);
	let thumbnailFile = $state<File | null>(null);
	let submitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) {
			toast.error('Title is required');
			return;
		}
		submitting = true;
		try {
			const now = new Date().toISOString();
			const blogId = id.trim() || crypto.randomUUID();

			let thumbnailFilename: string | undefined;
			if (thumbnailFile) {
				const buffer = await thumbnailFile.arrayBuffer();
				thumbnailFilename = await ghUploadImage(data.token, crypto.randomUUID(), buffer);
			}

			const blogData: BlogFileData = {
				id: blogId,
				title: title.trim(),
				description: description.trim() || undefined,
				thumbnail: thumbnailFilename,
				published,
				publishedAt: published ? now : undefined,
				createdAt: now,
				updatedAt: now,
				content
			};

			const path = `content/blog/${blogId}.md`;
			await ghPutFile(data.token, path, serializeBlog(blogData), `create blog: ${blogId}`);
			toast.success('Blog post created');
			goto('/dashboard/blog');
		} catch (e) {
			console.error(e);
			toast.error(e instanceof Error ? e.message : 'Failed to create blog post');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem href="/dashboard/blog">Blog</BreadcrumbItem>
		<BreadcrumbItem>New Post</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>Add new blog post</Heading
		>
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
					<Input type="text" id="title" bind:value={title} required />
				</div>

				<div>
					<Toggle bind:checked={published} class="cursor-pointer">Publish immediately</Toggle>
				</div>

				<div>
					<Label for="description" class="mb-2">Description (Short)</Label>
					<Textarea id="description" bind:value={description} rows={3} />
				</div>

				<div>
					<Label for="thumbnail" class="mb-2">Thumbnail</Label>
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
				<Label for="content" class="mb-2">Content (Markdown)</Label>
				<CartaEditor bind:value={content} placeholder="# Write your post here..." mode="tabs" />
			</div>
		</div>

		<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
			<Button color="alternative" href="/dashboard/blog">Cancel</Button>
			<Button type="submit" color="blue" disabled={submitting}>
				{#if submitting}
					<Spinner class="mr-2" size="4" />
					Creating...
				{:else}
					Create Post
				{/if}
			</Button>
		</div>
	</form>
</div>
