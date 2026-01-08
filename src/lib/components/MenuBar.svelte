<script lang="ts">
	import { Spring } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
	import { goto, onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	const menus = [
		{
			name: 'Home',
			href: '/'
		},
		{
			name: 'About',
			href: '/about'
		},
		{
			name: 'Works',
			href: '/works'
		},
		{
			name: 'Blog',
			href: '/blog'
		},
		{
			name: 'Contact',
			href: '/contact'
		}
	] as const;

	const _menus = [...menus, ...menus];

	const rotation = new Spring(0, {
		stiffness: 0.1,
		damping: 0.8
	});

	const isMobile = new MediaQuery('max-width: 768px');

	let navigateTimeout: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (rotation.target) {
			navigateTimeout = setTimeout(() => {
				if (
					!_menus.some((menu) =>
						menu.href === '/'
							? location.pathname === menu.href
							: location.pathname.startsWith(menu.href)
					)
				)
					return;

				const step = 360 / _menus.length;
				const offset = rotation.target - 180;
				let i = -Math.round(offset / step) % _menus.length;
				if (i < 0) i += _menus.length;
				if (
					_menus[i].href === '/'
						? location.pathname === _menus[i].href
						: location.pathname.startsWith(_menus[i].href)
				)
					return;

				goto(_menus[i].href);
			}, 1000);
		}
		return () => clearTimeout(navigateTimeout);
	});

	onMount(() => {
		let i = _menus.findIndex((menu) =>
			menu.href === '/' ? location.pathname === menu.href : location.pathname.startsWith(menu.href)
		);
		rotateRecordTo(i);
	});
	onNavigate(() => {
		let i = _menus.findIndex((menu) =>
			menu.href === '/' ? location.pathname === menu.href : location.pathname.startsWith(menu.href)
		);
		rotateRecordTo(i);
	});

	function rotateRecordTo(i: number) {
		let target = 180 - (i / _menus.length) * 360;
		let diff = target - rotation.current;
		diff -= Math.round(diff / 180) * 180;
		rotation.target = rotation.current + diff;
	}

	let snapTimeout: ReturnType<typeof setTimeout>;

	function snapToNearest() {
		clearTimeout(snapTimeout);
		snapTimeout = setTimeout(() => {
			const step = 360 / _menus.length;
			const offset = rotation.target - 180;
			let i = -Math.round(offset / step) % _menus.length;
			if (i < 0) i += _menus.length;
			rotateRecordTo(i);
		}, 200);
	}

	function handleWheel(e: WheelEvent) {
		rotation.target = rotation.current + e.deltaY * 0.3;
		snapToNearest();
	}

	// Touch handling
	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartRotation = 0;
	let isTouching = false;

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		isTouching = true;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		touchStartRotation = rotation.current;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isTouching || e.touches.length !== 1) return;
		e.preventDefault();

		const touchX = e.touches[0].clientX;
		const touchY = e.touches[0].clientY;
		const deltaX = touchX - touchStartX;
		const deltaY = touchY - touchStartY;

		// Mobile: horizontal swipe, Desktop: vertical swipe
		const delta = isMobile.current ? -deltaX : deltaY;
		const sensitivity = isMobile.current ? 0.25 : 0.5;

		rotation.target = touchStartRotation + delta * sensitivity;
	}

	function handleTouchEnd() {
		if (!isTouching) return;
		isTouching = false;
		snapToNearest();
	}
</script>

<input type="checkbox" id="menu-bar-toggle" class="hidden" />
<label for="menu-bar-toggle" id="menu-bar-button">
	<span></span>
	<span></span>
	<span></span>
</label>
<label for="menu-bar-toggle" id="menu-backdrop"></label>

