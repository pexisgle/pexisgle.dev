import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	const pageTags = definePageMetaTags({
		title: data.work.title,
		description: data.work.description ?? undefined,
		openGraph: {
			title: data.work.title,
			description: data.work.description ?? undefined,
			images: [
				{
					url: data.work.thumbnail ?? 'https://pexisgle.dev/ogp.png',
					alt: data.work.title
				}
			]
		}
	});

	return { ...data, ...pageTags };
};
