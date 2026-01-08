import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	const pageTags = definePageMetaTags({
		title: data.blog.title,
		openGraph: {
			title: data.blog.title,
			description: data.blog.title,
			images: [
				{
					url: data.blog.thumbnail ?? 'https://pexisgle.dev/ogp.png',
					alt: data.blog.title
				}
			]
		}
	});

	return { ...data, ...pageTags };
};