<div id="menu-bar">
	<div
		id="menu-bar-record"
		onwheel={handleWheel}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		ontouchcancel={handleTouchEnd}
		style="--rotation: {rotation.current}"
	>
		{#each _menus as menu, i (i)}
			<a
				href={menu.href}
				style="--i: {i}; --total: {_menus.length}"
				class="menu-link"
				onfocus={() => rotateRecordTo(i)}
			>
				{menu.name}
			</a>
		{/each}
	</div>
</div>

<style lang="sass">
// Variables for responsive breakpoint
$mobile-breakpoint: 768px

#menu-bar-button
	position: fixed
	top: calc(50vh - 50px)
	right: -50px
	z-index: 10000
	cursor: pointer
	width: 100px
	height: 100px
	display: flex
	align-items: center
	justify-content: center
	mix-blend-mode: difference
	transform: translateX(0)
	transition: transform 0.35s var(--ease-out-soft), filter 0.35s var(--ease-out-soft)

	span
		position: absolute
		left: 0
		top: 50%
		width: 100%
		height: 10px
		background: #fff
		border-radius: 999px
		transition: transform 0.5s var(--ease-out-soft), opacity 0.5s var(--ease-out-soft)
		transform: translateY(-50%)

	span:nth-child(1)
		transform: translateY(calc(-50% - 50px))

	span:nth-child(2)
		transform: translateY(-50%)

	span:nth-child(3)
		transform: translateY(calc(-50% + 50px))

	@media (max-width: $mobile-breakpoint)
		top: auto
		bottom: -50px
		right: auto
		left: calc(50vw - 50px)

		span
			width: 10px
			height: 100%
			left: 50%
			top: 0
			transform: translateX(-50%)

		span:nth-child(1)
			transform: translateX(calc(-50% - 50px))

		span:nth-child(2)
			transform: translateX(-50%)

		span:nth-child(3)
			transform: translateX(calc(-50% + 50px))

#menu-bar-button:hover
	transform: translateX(-12px)
	filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.2))

	@media (max-width: $mobile-breakpoint)
		transform: translateY(-12px)

#menu-bar-button:hover span:nth-child(1)
	transform: translateY(calc(-50% - 42px)) rotate(6deg)

	@media (max-width: $mobile-breakpoint)
		transform: translateX(calc(-50% - 42px)) rotate(6deg)

#menu-bar-button:hover span:nth-child(2)
	transform: translateY(-50%) scaleX(0.9)

	@media (max-width: $mobile-breakpoint)
		transform: translateX(-50%) scaleY(0.9)

#menu-bar-button:hover span:nth-child(3)
	transform: translateY(calc(-50% + 42px)) rotate(-6deg)

	@media (max-width: $mobile-breakpoint)
		transform: translateX(calc(-50% + 42px)) rotate(-6deg)

#menu-bar-toggle:checked ~ #menu-bar-button
	transform: translateX(0)
	filter: none

	@media (max-width: $mobile-breakpoint)
		transform: translateY(0)

#menu-bar-toggle:checked ~ #menu-bar-button:hover
	transform: translateX(0)
	filter: none

	@media (max-width: $mobile-breakpoint)
		transform: translateY(0)

#menu-bar-toggle:checked ~ #menu-bar-button:hover span:nth-child(1)
	transform: translateY(-50%) rotate(45deg)

	@media (max-width: $mobile-breakpoint)
		transform: translateX(-50%) rotate(45deg)

#menu-bar-toggle:checked ~ #menu-bar-button:hover span:nth-child(2)
	transform: translateY(-50%) scaleX(0)
	opacity: 0

	@media (max-width: $mobile-breakpoint)
		transform: translateX(-50%) scaleY(0)

#menu-bar-toggle:checked ~ #menu-bar-button:hover span:nth-child(3)
	transform: translateY(-50%) rotate(-45deg)

	@media (max-width: $mobile-breakpoint)
		transform: translateX(-50%) rotate(-45deg)

