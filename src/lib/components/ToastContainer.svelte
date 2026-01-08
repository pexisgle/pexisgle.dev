<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { Toast } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		ExclamationCircleSolid,
		InfoCircleSolid,
		CloseCircleSolid
	} from 'flowbite-svelte-icons';
	import { fly } from 'svelte/transition';

	import type { Component } from 'svelte';

	const icons: Record<string, Component> = {
		success: CheckCircleSolid,
		error: CloseCircleSolid,
		info: InfoCircleSolid,
		warning: ExclamationCircleSolid
	};

	const colors: Record<string, 'green' | 'red' | 'blue' | 'yellow'> = {
		success: 'green',
		error: 'red',
		info: 'blue',
		warning: 'yellow'
	};
</script>

<div class="fixed top-5 right-5 z-50 flex flex-col gap-2">
	{#each $toast as t (t.id)}
		<div transition:fly={{ x: 200, duration: 300 }}>
			<Toast color={colors[t.type]} class="mb-2 flex items-start">
				{#snippet icon()}
					{@const Icon = icons[t.type]}
					<Icon class="h-5 w-5" />
				{/snippet}
				<div class="ml-3 text-sm font-normal">
					{t.message}
				</div>
			</Toast>
		</div>
	{/each}
</div>
