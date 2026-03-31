import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import UnpluginTypia from '@typia/unplugin/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [UnpluginTypia(), tailwindcss(), sveltekit()]
});
