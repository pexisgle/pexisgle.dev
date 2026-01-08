<script lang="ts">
	import type { PageProps } from './$types';
	import MarkdownPreview from '$lib/components/MarkdownPreviewMain.svelte';
	import { MetaTags } from 'svelte-meta-tags';

	let { data }: PageProps = $props();
	const work = $derived(data.work);
</script>

<MetaTags
	title={work.title}
	description={work.description || work.title}
	openGraph={{
		title: work.title,
		description: work.description || work.title,
		images: work.thumbnail
			? [
					{
						url: `https://pexisgle.pages.dev/api/image/${work.thumbnail}`,
						alt: work.title
					}
				]
			: undefined
	}}
/>

<div class="bg">
	<div class="work-detail-container">
		<div class="header-section">
			<div class="header">
				<a href="/works" class="back-button">Back to Works</a>
			</div>
			{#if work.thumbnail}
				<img src="/api/image/{work.thumbnail}" alt={work.title} class="thumbnail" />
			{/if}

			<div class="meta">
				<h1>{work.title}</h1>
				{#if work.creationPeriod}
					<span class="period">{work.creationPeriod}</span>
				{/if}
				<span class="type-badge">{work.type}</span>
				{#if work.urls && work.urls.length > 0}
					<div class="links">
						{#each work.urls as link (link.url)}
							<a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#if work.article}
			<div class="article-content">
				<MarkdownPreview content={work.article} />
			</div>
		{/if}
	</div>
</div>

<style lang="sass">
.work-detail-container
    max-width: 800px
    margin: 0 auto
    padding: 0 2em
    padding-bottom: 2em

.header-section
    display: flex
    flex-direction: column
    gap: 2em
    margin-bottom: 3em
    align-items: center
    text-align: center

    img.thumbnail
        max-height: 400px
        box-shadow: 0 4px 20px rgba(0,0,0,0.3)

    .meta
        display: flex
        flex-direction: column
        gap: 0.5em
        align-items: center

        h1
            font-size: 2.5em
            margin: 0
        
        .period
            font-style: italic
            opacity: 0.8
        
        .type-badge
            display: inline-block
            background: rgba(255, 255, 255, 0.1)
            padding: 0.3em 0.8em
            border-radius: 1em
            font-size: 0.9em
            text-transform: capitalize



        .links
            display: flex
            gap: 1em
            margin-top: 1em
            flex-wrap: wrap
            justify-content: center
            
            a
                display: inline-block
                padding: 0.5em 1.5em
                background: var(--primary-color)
                color: var(--text-color)
                text-decoration: none
                border-radius: 0.3em
                transition: background 0.2s
                
                &:hover
                    background: var(--accent-color)
.article-content
    text-align: left
</style>
