import tailwindcss from '@tailwindcss/vite';
import UnpluginTypia from '@typia/unplugin/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [UnpluginTypia(), tailwindcss(), sveltekit()]
});
