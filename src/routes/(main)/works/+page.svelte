<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const work_types = $derived(data.work_types);
	const types_selection = $derived(new SvelteSet<string>(work_types));
	const filtered_works = $derived(data.works.filter((work) => types_selection.has(work.type)));
</script>

<div class="bg">
	<h1>pexisgle's Works</h1>
	<div class="filters">
		{#each work_types as type (type)}
			<button
				class="filter-btn"
				class:active={types_selection.has(type)}
				onclick={() => {
					if (types_selection.has(type)) {
						types_selection.delete(type);
					} else {
						types_selection.add(type);
					}
				}}
			>
				{type}
			</button>
		{/each}
	</div>
	<div class="works">
		{#each filtered_works as work (work.id)}
			<div class="work" animate:flip={{ duration: 400 }} transition:fade>
				<a href={`/works/${work.id}`} class="work-link">
					{#if work.thumbnail}
						<img src="/api/image/{work.thumbnail}" alt={work.title} class="thumbnail" />
					{:else}
						<div class="thumbnail placeholder">
							<span>No Image</span>
						</div>
					{/if}
					<h2>{work.title}</h2>
				</a>
				{#if work.creationPeriod}
					<span class="period">{work.creationPeriod}</span>
				{/if}
				<p>{work.description}</p>
				{#if work.urls && work.urls.length > 0}
					<div class="links">
						{#each work.urls as link (link.url)}
							<a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style lang="sass">
@use '$lib/variables.sass' as *

.filter-btn
	margin: 0.5em
	border: none
	border-radius: $radius-sm
	padding: 0.5em
	cursor: pointer
	color: var(--text-color)
	background-color: var(--primary-color)
	transition: background-color $transition-fast
	&.active
		background-color: var(--secondary-color)
	&:hover
		background-color: var(--accent-color)

.works
	@include grid-responsive(400px, 1em)
	margin-bottom: 2em

.work
	border: 1px solid var(--text-color)
	border-radius: $radius-sm
	padding: 1em
	text-align: center
	display: flex
	flex-direction: column
	gap: $gap-xs
	
	.work-link
		text-decoration: none
		color: inherit
		display: flex
		flex-direction: column
		align-items: center
		gap: $gap-xs
		&:hover h2
			text-decoration: underline

	.period
		font-size: 0.8em
		opacity: 0.8
		font-style: italic
	.links
		display: flex
		flex-wrap: wrap
		gap: $gap-xs
		justify-content: center
		a
			font-size: 0.9em
			text-decoration: underline
			color: var(--text-color)

h1
	font-size: 4em
</style>
