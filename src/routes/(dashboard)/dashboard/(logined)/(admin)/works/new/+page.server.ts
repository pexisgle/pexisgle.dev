import { generateDB } from '$lib/server/db';
import { image, work, work_urls } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import type { BatchItem } from 'drizzle-orm/batch';
import { redirect, fail } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requirePlatformForActions } from '$lib/server/platform';
import type { WorkType } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { arktype as arktypeAdapter } from 'sveltekit-superforms/adapters';
import { workFormSchema } from '$lib/server/form-schemas';
import { uploadThumbnail } from '$lib/server/storage/thumbnail';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(arktypeAdapter(workFormSchema), { allowFiles: true })
	};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(request, arktypeAdapter(workFormSchema), { allowFiles: true });
		if (!form.valid) {
			return fail(400, { form });
		}

		const {
			id: submittedId,
			title,
			description,
			creationPeriod,
			article,
			urls: urlsJson,
			type,
			thumbnail
		} = form.data;

		const { db: d1, kv } = requirePlatformForActions(platform);
		const { thumbnailId, thumbnailKvId } = await uploadThumbnail(thumbnail, kv);

		const db = generateDB(d1);
		const workId = submittedId || uuidv4();

		const batch: BatchItem<'sqlite'>[] = [];

		if (thumbnailId && thumbnailKvId) {
			batch.push(
				db.insert(image).values({
					id: thumbnailId,
					kv_id: thumbnailKvId
				})
			);
		}

		batch.push(
			db.insert(work).values({
				id: workId,
				title,
				description,
				type: type as WorkType,
				creationPeriod: creationPeriod || null,
				article: article || null,
				thumbnail: thumbnailId
			})
		);

		if (urlsJson) {
			try {
				const urls = JSON.parse(urlsJson) as { title: string; url: string }[];
				if (Array.isArray(urls) && urls.length > 0) {
					batch.push(
						db.insert(work_urls).values(
							urls.map((u) => ({
								id: uuidv4(),
								workId: workId,
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
