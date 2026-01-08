<script lang="ts">
	import Markdown from 'svelte-exmarkdown';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';

	let { content }: { content: string | undefined } = $props();
	const plugins: Plugin[] = [{ rehypePlugin: rehypeHighlight }];
</script>

{#if content}
	<Markdown md={content} {plugins} />
{:else}
	<p>プレビューするコンテンツがありません</p>
{/if}
