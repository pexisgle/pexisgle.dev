import { getBlogPosts } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const blogs = (await getBlogPosts()).filter((b) => b.published);
	return { blogs };
};
