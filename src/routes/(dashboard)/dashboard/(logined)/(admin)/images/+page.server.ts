import type { PageServerLoad, Actions } from './$types';
import { generateDB } from '$lib/server/db';
import { image as images } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireDatabaseForLoad, requirePlatformForActions } from '$lib/server/platform';

export const load: PageServerLoad = async ({ platform, parent }) => {
	await parent();
	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);
	const list = await db
		.select({
			id: images.id,
			createdAt: images.createdAt
		})
		.from(images)
		.orderBy(desc(images.createdAt));
	return { images: list };
};

export const actions: Actions = {
	upload: async ({ request, platform }) => {
		const { db: d1, kv } = requirePlatformForActions(platform);
		const formData = await request.formData();
		const file = formData.get('image') as File;

		if (!file || file.size === 0) {
			return fail(400, { error: 'No file uploaded' });
		}

		if (await kv.get(file.name)) {
			return fail(400, { error: 'File already exists' });
		}

		const buffer = await file.arrayBuffer();
		const db = generateDB(d1);

		await kv.put(file.name, buffer, {
			metadata: {
				contentType: file.type
			}
		});

		await db.insert(images).values({
			kv_id: file.name
		});

		return { success: true };
	}
};
