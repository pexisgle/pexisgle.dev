<script lang="ts">
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
	import type { PageProps } from './$types';
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
		<BreadcrumbItem>New Post</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>Add new blog post</Heading
		>
		<form method="POST" action="?/import" enctype="multipart/form-data">
			<input
				type="file"
				name="file"
				accept="application/json"
				class="hidden"
				id="blog-import-file"
			/>
			<label for="blog-import-file">
				<Button
					color="light"
					onclick={() => (document.getElementById('blog-import-file') as HTMLInputElement).click()}
					>Import Post JSON</Button
				>
			</label>
		</form>
	</div>

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-6">
		<input type="hidden" name="content" value={$form.content} />
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-1">
				<div>
					<Label for="id" class="mb-2">ID (Optional, auto-generated if empty)</Label>
					<Input
						type="text"
						id="id"
						name="id"
						bind:value={$form.id}
						placeholder="Custom ID"
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
					<Toggle bind:checked={$form.published} class="cursor-pointer">Publish immediately</Toggle>
				</div>

				<div>
					<Label for="description" class="mb-2">Description (Short)</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={$form.description}
						rows={3}
						aria-invalid={$errors.description ? 'true' : undefined}
						{...$constraints.description}
					/>
					{#if $errors.description}
						<Helper class="mt-2" color="red">{$errors.description}</Helper>
					{/if}
				</div>

				<div>
					<Label for="thumbnail" class="mb-2">Thumbnail</Label>
					<Fileupload id="thumbnail" name="thumbnail" accept="image/*" />
				</div>
			</div>

			<div class="flex h-full flex-col space-y-6 lg:col-span-2">
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

		<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
			<Button color="alternative" href="/dashboard/blog">Cancel</Button>
			<Button type="submit" color="blue">Create Post</Button>
		</div>
	</form>
</div>
