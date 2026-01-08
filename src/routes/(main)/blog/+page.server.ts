import { generateDB } from '$lib/server/db';
import { blog } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { eq, desc } from 'drizzle-orm';
import { requireDatabaseForLoad } from '$lib/server/platform';

export const load: PageServerLoad = async ({ platform }) => {
	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);
	// Only fetch published blogs
	const blogs = await db
		.select()
		.from(blog)
		.where(eq(blog.published, true))
		.orderBy(desc(blog.createdAt));

	return { blogs };
};
