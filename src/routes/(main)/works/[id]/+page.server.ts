import { generateDB } from '$lib/server/db';
import { work, work_urls } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireDatabaseForLoad } from '$lib/server/platform';

export const load: PageServerLoad = async ({ params, platform }) => {
	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);

	const workItem = (await db.select().from(work).where(eq(work.id, params.id)))[0];

	if (!workItem) {
		throw error(404, 'Work not found');
	}

	const urls = await db.select().from(work_urls).where(eq(work_urls.workId, params.id));

	return { work: { ...workItem, urls } };
};
