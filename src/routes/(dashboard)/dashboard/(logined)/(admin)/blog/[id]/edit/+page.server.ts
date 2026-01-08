import { generateDB } from '$lib/server/db';
import { blog, image } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { requireDatabaseForLoad, requirePlatformForActions } from '$lib/server/platform';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { blogFormSchema } from '$lib/server/form-schemas';
import { uploadThumbnail } from '$lib/server/storage/thumbnail';

export const load: PageServerLoad = async ({ params, platform, parent }) => {
	await parent();

	const d1 = requireDatabaseForLoad(platform);
	const db = generateDB(d1);
	const blogPost = (await db.select().from(blog).where(eq(blog.id, params.id))).at(0);

	if (!blogPost) {
		return error(404, 'Blog not found');
	}

	const form = await superValidate(
		{
			id: blogPost.id,
			title: blogPost.title,
			description: blogPost.description || undefined,
			content: blogPost.content ?? '',
			published: blogPost.published || false
		},
		arktype(blogFormSchema),
		{ allowFiles: true }
	);

	return { form, blog: blogPost };
};

export const actions: Actions = {
	default: async ({ request, platform, params }) => {
		const user = await requireLogin();
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(request, arktype(blogFormSchema), { allowFiles: true });
		if (!form.valid) {
			return fail(400, { form });
		}

		const oldId = params.id;
		const { id: newId, title, description, content, published, thumbnail } = form.data;

		if (!oldId) {
			return fail(400, { message: 'ID is required' });
		}

		const { db: d1, kv } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		// Check for ID collision if changed
		if (newId && newId !== oldId) {
			const existingNew = (await db.select().from(blog).where(eq(blog.id, newId))).at(0);
			if (existingNew) {
				return fail(400, { form, message: 'ID already exists' });
			}
		}

		const { thumbnailId, thumbnailKvId } = await uploadThumbnail(thumbnail, kv);

		const existing = (await db.select().from(blog).where(eq(blog.id, oldId))).at(0);

		// Prepare update object
		const updateData: {
			id?: string;
			title: string;
			description: string | null;
			content?: string | null;
			published: boolean | null;
			thumbnail?: string;
			updatedAt: Date;
			publishedAt?: Date;
		} = {
			title,
			description: description || null,
			content: content || null,
			published: published || false,
			updatedAt: new Date()
		};

		if (newId && newId !== oldId) {
			updateData.id = newId;
		}

		if (thumbnailId) {
			updateData.thumbnail = thumbnailId;
		}

		if (existing) {
			if (published && !existing.publishedAt) {
				updateData.publishedAt = new Date();
			}
		}

		const batch: BatchItem<'sqlite'>[] = [];

		if (thumbnailId && thumbnailKvId) {
			batch.push(
				db.insert(image).values({
					id: thumbnailId,
					kv_id: thumbnailKvId
				})
			);
		}

		batch.push(db.update(blog).set(updateData).where(eq(blog.id, oldId)));

		await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

		throw redirect(303, newId && newId !== oldId ? `/dashboard/blog` : '/dashboard/blog');
	}
};
