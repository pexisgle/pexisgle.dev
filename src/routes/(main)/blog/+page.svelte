<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let container: HTMLElement | undefined = $state();
</script>

<div class="bg" bind:this={container}>
	<h1>Pexisgle's Blog</h1>

	<div class="posts">
		{#each data.blogs as post (post.id)}
			<div class="post">
				<a href={`/blog/${post.id}`} class="post-link">
					{#if post.thumbnail}
						<img src="/api/image/{post.thumbnail}" alt={post.title} class="thumbnail" />
					{:else}
						<div class="thumbnail placeholder">
							<span>No Image</span>
						</div>
					{/if}
					<h2>{post.title}</h2>
				</a>
				{#if post.publishedAt}
					<span class="date">{new Date(post.publishedAt).toLocaleDateString()}</span>
				{/if}
				<p>{post.description}</p>
			</div>
		{/each}
	</div>
</div>

<style lang="sass">
@use '$lib/variables.sass' as *

h1
	font-size: 4em
	margin-bottom: 0.2em

.posts
	@include grid-responsive(350px, 2em)
	margin-bottom: 2em

.post
	border: 1px solid var(--text-color)
	border-radius: 0.5em
	padding: 1.5em
	text-align: left
	display: flex
	flex-direction: column
	gap: 0.8em
	background: rgba(255, 255, 255, 0.02)
	@include hover-lift(-5px, 0 5px 15px rgba(0, 0, 0, 0.2))
	
	&:hover
		background: rgba(255, 255, 255, 0.05)

	.post-link
		text-decoration: none
		color: inherit
		display: flex
		flex-direction: column
		gap: 1em

		h2
			margin: 0
			font-size: 1.5em
			line-height: 1.3

	.date
		font-size: 0.8em
		opacity: 0.6
		font-style: italic

	p
		margin: 0
		line-height: 1.6
		opacity: 0.9
		@include line-clamp(3)
</style>
