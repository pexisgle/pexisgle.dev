import { type } from 'arktype';
import { createInsertSchema } from 'drizzle-arktype';
import { blog, work } from '$lib/server/db/schema';
// Blog Schema
export const blogSchema = createInsertSchema(blog);

// Schema for form submission including file
export const blogFormSchema = type({
	id: 'string?',
	title: 'string >= 1',
	description: 'string?',
	content: 'string',
	published: 'boolean?',
	thumbnail: 'File | null | undefined'
});

// Work Schema
export const workSchema = createInsertSchema(work);

export const workFormSchema = type({
	id: 'string?', // For edit mode
	title: 'string >= 1',
	description: 'string?',
	creationPeriod: 'string?',
	article: 'string',
	type: "'creation' | 'program' | 'contest' | 'other'",
	urls: 'string?', // JSON string,
	thumbnail: 'File | null | undefined'
});

// User Settings Schema
export const userSettingsSchema = type({
	displayName: 'string?',
	avatar: 'File | null | undefined'
});

// SNS Schema
export const snsFormSchema = type({
	id: 'string?',
	name: 'string >= 1',
	icon: 'string >= 1',
	url: 'string >= 1',
	color: 'string >= 1',
	order: 'number >= 0'
});

// Skill Schema
export const skillFormSchema = type({
	id: 'string?',
	name: 'string >= 1',
	icon: 'string >= 1',
	confidence: 'number',
	order: 'number >= 0'
});

// Certification Schema
export const certificationFormSchema = type({
	id: 'string?',
	name: 'string >= 1',
	date: 'string?',
	status: 'string?',
	order: 'number >= 0'
});

// Award Schema
export const awardFormSchema = type({
	id: 'string?',
	name: 'string >= 1',
	date: 'string?',
	status: 'string?',
	order: 'number >= 0'
});

// Delete Schema (for award, certification, sns, skill)
export const deleteFormSchema = type({
	id: 'string >= 1'
});

// Import Schema (for award, certification, sns, skill)
export const importFormSchema = type({
	file: 'File'
});
