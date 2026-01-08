import { definePageMetaTags } from 'svelte-meta-tags';

export const load = () => {
	const pageTags = definePageMetaTags({
		title: 'HOME',
		description: 'Portfolio of Pexisgle. Works, Blog, Skills, Awards, Certifications, and more.',
		openGraph: {
			title: 'HOME',
			description: 'Portfolio of Pexisgle. Works, Blog, Skills, Awards, Certifications, and more.'
		}
	});

	return { ...pageTags };
};
