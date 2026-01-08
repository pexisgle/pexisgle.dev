import { generateDB } from '$lib/server/db';
import { sns } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requirePlatformForActions, requirePlatformForLoad } from '$lib/server/platform';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { setError } from 'sveltekit-superforms/server';
import { snsFormSchema, deleteFormSchema, importFormSchema } from '$lib/server/form-schemas';
import { snsListSchema, reorderDataSchema } from '$lib/server/data-schemas';
import { type } from 'arktype';
import { v4 as uuidv4 } from 'uuid';
import type { BatchItem } from 'drizzle-orm/batch';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, parent }) => {
	const { user } = await parent();

	const { db: d1 } = requirePlatformForLoad(platform);
	const db = generateDB(d1);
	const snsItems = await db.select().from(sns).orderBy(asc(sns.order));

	const form = await superValidate(arktype(snsFormSchema));
	const deleteForm = await superValidate(arktype(deleteFormSchema));
	const importForm = await superValidate(arktype(importFormSchema));

	return { snsItems, user, form, deleteForm, importForm };
};

export const actions: Actions = {
	create: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(request, arktype(snsFormSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id: submittedId, name, icon, url, color, order } = form.data;
		const itemId = submittedId || uuidv4();

		const { db: d1 } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		await db.insert(sns).values({
			id: itemId,
			name,
			icon,
			url,
			color,
			order
		});

		return { form, success: true, snsItem: { id: itemId, name, icon, url, color, order } };
	},

	update: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(request, arktype(snsFormSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, name, icon, url, color, order } = form.data;
		if (!id) {
			return setError(form, 'id', 'ID is required');
		}

		const { db: d1 } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		await db
			.update(sns)
			.set({
				name,
				icon,
				url,
				color,
				order,
				updatedAt: sql`(unixepoch())`
			})
			.where(eq(sns.id, id));

		return { form, success: true, snsItem: { id, name, icon, url, color, order } };
	},

	delete: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { message: 'ID is required' });
		}

		const { db: d1 } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		await db.delete(sns).where(eq(sns.id, id));

		return { success: true, id };
	},

	reorder: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const formData = await request.formData();
		const itemsJson = formData.get('items');

		if (!itemsJson || typeof itemsJson !== 'string') {
			return fail(400, { message: 'Items JSON is required' });
		}

		try {
			const json = JSON.parse(itemsJson);
			const result = reorderDataSchema(json);

			if (result instanceof type.errors) {
				return fail(400, { message: 'Invalid JSON format: ' + result.summary });
			}
			const data = result;

			const { db: d1 } = requirePlatformForActions(platform);
			const db = generateDB(d1);

			// Batch update orders
			const batch: BatchItem<'sqlite'>[] = [];
			for (const item of data) {
				batch.push(db.update(sns).set({ order: item.order }).where(eq(sns.id, item.id)));
			}

			if (batch.length > 0) {
				await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
			}

			return { success: true, reordered: data.length };
		} catch (error) {
			console.error('Reorder error:', error);
			return fail(400, { message: 'Invalid JSON data' });
		}
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

			const result = snsListSchema(json);

			if (result instanceof type.errors) {
				return fail(400, { message: 'Invalid JSON format: ' + result.summary });
			}
			const data = result;

			const { db: d1 } = requirePlatformForActions(platform);
			const db = generateDB(d1);

			// Transaction: Delete all and insert new
			const batch: BatchItem<'sqlite'>[] = [];
			batch.push(db.delete(sns));

			if (data.length > 0) {
				const chunks = [];
				for (let i = 0; i < data.length; i += 20) {
					chunks.push(data.slice(i, i + 20));
				}
				for (const chunk of chunks) {
					batch.push(
						db.insert(sns).values(
							chunk.map((item) => ({
								id: uuidv4(),
								name: item.name,
								icon: item.icon,
								url: item.url,
								color: item.color,
								order: item.order
							}))
						)
					);
				}
			}

			await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

			return { success: true, imported: data.length };
		} catch (error) {
			console.error('Import error:', error);
			return fail(400, { message: 'Invalid JSON file' });
		}
	}
};
