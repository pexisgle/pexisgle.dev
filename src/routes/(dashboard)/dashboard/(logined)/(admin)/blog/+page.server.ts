import { generateDB } from '$lib/server/db';
import { blog } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requireDatabaseForLoad, requireDatabaseForActions } from '$lib/server/platform';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { type } from 'arktype';
import { importFormSchema } from '$lib/server/form-schemas';
import { blogListSchema, blogDataSchema } from '$lib/server/data-schemas';
import { v4 as uuidv4 } from 'uuid';
import type { BatchItem } from 'drizzle-orm/batch';

export const load: PageServerLoad = async ({ platform, parent }) => {
	const { user } = await parent();

	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);
	const blogs = await db.select().from(blog).orderBy(desc(blog.createdAt));

	const importForm = await superValidate(arktype(importFormSchema));

	return { blogs, user, importForm };
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

		await db.delete(blog).where(eq(blog.id, id));

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

			const result = blogListSchema(json);

			if (result instanceof type.errors) {
				return fail(400, { message: 'Invalid JSON format: ' + result.summary });
			}
			const data = result;

			const d1 = requireDatabaseForActions(platform);
			const db = generateDB(d1);

			// Transaction: Delete all and insert new
			const batch: BatchItem<'sqlite'>[] = [];

			batch.push(db.delete(blog));

			for (const item of data) {
				batch.push(
					db.insert(blog).values({
						id: uuidv4(),
						title: item.title,
						description: item.description ?? null,
						content: item.content ?? null,
						published: item.published ?? false,
						publishedAt: item.publishedAt ? new Date(item.publishedAt) : null
					})
				);
			}

			await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

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

			const result = blogDataSchema(json);

			if (result instanceof type.errors) {
				return fail(400, { message: 'Invalid JSON format: ' + result.summary });
			}
			const item = result;

			const d1 = requireDatabaseForActions(platform);
			const db = generateDB(d1);

			await db.insert(blog).values({
				id: uuidv4(),
				title: item.title,
				description: item.description ?? null,
				content: item.content ?? null,
				published: item.published ?? false,
				publishedAt: item.publishedAt ? new Date(item.publishedAt) : null
			});

			return { success: true, imported: 1 };
		} catch (error) {
			console.error('Import Item error:', error);
			return fail(400, { message: 'Invalid JSON file or Database error' });
		}
	}
};
