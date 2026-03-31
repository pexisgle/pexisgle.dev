<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Card, Button } from 'flowbite-svelte';
	import { GithubSolid } from 'flowbite-svelte-icons';
	import { getToken } from '$lib/dashboard/auth';

	onMount(() => {
		if (getToken()) goto('/dashboard');
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
	<Card class="w-full max-w-md">
		<h2 class="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
			Welcome to Pexisgle Dashboard
		</h2>
		<Button href="/dashboard/signin/github" color="dark" size="lg" class="w-full">
			<GithubSolid class="me-2 h-5 w-5" />
			Sign in with GitHub
		</Button>
	</Card>
</div>
