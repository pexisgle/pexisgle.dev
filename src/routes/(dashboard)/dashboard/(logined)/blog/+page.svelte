<script lang="ts">
	import { onMount } from 'svelte';
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
		Spinner
	} from 'flowbite-svelte';
	import {
		PlusOutline,
		EditOutline,
		TrashBinOutline,
		DownloadOutline
	} from 'flowbite-svelte-icons';
	import { getToken } from '$lib/auth';
	import { ghListFiles, ghGetBlog, ghDeleteFile } from '$lib/github';
	import type { BlogFileData } from '$lib/github';
	import { toast } from '$lib/stores/toast';

	interface BlogEntry {
		id: string;
		sha: string;
		path: string;
		data: BlogFileData;
	}

	let loading = $state(true);
	let blogs = $state<BlogEntry[]>([]);

	async function loadBlogs() {
		loading = true;
		try {
			const token = getToken();
			const files = await ghListFiles(token, 'content/blog');
			const entries = await Promise.all(
				files
					.filter((f) => f.name.endsWith('.md'))
					.map(async (f) => {
						const id = f.name.replace(/\.md$/, '');
						const result = await ghGetBlog(token, id);
						if (!result) return null;
						return { id, sha: result.sha, path: f.path, data: result.data } satisfies BlogEntry;
					})
			);
			blogs = entries
				.filter((e): e is BlogEntry => e !== null)
				.sort(
					(a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
				);
		} catch (e) {
			toast.error('Failed to load blogs');
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function deleteBlog(entry: BlogEntry) {
		if (!confirm(`Delete "${entry.data.title}"?`)) return;
		try {
			const token = getToken();
			await ghDeleteFile(token, entry.path, entry.sha, `delete blog: ${entry.id}`);
			toast.success('Blog deleted');
			await loadBlogs();
		} catch (e) {
			toast.error('Failed to delete blog');
			console.error(e);
		}
	}

	function exportBlogs() {
		const cleanData = blogs.map((b) => ({
			title: b.data.title,
			description: b.data.description,
			content: b.data.content,
			published: b.data.published,
			publishedAt: b.data.publishedAt ? new Date(b.data.publishedAt).toISOString() : null
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

	function exportBlogItem(blog: BlogEntry) {
		const cleanData = {
			title: blog.data.title,
			description: blog.data.description,
			content: blog.data.content,
			published: blog.data.published,
			publishedAt: blog.data.publishedAt ? new Date(blog.data.publishedAt).toISOString() : null
		};
		const dataStr = JSON.stringify(cleanData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const filename = blog.data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		link.download = `blog-${filename}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		loadBlogs();
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
			<Button href="/dashboard/blog/new" color="blue" size="sm" class="gap-2">
				<PlusOutline class="h-3.5 w-3.5" />
				Add new blog
			</Button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<Spinner size="10" />
		</div>
	{:else}
		<Table hoverable={true}>
			<TableHead>
				<TableHeadCell>Thumbnail</TableHeadCell>
				<TableHeadCell>Title</TableHeadCell>
				<TableHeadCell>Status</TableHeadCell>
				<TableHeadCell>Created At</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each blogs as blog (blog.id)}
					<TableBodyRow>
						<TableBodyCell class="w-20 p-2">
							{#if blog.data.thumbnail}
								<img
									src={blog.data.thumbnail}
									alt={blog.data.title}
									class="h-12 w-16 rounded object-cover"
								/>
							{:else}
								<div class="h-12 w-16 rounded bg-gray-100 dark:bg-gray-700"></div>
							{/if}
						</TableBodyCell>
						<TableBodyCell class="font-medium text-gray-900 dark:text-white">
							{blog.data.title}
						</TableBodyCell>
						<TableBodyCell>
							{#if blog.data.published}
								<Badge color="green">Published</Badge>
							{:else}
								<Badge color="yellow">Draft</Badge>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{new Date(blog.data.createdAt).toLocaleDateString()}
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
								<Button size="xs" color="red" class="p-2!" onclick={() => deleteBlog(blog)}>
									<TrashBinOutline class="h-4 w-4" />
								</Button>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</div>
