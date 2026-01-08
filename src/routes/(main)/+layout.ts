import { defineBaseMetaTags } from 'svelte-meta-tags';

export const load = ({ url }) => {
	const baseTags = defineBaseMetaTags({
		title: 'Pexisgle Portfolio',
		titleTemplate: '%s | Pexisgle Portfolio',
		description: 'Portfolio of Pexisgle. Works, Blog, Skills, Awards, Certifications, and more.',
		canonical: new URL(url.pathname, url.origin).href, // creates a cleaned up URL (without hashes or query params) from your current URL
		openGraph: {
			type: 'website',
			url: new URL(url.pathname, url.origin).href,
			locale: 'ja_JP',
			title: 'Pexisgle Portfolio',
			description: 'Portfolio of Pexisgle. Works, Blog, Skills, Awards, Certifications, and more.',
			siteName: 'Pexisgle Portfolio',
			images: [
				{
					url: 'https://pexisgle.dev/ogp.png',
					alt: 'Pexisgle Portfolio',
					width: 800,
					height: 600,
					secureUrl: 'https://pexisgle.dev/ogp.png',
					type: 'image/png'
				}
			]
		},
		twitter: {
			cardType: 'summary_large_image',
			site: '@pexisgle',
			creator: '@pexisgle',
			title: 'Pexisgle Portfolio',
			description: 'Portfolio of Pexisgle. Works, Blog, Skills, Awards, Certifications, and more.',
			image: 'https://pexisgle.dev/ogp.png'
		}
	});

	return { ...baseTags };
};
