<script lang="ts">
	import { Carta, MarkdownEditor } from 'carta-md';

	import { emoji } from '@cartamd/plugin-emoji';
	import { slash } from '@cartamd/plugin-slash';
	import { code } from '@cartamd/plugin-code';
	import 'carta-md/default.css';
	import '$lib/styles/github.scss';
	import '@cartamd/plugin-emoji/default.css';
	import '@cartamd/plugin-slash/default.css';
	import '@cartamd/plugin-code/default.css';

	interface Props {
		value?: string | undefined;
		placeholder?: string;
		mode?: 'tabs' | 'split';
	}

	let { value = $bindable(), placeholder = '', mode = 'tabs' }: Props = $props();

	const carta = new Carta({
		sanitizer: false,
		extensions: [emoji(), slash(), code()]
	});
</script>

<div class="carta-container">
	<MarkdownEditor {carta} bind:value {placeholder} {mode} theme="github" />
</div>

<style>
	/* Basic adjustments to fit the theme if necessary */
	:global(.carta-editor) {
		width: 100%;
		border-radius: 0.5rem;
	}
</style>
