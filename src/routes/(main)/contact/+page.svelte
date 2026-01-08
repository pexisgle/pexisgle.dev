<script>
	import { fly } from 'svelte/transition';
	import Icon from '@iconify/svelte';

	let isCopied = false;

	const handleCopyEmail = async () => {
		const email = 'info@pexisgle.dev';
		try {
			await navigator.clipboard.writeText(email);
			isCopied = true;
			setTimeout(() => (isCopied = false), 2000);
		} catch {
			console.error('Failed to copy email');
		}
	};
</script>

<div class="bg">
	<div class="container">
		<h1 in:fly={{ y: -20, duration: 800, delay: 200 }}>Contact</h1>

		<p class="description" in:fly={{ y: 20, duration: 800, delay: 400 }}>
			I'm always open to discussing new projects, creative ideas<br />or opportunities to be part of
			your visions.
		</p>

		<div class="glass-links" in:fly={{ y: 30, duration: 800, delay: 600 }}>
			<a
				href="https://github.com/pexisgle"
				target="_blank"
				rel="noopener noreferrer"
				class="glass-item"
			>
				<div class="icon-wrapper">
					<Icon icon="simple-icons:github" class="icon" />
				</div>
				<div class="text-content">
					<span class="label">GitHub</span>
					<span class="value">@pexisgle</span>
				</div>
				<Icon icon="lucide:arrow-right" class="arrow" />
			</a>

			<a href="https://x.com/pexisgle" target="_blank" rel="noopener noreferrer" class="glass-item">
				<div class="icon-wrapper">
					<Icon icon="simple-icons:x" class="icon" />
				</div>
				<div class="text-content">
					<span class="label">X (Twitter)</span>
					<span class="value">@pexisgle</span>
				</div>
				<Icon icon="lucide:arrow-right" class="arrow" />
			</a>

			<button onclick={handleCopyEmail} class="glass-item" type="button">
				<div class="icon-wrapper">
					<Icon icon="lucide:mail" class="icon" />
				</div>
				<div class="text-content">
					<span class="label">Email</span>
					<span class="value">
						{#if isCopied}
							Copied!
						{:else}
							info@pexisgle.dev
						{/if}
					</span>
				</div>
				<div class="arrow">
					{#if isCopied}
						<Icon icon="lucide:check" />
					{:else}
						<Icon icon="lucide:copy" />
					{/if}
				</div>
			</button>
		</div>
	</div>
</div>

<style lang="sass">
.bg
	min-height: 100vh
	display: flex
	justify-content: center
	align-items: center
	padding: 2rem

.container
	display: flex
	flex-direction: column
	align-items: center
	gap: 2.5rem
	max-width: 800px
	width: 100%
	z-index: 1

h1
	font-size: clamp(3rem, 8vw, 5em)
	font-weight: 700
	letter-spacing: -0.02em
	background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.5))
	-webkit-background-clip: text
	background-clip: text
	color: transparent
	margin: 0

.description
	color: rgba(255, 255, 255, 0.7)
	text-align: center
	font-size: 1.1rem
	line-height: 1.6
	max-width: 500px
	margin: 0

.glass-links
	display: flex
	flex-direction: column
	gap: 1.25rem
	width: 100%
	max-width: 500px

.glass-item
	display: flex
	align-items: center
	padding: 1.25rem 2rem
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))
	backdrop-filter: blur(20px)
	-webkit-backdrop-filter: blur(20px)
	border-radius: 16px
	border: 1px solid rgba(255, 255, 255, 0.1)
	text-decoration: none
	color: white
	transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)
	position: relative
	overflow: hidden
	cursor: pointer
	width: 100%
	border: 1px solid rgba(255, 255, 255, 0.1)
	text-align: left

	&::before
		content: ''
		position: absolute
		top: 0
		left: 0
		width: 100%
		height: 100%
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)
		transform: translateX(-100%)
		transition: 0.5s

	&:hover
		transform: translateY(-2px)
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))
		border-color: rgba(255, 255, 255, 0.2)
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2)
		
		&::before
			transform: translateX(100%)

		:global(.arrow)
			transform: translateX(4px)
			opacity: 1

.icon-wrapper
	width: 48px
	height: 48px
	display: flex
	align-items: center
	justify-content: center
	background: rgba(255, 255, 255, 0.05)
	border-radius: 12px
	margin-right: 1.5rem
	flex-shrink: 0

:global(.icon)
	width: 24px
	height: 24px
	opacity: 0.9

.text-content
	display: flex
	flex-direction: column
	flex-grow: 1
	gap: 0.25rem

.label
	font-size: 0.9rem
	font-weight: 500
	color: rgba(255, 255, 255, 0.6)
	letter-spacing: 0.02em

.value
	font-size: 1.1rem
	font-weight: 600
	letter-spacing: 0.01em

:global(.arrow)
	width: 20px
	height: 20px
	opacity: 0.5
	transition: all 0.3s ease
	margin-left: 1rem

@media (min-width: 640px)
	.glass-links
		gap: 1.5rem
</style>
