import { generateDB } from '$lib/server/db';
import { image, work, work_urls } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requirePlatformForLoad, requirePlatformForActions } from '$lib/server/platform';
import type { WorkType } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { workFormSchema } from '$lib/server/form-schemas';
import { uploadThumbnail } from '$lib/server/storage/thumbnail';

export const load: PageServerLoad = async ({ params, platform, parent }) => {
	await parent();
	const { db: d1 } = requirePlatformForLoad(platform);
	const db = generateDB(d1);
	const workItem = (await db.select().from(work).where(eq(work.id, params.id))).at(0);

	if (!workItem) {
		throw redirect(302, '/dashboard/works');
	}

	const urls = await db.select().from(work_urls).where(eq(work_urls.workId, params.id));

	const form = await superValidate(
		{
			id: workItem.id,
			title: workItem.title,
			description: workItem.description || undefined,
			type: workItem.type,
			creationPeriod: workItem.creationPeriod || undefined,
			article: workItem.article ?? '',
			urls: JSON.stringify(urls)
		},
		arktype(workFormSchema),
		{ allowFiles: true }
	);

	return { work: { ...workItem, urls }, form };
};

export const actions: Actions = {
	default: async ({ request, platform, params }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(request, arktype(workFormSchema), { allowFiles: true });
		if (!form.valid) {
			return fail(400, { form });
		}

		const id = params.id;
		const {
			id: newId,
			title,
			description,
			creationPeriod,
			article,
			urls: urlsJson,
			type,
			thumbnail
		} = form.data;

		if (!id) {
			return fail(400, { message: 'ID is required' });
		}

		const { db: d1, kv } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		// Check for collision if ID changed
		if (newId && newId !== id) {
			const existingNew = (await db.select().from(work).where(eq(work.id, newId))).at(0);
			if (existingNew) {
				return fail(400, { form, message: 'ID already exists' });
			}
		}

		const { thumbnailId, thumbnailKvId } = await uploadThumbnail(thumbnail, kv);

		const updateData: {
			id?: string;
			title: string;
			description: string | null;
			type: WorkType;
			creationPeriod: string | null;
			article: string | null;
			thumbnail?: string;
		} = {
			title,
			description: description || null,
			type: type as WorkType,
			creationPeriod: creationPeriod || null,
			article: article || null
		};

		if (thumbnailId) {
			updateData.thumbnail = thumbnailId;
		}

		if (newId && newId !== id) {
			updateData.id = newId;
		}

		const batch: BatchItem<'sqlite'>[] = [];

		// 0. Insert Image (if new thumbnail)
		if (thumbnailId && thumbnailKvId) {
			batch.push(
				db.insert(image).values({
					id: thumbnailId,
					kv_id: thumbnailKvId
				})
			);
		}

		// 1. Delete dependents (using OLD ID)
		batch.push(db.delete(work_urls).where(eq(work_urls.workId, id)));

		// 2. Update parent (change OLD ID to NEW ID)
		batch.push(db.update(work).set(updateData).where(eq(work.id, id)));

		// 3. Insert dependents (using NEW ID)
		if (urlsJson) {
			console.log('!!!!', urlsJson);
			try {
				const urls = JSON.parse(urlsJson) as { title: string; url: string }[];
				if (Array.isArray(urls) && urls.length > 0) {
					batch.push(
						db.insert(work_urls).values(
							urls.map((u) => ({
								id: uuidv4(),
								workId: newId || id, // Use newId if set, otherwise fallback to old id
								url: u.url,
								title: u.title
							}))
						)
					);
				}
			} catch {
				console.error('Failed to parse URLs');
			}
		}

		await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

		throw redirect(303, '/dashboard/works');
	}
};
