<script lang="ts">
	import 'ress';
	import './layout.sass';
	import 'highlight.js/styles/github-dark.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setupViewTransition } from '$lib/utils/view-transition';
	import MenuBar from '$lib/components/MenuBar.svelte';
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { ScrollSmoother } from 'gsap/ScrollSmoother';
	import { page } from '$app/state';
	import { MetaTags, deepMerge } from 'svelte-meta-tags';

	gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

	let { data, children } = $props();

	// Setup View Transition API
	setupViewTransition();

	onMount(() => {
		ScrollSmoother.create({
			wrapper: '#smooth-wrapper',
			content: '#smooth-content',
			smooth: 0.5,
			effects: true
		});
	});
	onDestroy(() => {
		ScrollTrigger.getAll().forEach((st) => st.kill());
	});

	let metaTags = $derived(deepMerge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<MetaTags {...metaTags} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="vt-arrow-up"></div>
<div id="vt-arrow-down"></div>

<MenuBar />

<div id="smooth-wrapper">
	<div id="smooth-content">
		{@render children()}
	</div>
</div>

<div id="film-grain" style="background-image: url('/assets/noise.svg')"></div>

<style lang="sass">
:root
    --thic: 50px
    --dura: 1s
    view-transition-name: root

#film-grain
    position: fixed
    top: -50%
    left: -50%
    width: 200vw
    height: 200vh
    z-index: 9999
    pointer-events: none
    opacity: 0.5
    mix-blend-mode: overlay
    background-repeat: repeat
    animation: grain 7s steps(10) infinite

@keyframes grain
    0%, 100%
        transform: translate(0, 0)
    10%
        transform: translate(-3%, -5%)
    20%
        transform: translate(-7%, 2%)
    30%
        transform: translate(4%, -8%)
    40%
        transform: translate(-2%, 8%)
    50%
        transform: translate(-7%, 5%)
    60%
        transform: translate(7%, 0%)
    70%
        transform: translate(0%, 7%)
    80%
        transform: translate(2%, 10%)
    90%
        transform: translate(-5%, 5%)

/* --- Core Transition Groups --- */

/* Drive the transition duration and variable */
::view-transition-group(root),
::view-transition-group(up-arrow),
::view-transition-group(down-arrow)
    animation: driver var(--dura) var(--ease-in-out)
    mix-blend-mode: normal

::view-transition-group(up-arrow),
::view-transition-group(down-arrow)
    z-index: 100

@keyframes driver
    from
        --prgr: 0
    to
        --prgr: 1

/* Reset default fade animations for all custom transitions */
::view-transition-old(root),
::view-transition-new(root),
::view-transition-new(up-arrow),
::view-transition-new(down-arrow)
    animation: none
    mix-blend-mode: normal
    opacity: 1

/* Shared math context for new images */
::view-transition-new(root),
::view-transition-new(up-arrow),
::view-transition-new(down-arrow)
    /* Constants and Base Calculation - Local Scope */
    --start: -50vh
    --end: calc(50vh + 50vw + var(--thic))
    --range: calc(var(--end) - var(--start))
    /* --base will update as --prgr animates (inherited from group) */
    --base: calc(var(--range) * var(--prgr) + var(--start))

/* --- Polygon Wipe (Root) --- */

::view-transition-new(root)
    /* Points */
    --p0-y: min(50vh, calc(50vh - var(--base)))
    --p1-x: min(50vw, calc(50vw - var(--base)))
    --p2-y: max(50vh, calc(50vh + var(--base)))
    --p3-x: max(50vw, calc(50vw + var(--base)))

    clip-path: polygon(50vw var(--p0-y), var(--p1-x) 50vh, 50vw var(--p2-y), var(--p3-x) 50vh)

/* --- Progress Driver --- */

@property --prgr
    syntax: '<number>'
    initial-value: 0
    inherits: true

/* --- Arrow Elements --- */

#vt-arrow-up,
#vt-arrow-down
    position: fixed
    top: 0
    left: 0
    width: 100vw
    height: 100vh
    pointer-events: none
    z-index: 99

#vt-arrow-up
    view-transition-name: up-arrow

#vt-arrow-down
    view-transition-name: down-arrow

/* Up Arrow */
::view-transition-new(up-arrow)
    background: var(--primary-color)

    --up-y0: calc(50vh - var(--base) + 50vw)
    --up-y1: calc(50vh - var(--base))
    --up-y2: calc(50vh - var(--base) + 50vw)
    --up-y3: calc(50vh - var(--base) + 50vw + var(--thic))
    --up-y4: calc(50vh - var(--base) + var(--thic))
    --up-y5: calc(50vh - var(--base) + 50vw + var(--thic))

    clip-path: polygon(0px var(--up-y0), 50vw var(--up-y1), 100vw var(--up-y2), 100vw var(--up-y3), 50vw var(--up-y4), 0px var(--up-y5))

/* Down Arrow */
::view-transition-new(down-arrow)
    background: var(--primary-color)

    --dn-y0: calc(50vh + var(--base) - 50vw)
    --dn-y1: calc(50vh + var(--base))
    --dn-y2: calc(50vh + var(--base) - 50vw)
    --dn-y3: calc(50vh + var(--base) - 50vw - var(--thic))
    --dn-y4: calc(50vh + var(--base) - var(--thic))
    --dn-y5: calc(50vh + var(--base) - 50vw - var(--thic))

    clip-path: polygon(0px var(--dn-y0), 50vw var(--dn-y1), 100vw var(--dn-y2), 100vw var(--dn-y3), 50vw var(--dn-y4), 0px var(--dn-y5))

</style>
