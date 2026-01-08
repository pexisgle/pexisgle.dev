<script lang="ts">
	import type { PageProps } from './$types';
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
		Helper
	} from 'flowbite-svelte';
	import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { superForm } from 'sveltekit-superforms';
	import CartaEditor from '$lib/components/CartaEditor.svelte';
	import { workTypesOptions } from '$lib/types/work';

	let { data }: PageProps = $props();
	const work = $derived(data.work);

	// svelte-ignore state_referenced_locally
	const { form, errors, constraints, enhance } = superForm(data.form, {
		onError({ result }) {
			// Handle server errors
			console.error('Form submission error:', result);
		}
	});

	// svelte-ignore state_referenced_locally
	let urls = $state(work.urls.map((u) => ({ title: u.title, url: u.url })));

	let urlsJson = $derived(JSON.stringify(urls));

	function addUrl() {
		urls = [...urls, { title: '', url: '' }];
	}

	function removeUrl(index: number) {
		urls = urls.filter((_, i) => i !== index);
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem href="/dashboard/works">Works</BreadcrumbItem>
		<BreadcrumbItem>Edit Work</BreadcrumbItem>
	</Breadcrumb>

	<Heading tag="h1" class="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
		>Edit work: {work.title}</Heading
	>

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-6">
		<input type="hidden" name="urls" value={urlsJson} />
		<input type="hidden" name="article" value={$form.article} />

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
					<Label for="type" class="mb-2">Type</Label>
					<Select
						id="type"
						items={workTypesOptions}
						bind:value={$form.type}
						name="type"
						placeholder="Select Type"
						required
					/>
					{#if $errors.type}
						<Helper class="mt-2" color="red">{$errors.type}</Helper>
					{/if}
				</div>

				<div>
					<Label for="creationPeriod" class="mb-2">Creation Period</Label>
					<Input
						type="text"
						id="creationPeriod"
						name="creationPeriod"
						bind:value={$form.creationPeriod}
						placeholder="e.g. 2023 Summer"
						{...$constraints.creationPeriod}
					/>
				</div>

				<div>
					<Label for="description" class="mb-2">Description (Short)</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={$form.description}
						rows={3}
						class="w-full"
						{...$constraints.description}
					/>
				</div>

				<div>
					<Label class="mb-2">URLs</Label>
					{#each urls as urlItem, index (index)}
						<div class="mb-2 flex gap-2">
							<Input type="text" placeholder="Title" bind:value={urlItem.title} required />
							<Input type="text" placeholder="URL" bind:value={urlItem.url} required />
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
					<Fileupload id="thumbnail" name="thumbnail" accept="image/*" />
					{#if work.thumbnail}
						<div class="mt-2">
							<img
								src="/api/image/{work.thumbnail}"
								alt="Current thumbnail"
								class="h-auto max-h-37.5 max-w-full rounded border border-gray-200 dark:border-gray-600"
							/>
						</div>
					{/if}
				</div>
			</div>

			<div class="flex h-full flex-col space-y-6 lg:col-span-2">
				<div class="flex flex-1 flex-col">
					<Label for="article" class="mb-2">Article (Markdown)</Label>
					<CartaEditor
						bind:value={$form.article}
						placeholder="# Write your article here..."
						mode="tabs"
					/>
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
			<Button color="alternative" href="/dashboard/works">Cancel</Button>
			<Button type="submit" color="blue">Update Work</Button>
		</div>
	</form>
</div>
