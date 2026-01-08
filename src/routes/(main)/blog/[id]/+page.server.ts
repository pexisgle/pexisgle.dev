import { generateDB } from '$lib/server/db';
import { blog } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { requireDatabaseForLoad } from '$lib/server/platform';

export const load: PageServerLoad = async ({ params, platform }) => {
	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);

	const blogPost = (
		await db
			.select()
			.from(blog)
			.where(and(eq(blog.id, params.id), eq(blog.published, true)))
	).at(0);

	if (!blogPost) {
		return error(404, 'Post not found');
	}

	return { blog: blogPost };
};
