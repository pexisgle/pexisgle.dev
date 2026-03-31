/**
 * Client-side GitHub Contents API wrapper.
 * All functions accept a `token` parameter (the GitHub OAuth access token)
 * and use PUBLIC env vars for owner/repo.
 */

import typia from 'typia';
import { PUBLIC_GITHUB_OWNER, PUBLIC_GITHUB_REPO } from '$env/static/public';
import { encode } from '@jsquash/webp';
import resize, { initResize } from '@jsquash/resize';
import matter from 'gray-matter';
import { octokitWithToken } from '$lib/dashboard/auth';

const COMMITTER = { name: 'pexisgle-dashboard', email: 'bot@pexisgle.dev' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHFileResponse {
	sha: string;
	content: string; // base64 encoded
	encoding: string;
}

// ─── Core file operations ─────────────────────────────────────────────────────

/** Get a file's content and SHA from the repo. Returns null if not found. */
export async function ghGetFile(token: string, path: string): Promise<GHFileResponse | null> {
	const octokit = octokitWithToken(token);
	const { data } = await octokit.rest.repos.getContent({
		owner: PUBLIC_GITHUB_OWNER,
		repo: PUBLIC_GITHUB_REPO,
		path
	});
	if (!data || Array.isArray(data)) return null;
	if (data.type !== 'file') return null;
	return {
		sha: data.sha,
		content: data.content,
		encoding: data.encoding
	};
}

/** Internal: create or update a file with already base64-encoded content. */
async function ghPutRawFile(
	token: string,
	path: string,
	content: string,
	message: string,
	sha?: string
): Promise<void> {
	const octokit = octokitWithToken(token);
	await octokit.rest.repos.createOrUpdateFileContents({
		owner: PUBLIC_GITHUB_OWNER,
		repo: PUBLIC_GITHUB_REPO,
		path,
		message,
		committer: COMMITTER,
		content,
		sha
	});
}

/** Create or update a text file in the repo. Pass `sha` when updating. */
export async function ghPutFile(
	token: string,
	path: string,
	textContent: string,
	message: string,
	sha?: string
): Promise<void> {
	const content = Buffer.from(textContent).toString('base64');
	return ghPutRawFile(token, path, content, message, sha);
}

/** Put a binary file (ArrayBuffer) in the repo. */
export async function ghPutBinaryFile(
	token: string,
	path: string,
	buffer: ArrayBuffer,
	message: string,
	sha?: string
): Promise<void> {
	const content = Buffer.from(buffer).toString('base64');
	return ghPutRawFile(token, path, content, message, sha);
}

/** Delete a file from the repo. */
export async function ghDeleteFile(
	token: string,
	path: string,
	sha: string,
	message: string
): Promise<void> {
	const octokit = octokitWithToken(token);
	await octokit.rest.repos.deleteFile({
		owner: PUBLIC_GITHUB_OWNER,
		repo: PUBLIC_GITHUB_REPO,
		path,
		message,
		committer: COMMITTER,
		sha
	});
}

/** List files in a directory. Returns [] if directory doesn't exist or is empty. */
export async function ghListFiles(
	token: string,
	dir: string
): Promise<{ name: string; sha: string; path: string }[]> {
	const octokit = octokitWithToken(token);
	const { data } = await octokit.rest.repos.getContent({
		owner: PUBLIC_GITHUB_OWNER,
		repo: PUBLIC_GITHUB_REPO,
		path: dir
	});
	if (!Array.isArray(data)) return [];
	return data
		.filter((item) => item.type === 'file')
		.map((item) => ({ name: item.name, sha: item.sha, path: item.path }));
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
export async function ghReadJsonData(
	token: string,
	filename: string,
	defaultValue: object
): Promise<{ data: object; sha: string | null }> {
	const path = `content/data/${filename}`;
	const file = await ghGetFile(token, path);
	if (!file) return { data: defaultValue, sha: null };
	try {
		const bytes = new Uint8Array(Buffer.from(file.content, 'base64'));
		const decoded = new TextDecoder().decode(bytes);
		const parsed = JSON.parse(decoded);
		return { data: parsed, sha: file.sha };
	} catch {
		return { data: defaultValue, sha: file.sha };
	}
}

/** Write a JSON data file to content/data/. */
export async function ghWriteJsonData(
	token: string,
	filename: string,
	data: object,
	sha: string | null,
	message: string
): Promise<void> {
	const path = `content/data/${filename}`;
	return ghPutFile(token, path, JSON.stringify(data, null, '\t') + '\n', message, sha ?? undefined);
}

// ─── Blog Markdown helpers ─────────────────────────────────────────────────────

export interface BlogFileData {
	id: string;
	title: string;
	description?: string;
	thumbnail?: string;
	published?: boolean;
	publishedAt?: string;
	createdAt: string;
	updatedAt: string;
	content?: string;
}

/** Serialize blog data to a Markdown file with YAML frontmatter. */
export function serializeBlog(blog: BlogFileData): string {
	const { content, ...frontmatterData } = blog;
	const frontmatter = matter.stringify(content ?? '', frontmatterData);
	return frontmatter;
}

/** Read and parse a single blog `.md` file. */
export async function ghGetBlog(
	token: string,
	id: string
): Promise<{ data: BlogFileData; sha: string } | null> {
	const path = `content/blog/${id}.md`;
	const file = await ghGetFile(token, path);
	if (!file) return null;
	const bytes = Buffer.from(file.content, 'base64');
	const decoded = new TextDecoder().decode(bytes);
	const { data, content } = matter(decoded);
	const validation = typia.validate<BlogFileData>({ ...data, content });
	if (!validation.success) {
		return null;
	}
	return { data: validation.data, sha: file.sha };
}

// ─── Work JSON helpers ─────────────────────────────────────────────────────────

export interface WorkUrl {
	id: string;
	title: string;
	url: string;
}

export interface WorkFileData {
	id: string;
	title: string;
	description?: string;
	thumbnail?: string;
	type: string;
	creationPeriod?: string;
	article?: string;
	createdAt: string;
	updatedAt: string;
	urls: WorkUrl[];
}

/** Read a single work file from content/works/. */
export async function ghGetWork(
	token: string,
	id: string
): Promise<{ data: WorkFileData; sha: string } | null> {
	const path = `content/works/${id}.md`;
	const file = await ghGetFile(token, path);
	if (!file) return null;
	try {
		const bytes = Buffer.from(file.content, 'base64');
		const decoded = bytes.toString('utf-8');
		const { data: frontmatter, content } = matter(decoded);

		// Parse YAML front matter into WorkFileData
		const parsed = {
			id: id,
			title: String(frontmatter.title ?? ''),
			description: frontmatter.description ? String(frontmatter.description) : null,
			thumbnail: frontmatter.thumbnail ? String(frontmatter.thumbnail) : null,
			type: String(frontmatter.type ?? 'creation'),
			creationPeriod: frontmatter.creationPeriod ? String(frontmatter.creationPeriod) : null,
			article: content.trim() || null,
			createdAt: String(frontmatter.createdAt ?? new Date().toISOString()),
			updatedAt: String(frontmatter.updatedAt ?? new Date().toISOString()),
			urls: Array.isArray(frontmatter.urls)
				? frontmatter.urls.map((u: Record<string, unknown>) => ({
						id: String(u.id),
						title: String(u.title),
						url: String(u.url)
					}))
				: []
		};

		const validation = typia.validate<WorkFileData>(parsed);
		if (!validation.success) {
			return null;
		}
		return { data: validation.data, sha: file.sha };
	} catch {
		return null;
	}
}

/** Write a single work file to content/works/. */
export async function ghPutWork(token: string, work: WorkFileData, sha?: string): Promise<void> {
	const path = `content/works/${work.id}.md`;

	// Convert Work object to Markdown+YAML format
	const frontmatter: Record<string, unknown> = {
		title: work.title,
		...(work.description && { description: work.description }),
		...(work.thumbnail && { thumbnail: work.thumbnail }),
		type: work.type,
		...(work.creationPeriod && { creationPeriod: work.creationPeriod }),
		createdAt: work.createdAt,
		updatedAt: work.updatedAt,
		...(work.urls.length > 0 && {
			urls: work.urls.map((u) => ({
				id: u.id,
				title: u.title,
				url: u.url
			}))
		})
	};

	const markdown = matter.stringify(work.article || '', frontmatter);

	return ghPutFile(token, path, markdown, `${sha ? 'update' : 'create'} work: ${work.id}`, sha);
}

// ─── GitHub Actions ────────────────────────────────────────────────────────────

/** Trigger a workflow_dispatch event for a workflow file (e.g. "deploy.yml"). */
export async function ghTriggerWorkflow(
	token: string,
	workflow: string,
	ref = 'main'
): Promise<void> {
	const octokit = octokitWithToken(token);
	await octokit.rest.actions.createWorkflowDispatch({
		owner: PUBLIC_GITHUB_OWNER,
		repo: PUBLIC_GITHUB_REPO,
		workflow_id: workflow,
		ref
	});
}
