import { definePageMetaTags } from 'svelte-meta-tags';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const pageTags = definePageMetaTags({
		title: 'CONTACT',
		openGraph: {
			title: 'CONTACT'
		}
	});

	return { ...pageTags };
};
