import { requireDatabaseForLoad } from '$lib/server/platform';
import { generateDB } from '$lib/server/db';
import { sns, skill, certification, award } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);

	const snsList = await db.select().from(sns).orderBy(asc(sns.order)).all();
	const skils = await db.select().from(skill).orderBy(asc(skill.order)).all();
	const certifications = await db
		.select()
		.from(certification)
		.orderBy(asc(certification.order))
		.all();
	const awards = await db.select().from(award).orderBy(asc(award.order)).all();

	return { sns: snsList, skils, certifications, awards };
};
