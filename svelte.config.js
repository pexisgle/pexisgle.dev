import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = 'content';

function getBlogEntries() {
	const dir = join(CONTENT_DIR, 'blog');
	let files;
	try {
		files = readdirSync(dir);
	} catch {
		return [];
	}
	return files
		.filter((file) => file.endsWith('.md'))
		.map((file) => {
			const id = basename(file, '.md');
			const filePath = join(dir, file);
			try {
				const raw = readFileSync(filePath, 'utf-8');
				const { data } = matter(raw);
				if (!data.published) return null;
				return `/blog/${id}`;
			} catch {
				return null;
			}
		})
		.filter(Boolean);
}

function getWorkEntries() {
	const dir = join(CONTENT_DIR, 'works');
	let files;
	try {
		files = readdirSync(dir);
	} catch {
		return [];
	}
	return files
		.filter((file) => file.endsWith('.md'))
		.map((file) => {
			const id = basename(file, '.md');
			return `/works/${id}`;
		})
		.filter(Boolean);
}

const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['*', ...getBlogEntries(), ...getWorkEntries()]
		}
	},
	preprocess: [vitePreprocess({ script: true })],
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
