<script lang="ts">
	import Markdown from 'svelte-exmarkdown';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';

	let { content }: { content: string | undefined } = $props();
	const plugins: Plugin[] = [{ rehypePlugin: rehypeHighlight }];
</script>

<div class="flex flex-1 flex-col overflow-hidden rounded-lg border text-left dark:border-gray-600">
	<div class="border-b bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
		<span class="text-sm font-medium text-gray-900 dark:text-white">Preview</span>
	</div>
	<div
		class="prose max-w-none flex-1 overflow-y-auto bg-white p-4 dark:bg-gray-800 dark:prose-invert"
	>
		{#if content}
			<Markdown md={content} {plugins} />
		{/if}
	</div>
</div>
