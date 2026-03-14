import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';

function getBlogIds() {
	const dir = 'content/blog';
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.map((f) => f.slice(0, -3)); // Remove '.md'
}

function getWorkIds() {
	const dir = 'content/works';
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith('.json'))
		.map((f) => f.slice(0, -5)); // Remove '.json'
}

const blogIds = getBlogIds();
const workIds = getWorkIds();

const prerenderEntries = [
	'*',
	...blogIds.map((id) => `/blog/${id}`),
	...workIds.map((id) => `/works/${id}`)
];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		prerender: {
			entries: prerenderEntries
		}
	},
	preprocess: [vitePreprocess()],
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
