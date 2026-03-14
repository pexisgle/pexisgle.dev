import { getBlogPosts, getBlogPost } from '$lib/content';
import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';

export const entries: EntryGenerator = async () => {
	const posts = await getBlogPosts();
	return posts.map((p) => ({ id: p.id }));
};

export const load: PageServerLoad = async ({ params }) => {
	const blogPost = await getBlogPost(params.id);

	if (!blogPost || !blogPost.published) {
		return error(404, 'Post not found');
	}

	return { blog: blogPost };
};
