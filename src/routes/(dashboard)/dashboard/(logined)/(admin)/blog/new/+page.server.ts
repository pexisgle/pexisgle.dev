import { generateDB } from '$lib/server/db';
import { blog, image } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import type { BatchItem } from 'drizzle-orm/batch';
import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requirePlatformForActions } from '$lib/server/platform';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { blogFormSchema } from '$lib/server/form-schemas';
import { uploadThumbnail } from '$lib/server/storage/thumbnail';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(arktype(blogFormSchema), { allowFiles: true })
	};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(request, arktype(blogFormSchema), { allowFiles: true });
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id: submittedId, title, description, content, published, thumbnail } = form.data;

		const { db: d1, kv } = requirePlatformForActions(platform);
		const { thumbnailId, thumbnailKvId } = await uploadThumbnail(thumbnail, kv);

		const db = generateDB(d1);

		const blogId = submittedId || uuidv4();
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
			db.insert(blog).values({
				id: blogId,
				title,
				description,
				content: content || null,
				thumbnail: thumbnailId,
				published,
				publishedAt: published ? new Date() : null
			})
		);

		await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

		throw redirect(303, '/dashboard/blog');
	},

	import: async ({ request, platform }) => {
		type BlogImportPayload = {
			id: string;
			title: string;
			description?: string | null;
			content?: string | null;
			published?: boolean;
			thumbnailKvId?: string | null;
		};

		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}
		const formData = await request.formData();
		const file = formData.get('file') as File;
		if (!file) return fail(400, { message: 'No file uploaded' });

		const text = await file.text();
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			return fail(400, { message: 'Invalid JSON' });
		}

		if (!parsed || typeof parsed !== 'object')
			return fail(400, { message: 'Expected an object for blog' });

		const { id, title, description, content, published, thumbnailKvId } =
			parsed as Partial<BlogImportPayload>;
		if (!id || !title) return fail(400, { message: 'id and title are required in import file' });

		const { db: d1, kv } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		let thumbnailId: string | undefined = undefined;
		if (thumbnailKvId) {
			const exists = await kv.get(thumbnailKvId);
			if (exists) {
				const existingImage = (
					await db.select().from(image).where(eq(image.kv_id, thumbnailKvId))
				).at(0);
				if (existingImage) thumbnailId = existingImage.id;
				else {
					const newId = uuidv4();
					await db.insert(image).values({ id: newId, kv_id: thumbnailKvId });
					thumbnailId = newId;
				}
			} else {
				return fail(400, { message: 'Thumbnail KV key not found' });
			}
		}

		const existing = (await db.select().from(blog).where(eq(blog.id, id))).at(0);
		if (existing) {
			await db
				.update(blog)
				.set({
					title,
					description: description ?? null,
					content: content ?? null,
					published: published ?? false,
					thumbnail: thumbnailId
				})
				.where(eq(blog.id, id));
		} else {
			await db.insert(blog).values({
				id,
				title,
				description,
				content: content ?? null,
				published: published ?? false,
				thumbnail: thumbnailId,
				publishedAt: published ? new Date() : null
			});
		}

		return { success: true, id };
	}
};
