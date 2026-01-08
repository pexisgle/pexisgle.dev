import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	const pageTags = definePageMetaTags({
		title: 'ABOUT',
		openGraph: {
			title: 'ABOUT'
		}
	});

	return { ...data, ...pageTags };
};
