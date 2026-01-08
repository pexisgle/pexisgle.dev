<script lang="ts">
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
	import { TrashBinOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import CartaEditor from '$lib/components/CartaEditor.svelte';
	import { workTypesOptions } from '$lib/types/work';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, constraints, enhance } = superForm(data.form, {
		onError({ result }) {
			// Handle server errors
			console.error('Form submission error:', result);
		}
	});

	// Dynamic URL inputs state
	let urls = $state([] as { title: string; url: string }[]);

	let urlsJson = $derived(JSON.stringify(urls));

	function handleImportEnhance(node: HTMLFormElement) {
		return enhance(node, {
			onResult: ({ result }) => {
				if (result.type !== 'success') return;

				const nextId = (result.data as { id?: string } | undefined)?.id;
				if (nextId) {
					location.href = `/dashboard/works/${nextId}`;
				}
			}
		});
	}

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
		<BreadcrumbItem>New Work</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>Add new work</Heading
		>
		<form method="POST" action="?/import" enctype="multipart/form-data" use:handleImportEnhance>
			<input
				type="file"
				name="file"
				accept="application/json"
				class="hidden"
				id="works-import-file"
			/>
			<label for="works-import-file">
				<Button
					color="light"
					onclick={() => (document.getElementById('works-import-file') as HTMLInputElement).click()}
					>Import Work JSON</Button
				>
			</label>
		</form>
	</div>

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-6">
		<input type="hidden" name="urls" value={urlsJson} />
		<input type="hidden" name="article" value={$form.article} />

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
						aria-invalid={$errors.creationPeriod ? 'true' : undefined}
						{...$constraints.creationPeriod}
					/>
					{#if $errors.creationPeriod}
						<Helper class="mt-2" color="red">{$errors.creationPeriod}</Helper>
					{/if}
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
					<Label for="thumbnail" class="mb-2">Thumbnail</Label>
					<Fileupload id="thumbnail" name="thumbnail" accept="image/*" />
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
					{#if $errors.article}
						<Helper class="mt-2" color="red">{$errors.article}</Helper>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-4 border-t pt-4 dark:border-gray-700">
			<Button color="alternative" href="/dashboard/works">Cancel</Button>
			<Button type="submit" color="blue">Create Work</Button>
		</div>
	</form>
</div>
