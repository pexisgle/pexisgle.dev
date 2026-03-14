/**
 * Build-time content reader.
 * Uses Node.js fs/promises and gray-matter to read content from the repository.
 * This module is ONLY called during `vite build` (inside prerendered load functions).
 * It is never executed in the Cloudflare runtime.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import type { WorkType } from './types/work';

const CONTENT_DIR = 'content';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlogPost {
	id: string;
	title: string;
	description: string | null;
	thumbnail: string | null;
	published: boolean;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	content: string;
}

export interface WorkUrl {
	id: string;
	title: string;
	url: string;
}

export interface Work {
	id: string;
	title: string;
	description: string | null;
	thumbnail: string | null;
	type: WorkType;
	creationPeriod: string | null;
	article: string | null;
	createdAt: string;
	updatedAt: string;
	urls: WorkUrl[];
}

export interface SNS {
	id: string;
	name: string;
	icon: string;
	url: string;
	color: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Skill {
	id: string;
	name: string;
	icon: string;
	confidence: number;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Certification {
	id: string;
	name: string;
	date: string | null;
	status: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Award {
	id: string;
	name: string;
	date: string | null;
	status: 'Gold' | 'Silver' | 'Bronze' | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
	const dir = join(CONTENT_DIR, 'blog');
	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		return [];
	}
	const mdFiles = files.filter((f) => f.endsWith('.md'));
	const posts = await Promise.all(mdFiles.map((f) => parseBlogFile(join(dir, f))));
	return posts
		.filter((p) => p !== null)
		.sort(
			(a, b) =>
				new Date(b.publishedAt || b.createdAt).getTime() -
				new Date(a.publishedAt || a.createdAt).getTime()
		);
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
	const filePath = join(CONTENT_DIR, 'blog', `${id}.md`);
	return parseBlogFile(filePath);
}

async function parseBlogFile(filePath: string): Promise<BlogPost | null> {
	let raw: string;
	try {
		raw = await readFile(filePath, 'utf-8');
	} catch {
		return null;
	}
	const { data, content } = matter(raw);
	if (!data.title) return null;
	const id = basename(filePath, '.md');
	return {
		id: String(id),
		title: String(data.title),
		description: data.description ? String(data.description) : null,
		thumbnail: data.thumbnail ? String(data.thumbnail) : null,
		published: Boolean(data.published ?? false),
		publishedAt: data.publishedAt ? String(data.publishedAt) : null,
		createdAt: String(data.createdAt ?? new Date().toISOString()),
		updatedAt: String(data.updatedAt ?? new Date().toISOString()),
		content: content.trim()
	};
}

// ─── Works ────────────────────────────────────────────────────────────────────

export async function getWorks(): Promise<Work[]> {
	const dir = join(CONTENT_DIR, 'works');
	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		return [];
	}
	const jsonFiles = files.filter((f) => f.endsWith('.json'));
	const works = await Promise.all(jsonFiles.map((f) => parseWorkFile(join(dir, f))));
	return works
		.filter((w) => w !== null)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getWork(id: string): Promise<Work | null> {
	return parseWorkFile(join(CONTENT_DIR, 'works', `${id}.json`));
}

async function parseWorkFile(filePath: string): Promise<Work | null> {
	let raw: string;
	try {
		raw = await readFile(filePath, 'utf-8');
	} catch {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as Omit<Work, 'id'> & Partial<Work>;
		const id = basename(filePath, '.json');
		return {
			id: String(id),
			title: String(parsed.title),
			description: parsed.description ?? null,
			thumbnail: parsed.thumbnail ?? null,
			type: parsed.type as WorkType,
			creationPeriod: parsed.creationPeriod ?? null,
			article: parsed.article ?? null,
			createdAt: String(parsed.createdAt ?? new Date().toISOString()),
			updatedAt: String(parsed.updatedAt ?? new Date().toISOString()),
			urls: parsed.urls ?? []
		};
	} catch {
		return null;
	}
}

// ─── Data files ───────────────────────────────────────────────────────────────

async function readDataFile<T>(filename: string): Promise<T[]> {
	const filePath = join(CONTENT_DIR, 'data', filename);
	let raw: string;
	try {
		raw = await readFile(filePath, 'utf-8');
	} catch {
		return [];
	}
	try {
		return JSON.parse(raw) as T[];
	} catch {
		return [];
	}
}

export async function getSNS(): Promise<SNS[]> {
	const list = await readDataFile<SNS>('sns.json');
	return list.sort((a, b) => a.order - b.order);
}

export async function getSkills(): Promise<Skill[]> {
	const list = await readDataFile<Skill>('skills.json');
	return list.sort((a, b) => a.order - b.order);
}

export async function getCertifications(): Promise<Certification[]> {
	const list = await readDataFile<Certification>('certifications.json');
	return list.sort((a, b) => a.order - b.order);
}

export async function getAwards(): Promise<Award[]> {
	const list = await readDataFile<Award>('awards.json');
	return list.sort((a, b) => a.order - b.order);
}
