import { v4 as uuidv4 } from 'uuid';

export interface ThumbnailUploadResult {
	thumbnailId: string | null;
	thumbnailKvId: string | null;
}

export async function uploadThumbnail(
	thumbnail: File | null | undefined,
	kv: KVNamespace | undefined
): Promise<ThumbnailUploadResult> {
	if (!thumbnail || thumbnail.size === 0 || !kv) {
		return { thumbnailId: null, thumbnailKvId: null };
	}

	const thumbnailKvId = uuidv4();
	await kv.put(thumbnailKvId, await thumbnail.arrayBuffer(), {
		metadata: { contentType: thumbnail.type }
	});
	const thumbnailId = uuidv4();

	return { thumbnailId, thumbnailKvId };
}
