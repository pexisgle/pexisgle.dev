<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { Button, Heading, P } from 'flowbite-svelte';
	import { HomeOutline } from 'flowbite-svelte-icons';
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
	<div class="text-center">
		<div class="mb-8">
			<Heading tag="h1" class="mb-4 text-7xl font-extrabold text-primary-600 dark:text-primary-500">
				{page.status}
			</Heading>
			<Heading tag="h2" class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
				{#if page.status === 404}
					Page Not Found
				{:else if page.status === 403}
					Access Denied
				{:else if page.status === 500}
					Internal Server Error
				{:else}
					Something went wrong
				{/if}
			</Heading>
			<P class="mb-8 text-lg text-gray-500 dark:text-gray-400">
				{#if page.error?.message}
					{page.error.message}
				{:else if page.status === 404}
					The page you are looking for doesn't exist or has been moved.
				{:else if page.status === 403}
					You don't have permission to access this resource.
				{:else if page.status === 500}
					We're experiencing technical difficulties. Please try again later.
				{:else}
					An unexpected error occurred. Please try again.
				{/if}
			</P>
		</div>
		<div class="flex justify-center gap-4">
			<Button href="/dashboard" color="blue">
				<HomeOutline class="me-2 h-5 w-5" />
				Back to Dashboard
			</Button>
			<Button href="/" color="light">Go to Home</Button>
		</div>
	</div>
</div>
