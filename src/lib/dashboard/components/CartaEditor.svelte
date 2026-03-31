<script lang="ts">
	import { Carta, MarkdownEditor } from 'carta-md';

	import 'carta-md/default.css';

	interface Props {
		value?: string | undefined;
		placeholder?: string;
		mode?: 'tabs' | 'split';
	}

	let { value = $bindable(), placeholder = '', mode = 'tabs' }: Props = $props();

	const carta = new Carta({
		sanitizer: false
	});
</script>

<MarkdownEditor {carta} bind:value {placeholder} {mode} />

<style>
	/* Set your monospace font  */
	/* Required to have the editor working correctly! */
	:global(.carta-font-code) {
		font-family: '...', monospace;
		font-size: 1.1rem;
		line-height: 1.1rem;
		letter-spacing: normal;
	}
</style>
