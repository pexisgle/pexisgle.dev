/**
 * Client-side GitHub Contents API wrapper.
 * All functions accept a `token` parameter (the GitHub OAuth access token)
 * and use PUBLIC env vars for owner/repo.
 */
import { PUBLIC_GITHUB_OWNER, PUBLIC_GITHUB_REPO } from '$env/static/public';
import { encode } from '@jsquash/webp';
import resize, { initResize } from '@jsquash/resize';

const GITHUB_API = 'https://api.github.com';
const COMMITTER = { name: 'pexisgle-dashboard', email: 'bot@pexisgle.dev' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHFileResponse {
	sha: string;
	content: string; // base64 encoded
	encoding: string;
}

// ─── Core file operations ─────────────────────────────────────────────────────

function ghHeaders(token: string) {
	return {
		Authorization: `token ${token}`,
		Accept: 'application/vnd.github.v3+json',
		'Content-Type': 'application/json',
		'User-Agent': 'pexisgle-dashboard/1.0'
	};
}

/** Get a file's content and SHA from the repo. Returns null if not found. */
export async function ghGetFile(token: string, path: string): Promise<GHFileResponse | null> {
	const url = `${GITHUB_API}/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}/contents/${path}`;
	const res = await fetch(url, { headers: ghHeaders(token) });
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
	return res.json() as Promise<GHFileResponse>;
}

/** Create or update a text file in the repo. Pass `sha` when updating. */
export async function ghPutFile(
	token: string,
	path: string,
	textContent: string,
	message: string,
	sha?: string
): Promise<void> {
	const url = `${GITHUB_API}/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}/contents/${path}`;
	const body: Record<string, unknown> = {
		message,
		committer: COMMITTER,
		content: btoa(unescape(encodeURIComponent(textContent)))
	};
	if (sha) body.sha = sha;
	const res = await fetch(url, {
		method: 'PUT',
		headers: ghHeaders(token),
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
}

/** Put a binary file (ArrayBuffer) in the repo. */
export async function ghPutBinaryFile(
	token: string,
	path: string,
	buffer: ArrayBuffer,
	message: string,
	sha?: string
): Promise<void> {
	const url = `${GITHUB_API}/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}/contents/${path}`;
	const uint8 = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < uint8.length; i++) {
		binary += String.fromCharCode(uint8[i]);
	}
	const base64 = btoa(binary);
	const body: Record<string, unknown> = { message, committer: COMMITTER, content: base64 };
	if (sha) body.sha = sha;
	const res = await fetch(url, {
		method: 'PUT',
		headers: ghHeaders(token),
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
}

/** Delete a file from the repo. */
export async function ghDeleteFile(
	token: string,
	path: string,
	sha: string,
	message: string
): Promise<void> {
	const url = `${GITHUB_API}/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}/contents/${path}`;
	const body = { message, committer: COMMITTER, sha };
	const res = await fetch(url, {
		method: 'DELETE',
		headers: ghHeaders(token),
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`GitHub DELETE ${path} failed: ${res.status} ${await res.text()}`);
}

/** List files in a directory. Returns [] if directory doesn't exist or is empty. */
export async function ghListFiles(
	token: string,
	dir: string
): Promise<{ name: string; sha: string; path: string }[]> {
	const url = `${GITHUB_API}/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}/contents/${dir}`;
	const res = await fetch(url, { headers: ghHeaders(token) });
	if (res.status === 404) return [];
	if (!res.ok) return [];
	const items = (await res.json()) as { name: string; sha: string; path: string; type: string }[];
	return items.filter((i) => i.type === 'file');
}

// ─── Image upload ──────────────────────────────────────────────────────────────

const MAX_IMAGE_WIDTH = 1200;

/**
 * Convert an uploaded image to WebP, resize to max 1200px wide,
 * and commit to `static/images/{uuid}.webp`. Returns the filename.
 */
export async function ghUploadImage(
	token: string,
	uuid: string,
	buffer: ArrayBuffer
): Promise<string> {
	const webpBuffer = await convertToWebP(buffer);
	const filename = `${uuid}.webp`;
	const path = `static/images/${filename}`;
	const existing = await ghGetFile(token, path);
	await ghPutBinaryFile(token, path, webpBuffer, `upload image: ${filename}`, existing?.sha);
	return filename;
}

async function convertToWebP(buffer: ArrayBuffer): Promise<ArrayBuffer> {
	const blob = new Blob([buffer]);
	const bitmap = await createImageBitmap(blob);

	let width = bitmap.width;
	let height = bitmap.height;

	if (width > MAX_IMAGE_WIDTH) {
		height = Math.round((height * MAX_IMAGE_WIDTH) / width);
		width = MAX_IMAGE_WIDTH;
	}

	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0, width, height);
	const imageData = ctx.getImageData(0, 0, width, height);
	bitmap.close();

	await initResize();
	const resizedData = await resize(imageData, { width, height });
	return await encode(resizedData);
}

// ─── JSON data helpers ─────────────────────────────────────────────────────────

/** Read a JSON data file from content/data/. Returns parsed value or default. */
export async function ghReadJsonData<T>(
	token: string,
	filename: string,
	defaultValue: T
): Promise<{ data: T; sha: string | null }> {
	const path = `content/data/${filename}`;
	const file = await ghGetFile(token, path);
	if (!file) return { data: defaultValue, sha: null };
	try {
		const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
		return { data: JSON.parse(decoded) as T, sha: file.sha };
	} catch {
		return { data: defaultValue, sha: file.sha };
	}
}

/** Write a JSON data file to content/data/. */
export async function ghWriteJsonData<T>(
	token: string,
	filename: string,
	data: T,
	sha: string | null,
	message: string
): Promise<void> {
	const path = `content/data/${filename}`;
	return ghPutFile(token, path, JSON.stringify(data, null, 2) + '\n', message, sha ?? undefined);
}

// ─── Blog Markdown helpers ─────────────────────────────────────────────────────

export interface BlogFileData {
	id: string;
	title: string;
	description?: string | null;
	thumbnail?: string | null;
	published?: boolean;
	publishedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	content?: string;
}

/** Serialize blog data to a Markdown file with YAML frontmatter. */
export function serializeBlog(blog: BlogFileData): string {
	const { content = '', ...fm } = blog;
	// omit `id` from frontmatter — id is derived from filename
	const frontmatter = Object.entries(fm)
		.filter(([, v]) => v !== null && v !== undefined)
		.map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`)
		.join('\n');
	return `---\n${frontmatter}\n---\n${content}`;
}

/** Read and parse a single blog `.md` file. */
export async function ghGetBlog(
	token: string,
	id: string
): Promise<{ data: BlogFileData; sha: string } | null> {
	const path = `content/blog/${id}.md`;
	const file = await ghGetFile(token, path);
	if (!file) return null;
	try {
		const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
		const match = decoded.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
		if (!match) return null;
		const data: Record<string, unknown> = {};
		for (const line of match[1].split('\n')) {
			const colon = line.indexOf(':');
			if (colon < 0) continue;
			const key = line.slice(0, colon).trim();
			const raw = line.slice(colon + 1).trim();
			try {
				data[key] = JSON.parse(raw);
			} catch {
				data[key] = raw;
			}
		}
		data.content = match[2].trim();
		// ensure id is derived from filename, not frontmatter
		(data as Record<string, unknown>).id = id;
		return { data: data as unknown as BlogFileData, sha: file.sha };
	} catch {
		return null;
	}
}

// ─── Work JSON helpers ─────────────────────────────────────────────────────────

export interface WorkFileData {
	id: string;
	title: string;
	description?: string | null;
	thumbnail?: string | null;
	type: string;
	creationPeriod?: string | null;
	article?: string | null;
	createdAt: string;
	updatedAt: string;
	urls: { id: string; title: string; url: string }[];
}

/** Read a single work file from content/works/. */
export async function ghGetWork(
	token: string,
	id: string
): Promise<{ data: WorkFileData; sha: string } | null> {
	const path = `content/works/${id}.json`;
	const file = await ghGetFile(token, path);
	if (!file) return null;
	try {
		const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
		const parsed = JSON.parse(decoded) as WorkFileData;
		// ensure id comes from filename
		parsed.id = id;
		return { data: parsed, sha: file.sha };
	} catch {
		return null;
	}
}

/** Write a single work file to content/works/. */
export async function ghPutWork(token: string, work: WorkFileData, sha?: string): Promise<void> {
	const path = `content/works/${work.id}.json`;
	// omit `id` from stored JSON — id is encoded in the filename
	const { ...payload } = work;
	return ghPutFile(
		token,
		path,
		JSON.stringify(payload, null, 2) + '\n',
		`${sha ? 'update' : 'create'} work: ${work.id}`,
		sha
	);
}

// ─── GitHub Actions ────────────────────────────────────────────────────────────

/** Trigger a workflow_dispatch event for a workflow file (e.g. "deploy.yml"). */
export async function ghTriggerWorkflow(
	token: string,
	workflow: string,
	ref = 'main'
): Promise<void> {
	const url = `${GITHUB_API}/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}/actions/workflows/${workflow}/dispatches`;
	const res = await fetch(url, {
		method: 'POST',
		headers: ghHeaders(token),
		body: JSON.stringify({ ref })
	});
	if (!res.ok) throw new Error(`GitHub Actions trigger failed: ${res.status} ${await res.text()}`);
}
