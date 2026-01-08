<script lang="ts">
	import type { PageProps } from './$types';
	import MarkdownPreview from '$lib/components/MarkdownPreviewMain.svelte';
	import { MetaTags } from 'svelte-meta-tags';

	let { data }: PageProps = $props();
	const post = $derived(data.blog);
</script>

<MetaTags
	title={post.title}
	description={post.description || post.title}
	openGraph={{
		title: post.title,
		description: post.description || post.title,
		images: post.thumbnail
			? [
					{
						url: `https://pexisgle.pages.dev/api/image/${post.thumbnail}`,
						alt: post.title
					}
				]
			: undefined
	}}
/>

<div class="bg">
	<div class="blog-detail-container">
		<div class="header-section">
			<div class="header">
				<a href="/blog" class="back-button">Back to Blog</a>
			</div>

			<div class="meta">
				<h1>{post.title}</h1>
				{#if post.publishedAt}
					<span class="date">{new Date(post.publishedAt).toLocaleDateString()}</span>
				{/if}
			</div>

			{#if post.thumbnail}
				<img src="/api/image/{post.thumbnail}" alt={post.title} class="thumbnail" />
			{/if}
		</div>

		{#if post.content}
			<div class="article-content">
				<MarkdownPreview content={post.content} />
			</div>
		{/if}
	</div>
</div>

<style lang="sass">
.blog-detail-container
    max-width: 800px
    margin: 0 auto
    padding: 2em 2em 4em
    min-height: 100vh

.header-section
    display: flex
    flex-direction: column
    gap: 2em
    margin-bottom: 3em
    text-align: center

    img.thumbnail
        max-height: 500px
        box-shadow: 0 4px 20px rgba(0,0,0,0.3)

    .meta
        display: flex
        flex-direction: column
        gap: 0.5em
        align-items: center

        h1
            font-size: 3em
            margin: 0
            line-height: 1.2
        
        .date
            font-style: italic
            opacity: 0.6
            font-size: 1.1em
</style>
