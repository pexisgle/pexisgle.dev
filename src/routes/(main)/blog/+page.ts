import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	const pageTags = definePageMetaTags({
		title: 'BLOG',
		openGraph: {
			title: 'BLOG'
		}
	});

	return { ...data, ...pageTags };
};
