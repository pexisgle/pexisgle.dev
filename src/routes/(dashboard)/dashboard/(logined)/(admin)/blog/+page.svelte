<script lang="ts">
	import type { PageProps } from './$types';

	import { enhance } from '$app/forms';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Button,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Badge,
		Modal,
		Label,
		Fileupload,
		Helper
	} from 'flowbite-svelte';
	import {
		PlusOutline,
		EditOutline,
		TrashBinOutline,
		DownloadOutline,
		UploadOutline
	} from 'flowbite-svelte-icons';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from '$lib/stores/toast';

	let { data }: PageProps = $props();

	let importModalOpen = $state(false);
	let importItemModalOpen = $state(false);
	let importFile: File | null = $state(null);

	// svelte-ignore state_referenced_locally
	const { enhance: importEnhance } = superForm(data.importForm, {
		id: 'import-form',
		dataType: 'form',
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				toast.error('インポートに失敗しました。ファイル形式を確認してください。');
			} else if (result.type === 'error') {
				toast.error(result.error.message);
			} else if (result.type === 'success') {
				toast.success('インポートが完了しました');
				importModalOpen = false;
				importItemModalOpen = false;
				window.location.reload();
			}
		},
		onError: ({ result }) => {
			toast.error(result.error.message || 'インポート中にエラーが発生しました');
		}
	});

	function exportBlogs() {
		const cleanData = $state.snapshot(data.blogs).map((b) => ({
			title: b.title,
			description: b.description,
			content: b.content,
			published: b.published,
			publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString() : null
		}));
		const dataStr = JSON.stringify(cleanData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `blogs-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function exportBlogItem(blog: (typeof data.blogs)[number]) {
		const cleanData = {
			title: blog.title,
			description: blog.description,
			content: blog.content,
			published: blog.published,
			publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null
		};
		const dataStr = JSON.stringify(cleanData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		// Sanitize filename
		const filename = blog.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		link.download = `blog-${filename}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// Simple helper to reset file input state when modal opens/closes if needed
	$effect(() => {
		if (!importModalOpen && !importItemModalOpen) {
			importFile = null;
		}
	});
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>Blog</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>All Blogs</Heading
		>
		<div class="flex flex-wrap gap-2">
			<Button color="alternative" size="sm" onclick={exportBlogs} class="gap-2">
				<DownloadOutline class="h-4 w-4" />
				Export All
			</Button>
			<Button color="alternative" size="sm" onclick={() => (importModalOpen = true)} class="gap-2">
				<UploadOutline class="h-4 w-4" />
				Import All
			</Button>
			<Button
				color="alternative"
				size="sm"
				onclick={() => (importItemModalOpen = true)}
				class="gap-2"
			>
				<UploadOutline class="h-4 w-4" />
				Import Item
			</Button>
			<Button href="/dashboard/blog/new" color="blue" size="sm" class="gap-2">
				<PlusOutline class="h-3.5 w-3.5" />
				Add new blog
			</Button>
		</div>
	</div>

	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell>Thumbnail</TableHeadCell>
			<TableHeadCell>Title</TableHeadCell>
			<TableHeadCell>Status</TableHeadCell>
			<TableHeadCell>Created At</TableHeadCell>
			<TableHeadCell>Actions</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.blogs as blog (blog.id)}
				<TableBodyRow>
					<TableBodyCell class="w-20 p-2">
						{#if blog.thumbnail}
							<img
								src={`/api/image/${blog.thumbnail}`}
								alt={blog.title}
								class="h-12 w-16 rounded object-cover"
							/>
						{:else}
							<div class="h-12 w-16 rounded bg-gray-100 dark:bg-gray-700"></div>
						{/if}
					</TableBodyCell>
					<TableBodyCell class="font-medium text-gray-900 dark:text-white">
						{blog.title}
					</TableBodyCell>
					<TableBodyCell>
						{#if blog.published}
							<Badge color="green">Published</Badge>
						{:else}
							<Badge color="yellow">Draft</Badge>
						{/if}
					</TableBodyCell>
					<TableBodyCell>
						{new Date(blog.createdAt).toLocaleDateString()}
					</TableBodyCell>
					<TableBodyCell>
						<div class="flex gap-2">
							<Button size="xs" color="alternative" onclick={() => exportBlogItem(blog)}>
								<DownloadOutline class="h-4 w-4" />
							</Button>
							<Button href="/dashboard/blog/{blog.id}/edit" size="xs" color="light">
								<EditOutline class="mr-2 h-4 w-4" />
								Edit
							</Button>
							<form action="?/delete" method="POST" use:enhance class="inline-block">
								<input type="hidden" name="id" value={blog.id} />
								<Button type="submit" size="xs" color="red" class="p-2!">
									<TrashBinOutline class="h-4 w-4" />
								</Button>
							</form>
						</div>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>

<!-- Import All Modal -->
<Modal bind:open={importModalOpen} size="sm" title="Import All Blogs" autoclose={false}>
	<form
		method="POST"
		action="?/import"
		enctype="multipart/form-data"
		use:importEnhance
		class="space-y-4"
	>
		<div>
			<Label for="import-file-all">JSON File</Label>
			<Fileupload
				id="import-file-all"
				name="file"
				accept=".json"
				onchange={(e) => {
					const target = e.target as HTMLInputElement;
					importFile = target.files?.[0] || null;
				}}
				required
			/>
			<Helper class="mt-2"
				>Select a JSON file containing blogs to replace existing data. <span class="text-red-500"
					>Warning: This will replace ALL existing blogs.</span
				></Helper
			>
		</div>
		<div class="flex justify-end gap-2">
			<Button color="alternative" onclick={() => (importModalOpen = false)}>Cancel</Button>
			<Button type="submit" color="red" disabled={!importFile}>Import & Replace</Button>
		</div>
	</form>
</Modal>

<!-- Import Item Modal -->
<Modal bind:open={importItemModalOpen} size="sm" title="Import Blog Item" autoclose={false}>
	<form
		method="POST"
		action="?/importItem"
		enctype="multipart/form-data"
		use:importEnhance
		class="space-y-4"
	>
		<div>
			<Label for="import-file-item">JSON File</Label>
			<Fileupload
				id="import-file-item"
				name="file"
				accept=".json"
				onchange={(e) => {
					const target = e.target as HTMLInputElement;
					importFile = target.files?.[0] || null;
				}}
				required
			/>
			<Helper class="mt-2">Select a JSON file containing a single blog item to add.</Helper>
		</div>
		<div class="flex justify-end gap-2">
			<Button color="alternative" onclick={() => (importItemModalOpen = false)}>Cancel</Button>
			<Button type="submit" color="blue" disabled={!importFile}>Import Item</Button>
		</div>
	</form>
</Modal>