#menu-bar
	position: fixed
	top: 0
	right: 0
	z-index: 9999
	width: 60vh
	height: 100vh
	transition: clip-path 0.3s var(--ease-in), transform 0.3s var(--ease-in-soft)
	clip-path: circle(0vh at 100% 50%)
	transform: translateX(50%)
	overflow: hidden
	display: flex
	justify-content: flex-end

	@media (max-width: $mobile-breakpoint)
		top: auto
		bottom: 0
		right: auto
		left: 0
		width: 100vw
		height: 70vw
		clip-path: circle(0vw at 50% 100%)
		transform: translateY(50%)
		justify-content: center
		align-items: flex-end

#menu-bar-record
	width: 100%
	height: 100%
	background-color: #111
	background-image: repeating-radial-gradient(circle at 100% 50%, #111 0, #111 2px, #282828 3px, #282828 4px)
	background-size: cover
	background-repeat: no-repeat
	position: relative
	display: flex
	justify-content: center
	align-items: center

	@media (max-width: $mobile-breakpoint)
		background-image: repeating-radial-gradient(circle at 50% 100%, #111 0, #111 2px, #282828 3px, #282828 4px)

	&::before
		content: ''
		position: absolute
		right: 0
		top: 50%
		transform: translate(50%, -50%)
		width: 20vh
		height: 20vh
		border-radius: 50%
		background: var(--primary-color)
		border: 2px solid #fff
		z-index: 10000

		@media (max-width: $mobile-breakpoint)
			right: auto
			top: auto
			bottom: 0
			left: 50%
			transform: translate(-50%, 50%)
			width: 20vw
			height: 20vw

	.menu-link
		--rad: calc((var(--rotation) + (var(--i) / var(--total) * 360)) * 1deg)
		font-size: 5rem
		position: absolute
		top: calc(50vh + sin(var(--rad)) * 50vh)
		left: calc(30px + 50vh + cos(var(--rad)) * 50vh)
		transform: translateY(-50%)
		color: #fff
		text-decoration: none
		text-transform: uppercase

		@media (max-width: $mobile-breakpoint)
			// Same rotation calculation as desktop, position formula handles the axis change
			--rad-mobile: calc((var(--rotation) + (var(--i) / var(--total) * 360)) * 1deg)
			font-size: 2.5rem
			// Use negative cos so top of circle is at top of container, with offset for visibility
			top: calc(100% - 10vw + cos(var(--rad-mobile)) * 50vw)
			left: calc(50% + sin(var(--rad-mobile)) * 50vw)
			transform: translate(-50%, -50%)
			white-space: nowrap

#menu-backdrop
	position: fixed
	top: 0
	left: 0
	width: 100vw
	height: 100vh
	z-index: 9998
	cursor: pointer
	background: black
	opacity: 0	
	display: none
	transition: opacity 0.5s ease, display 0.5s allow-discrete
	pointer-events: none

#menu-bar-toggle:checked ~ #menu-backdrop
	opacity: .3
	display: block
	pointer-events: auto

	@starting-style
		opacity: 0

#menu-bar-toggle:checked ~ #menu-bar
	clip-path: circle(60vh at 100% 50%)
	transform: translateX(0)
	transition: clip-path 0.5s var(--ease-out), transform 0.5s var(--ease-out-soft)

	@media (max-width: $mobile-breakpoint)
		clip-path: circle(70vw at 50% 100%)
		transform: translateY(0)

#menu-bar-toggle:checked ~ #menu-bar-button
	span:nth-child(1)
		transform: translateY(-50%) rotate(45deg)

		@media (max-width: $mobile-breakpoint)
			transform: translateX(-50%) rotate(45deg)

	span:nth-child(2)
		transform: translateY(-50%) scaleX(0)
		opacity: 0

		@media (max-width: $mobile-breakpoint)
			transform: translateX(-50%) scaleY(0)

	span:nth-child(3)
		transform: translateY(-50%) rotate(-45deg)

		@media (max-width: $mobile-breakpoint)
			transform: translateX(-50%) rotate(-45deg)

</style>
