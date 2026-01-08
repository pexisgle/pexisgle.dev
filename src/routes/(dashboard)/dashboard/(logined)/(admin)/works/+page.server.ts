import { generateDB } from '$lib/server/db';
import { work, work_urls, type WorkType } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requireDatabaseForLoad, requireDatabaseForActions } from '$lib/server/platform';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { type } from 'arktype';
import { importFormSchema } from '$lib/server/form-schemas';
import { workListSchema, workDataSchema } from '$lib/server/data-schemas';
import { v4 as uuidv4 } from 'uuid';
import type { BatchItem } from 'drizzle-orm/batch';

export const load: PageServerLoad = async ({ platform, parent }) => {
	const { user } = await parent();

	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);
	const works = await db.select().from(work).orderBy(desc(work.createdAt));

	const worksWithUrls = await Promise.all(
		works.map(async (w) => {
			const urls = await db.select().from(work_urls).where(eq(work_urls.workId, w.id));
			return { ...w, urls };
		})
	);

	const importForm = await superValidate(arktype(importFormSchema));

	return { works: worksWithUrls, user, importForm };
};

export const actions: Actions = {
	delete: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { message: 'ID is required' });
		}

		const d1 = requireDatabaseForActions(platform);
		const db = generateDB(d1);

		// Delete URLs first
		await db.delete(work_urls).where(eq(work_urls.workId, id));
		await db.delete(work).where(eq(work.id, id));

		return { success: true };
	},

	import: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const formData = await request.formData();
		const jsonFile = formData.get('file');

		if (!jsonFile || !(jsonFile instanceof File)) {
			return fail(400, { message: 'JSON file is required' });
		}

		try {
			const text = await jsonFile.text();
			const json = JSON.parse(text);

			const result = workListSchema(json);

			if (result instanceof type.errors) {
				return fail(400, { message: 'Invalid JSON format: ' + result.summary });
			}
			const data = result;

			const d1 = requireDatabaseForActions(platform);
			const db = generateDB(d1);

			// Let's stick to the `batch` array approach for atomicity.
			// Re-initialize batch
			const finalBatch: BatchItem<'sqlite'>[] = [];
			finalBatch.push(db.delete(work_urls));
			finalBatch.push(db.delete(work));

			const worksToInsert = [];
			const urlsToInsert = [];

			for (const item of data) {
				const workId = uuidv4();
				worksToInsert.push({
					id: workId,
					title: item.title,
					description: item.description ?? null,
					type: item.type,
					creationPeriod: item.creationPeriod ?? null,
					article: item.article ?? null
				});

				if (item.urls) {
					for (const u of item.urls) {
						urlsToInsert.push({
							id: uuidv4(),
							workId: workId,
							title: u.title,
							url: u.url
						});
					}
				}
			}

			if (worksToInsert.length > 0) {
				// Chunk works
				for (let i = 0; i < worksToInsert.length; i += 20) {
					finalBatch.push(db.insert(work).values(worksToInsert.slice(i, i + 20)));
				}
			}

			if (urlsToInsert.length > 0) {
				// Chunk urls
				for (let i = 0; i < urlsToInsert.length; i += 20) {
					finalBatch.push(db.insert(work_urls).values(urlsToInsert.slice(i, i + 20)));
				}
			}

			await db.batch(finalBatch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

			return { success: true, imported: data.length };
		} catch (error) {
			console.error('Import error:', error);
			return fail(400, { message: 'Invalid JSON file or Database error' });
		}
	},

	importItem: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const formData = await request.formData();
		const jsonFile = formData.get('file');

		if (!jsonFile || !(jsonFile instanceof File)) {
			return fail(400, { message: 'JSON file is required' });
		}

		try {
			const text = await jsonFile.text();
			const json = JSON.parse(text);

			const result = workDataSchema(json);

			if (result instanceof type.errors) {
				return fail(400, { message: 'Invalid JSON format: ' + result.summary });
			}
			const item = result;

			const d1 = requireDatabaseForActions(platform);
			const db = generateDB(d1);

			const workId = uuidv4();
			const batch: BatchItem<'sqlite'>[] = [];

			batch.push(
				db.insert(work).values({
					id: workId,
					title: item.title,
					description: item.description ?? null,
					type: item.type as WorkType,
					creationPeriod: item.creationPeriod ?? null,
					article: item.article ?? null
				})
			);

			if (item.urls && item.urls.length > 0) {
				const urlsToInsert = item.urls.map((u) => ({
					id: uuidv4(),
					workId: workId,
					title: u.title,
					url: u.url
				}));
				batch.push(db.insert(work_urls).values(urlsToInsert));
			}

			await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

			return { success: true, imported: 1 };
		} catch (error) {
			console.error('Import Item error:', error);
			return fail(400, { message: 'Invalid JSON file or Database error' });
		}
	}
};
