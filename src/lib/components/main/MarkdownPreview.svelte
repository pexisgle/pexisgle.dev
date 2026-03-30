<script lang="ts">
	import { marked } from 'marked';

	interface Props {
		content: string | undefined;
		wrap?: boolean;
	}

	let { content, wrap = true }: Props = $props();
</script>

{#if wrap}
	<div
		class="flex flex-1 flex-col overflow-hidden rounded-lg border text-left dark:border-gray-600"
	>
		<div class="border-b bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
			<span class="text-sm font-medium text-gray-900 dark:text-white">Preview</span>
		</div>
		<div
			class="prose max-w-none flex-1 overflow-y-auto bg-white p-4 dark:bg-gray-800 dark:prose-invert"
		>
			{#if content}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html marked.parse(content)}
			{/if}
		</div>
	</div>
{:else if content}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html marked.parse(content)}
{:else}
	<p>プレビューするコンテンツがありません</p>
{/if}
