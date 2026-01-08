import { generateDB } from '$lib/server/db';
import { work, work_types, work_urls } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { requireDatabaseForLoad } from '$lib/server/platform';

export const load: PageServerLoad = async ({ platform }) => {
	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);
	const works = await db.select().from(work);

	const worksWithUrls = await Promise.all(
		works.map(async (w) => {
			const urls = await db.select().from(work_urls).where(eq(work_urls.workId, w.id));
			return { ...w, urls };
		})
	);

	return { works: worksWithUrls, work_types };
};
