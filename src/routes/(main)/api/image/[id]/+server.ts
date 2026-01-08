import { generateDB } from '$lib/server/db';
import type { RequestHandler } from './$types';
import { image as images } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requirePlatformForLoad } from '$lib/server/platform';

export const GET: RequestHandler = async ({ params, platform }) => {
	const { db: d1, kv } = requirePlatformForLoad(platform);
	const id = params.id;
	const db = generateDB(d1);
	const image_data = await db.select({ kv_id: images.kv_id }).from(images).where(eq(images.id, id));
	if (!image_data[0]) {
		return new Response('Image not found', { status: 404 });
	}
	const data = image_data[0].kv_id;
	const image = await kv.getWithMetadata<{
		contentType: string;
	}>(data, {
		type: 'arrayBuffer'
	});
	if (!image) {
		return new Response('Image not found', { status: 404 });
	}
	return new Response(image.value, {
		headers: {
			'Content-Type': image.metadata?.contentType || 'image/jpeg',
			'Content-Length': image.value?.byteLength?.toString() || '0',
			'Cache-Control': 'public, max-age=31536000'
		}
	});
};
