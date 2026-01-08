<script lang="ts">
	import type { PageProps } from './$types';
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
		Helper
	} from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import CartaEditor from '$lib/components/CartaEditor.svelte';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, constraints, enhance } = superForm(data.form, {
		onError({ result }) {
			// Handle server errors
			console.error('Form submission error:', result);
		}
	});
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
		<form method="GET" action="/dashboard/blog/{data.blog.id}/export">
			<Button color="gray" type="submit">Export JSON</Button>
		</form>
	</div>

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-6">
		<input type="hidden" name="content" value={$form.content} />
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-1">
				<div>
					<Label for="id" class="mb-2">ID</Label>
					<Input
						type="text"
						id="id"
						name="id"
						bind:value={$form.id}
						required
						aria-invalid={$errors.id ? 'true' : undefined}
						{...$constraints.id}
					/>
					{#if $errors.id}
						<Helper class="mt-2" color="red">{$errors.id}</Helper>
					{/if}
				</div>

				<div>
					<Label for="title" class="mb-2">Title</Label>
					<Input
						type="text"
						id="title"
						name="title"
						bind:value={$form.title}
						required
						aria-invalid={$errors.title ? 'true' : undefined}
						{...$constraints.title}
						color={$errors.title ? 'red' : 'gray'}
					/>
					{#if $errors.title}
						<Helper class="mt-2" color="red">{$errors.title}</Helper>
					{/if}
				</div>

				<div>
					<input type="hidden" name="published" value={$form.published ? 'true' : 'false'} />
					<Toggle bind:checked={$form.published} class="cursor-pointer">Published</Toggle>
				</div>

				<div>
					<Label for="description" class="mb-2">Description (Short)</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={$form.description}
						rows={3}
						class="w-full"
						aria-invalid={$errors.description ? 'true' : undefined}
						{...$constraints.description}
					/>
					{#if $errors.description}
						<Helper class="mt-2" color="red">{$errors.description}</Helper>
					{/if}
				</div>

				<div>
					<Label for="thumbnail" class="mb-2">Thumbnail</Label>
					{#if data.blog.thumbnail}
						<div class="mb-2">
							<img
								src="/api/image/{data.blog.thumbnail}"
								alt="Current Thumbnail"
								class="h-auto max-h-37.5 max-w-full rounded border border-gray-200 dark:border-gray-600"
							/>
						</div>
					{/if}
					<Fileupload id="thumbnail" name="thumbnail" accept="image/*" />
				</div>
			</div>

			<div class="flex h-full flex-col space-y-6 lg:col-span-2">
				<div class="flex flex-1 flex-col">
					<Label for="content" class="mb-2">Content (Markdown)</Label>
					<CartaEditor
						bind:value={$form.content}
						placeholder="# Write your post here..."
						mode="tabs"
					/>
					{#if $errors.content}
						<Helper class="mt-2" color="red">{$errors.content}</Helper>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
			<Button color="alternative" href="/dashboard/blog">Cancel</Button>
			<Button type="submit" color="blue">Update Post</Button>
		</div>
	</form>
</div>
