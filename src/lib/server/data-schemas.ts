import { type } from 'arktype';

export const skillDataSchema = type({
	name: 'string >= 1',
	icon: 'string >= 1',
	confidence: '1 <= number <= 5',
	order: 'number >= 0'
});

export const skillListSchema = skillDataSchema.array();

export const awardDataSchema = type({
	name: 'string >= 1',
	date: 'string?',
	status: "'Gold' | 'Silver' | 'Bronze' | null",
	order: 'number >= 0'
});

export const awardListSchema = awardDataSchema.array();

export const certificationDataSchema = type({
	name: 'string >= 1',
	date: 'string?',
	status: 'string?',
	order: 'number >= 0'
});

export const certificationListSchema = certificationDataSchema.array();

export const snsDataSchema = type({
	name: 'string >= 1',
	icon: 'string >= 1',
	url: 'string >= 1',
	color: 'string >= 1',
	order: 'number >= 0'
});

export const snsListSchema = snsDataSchema.array();

export const urlDataSchema = type({
	title: 'string >= 1',
	url: 'string >= 1'
});

export const workDataSchema = type({
	title: 'string >= 1',
	description: 'string?',
	type: "'creation' | 'program' | 'contest' | 'other'",
	creationPeriod: 'string?',
	article: 'string?',
	urls: urlDataSchema.array()
});

export const workListSchema = workDataSchema.array();

export const reorderDataSchema = type([{ id: 'string', order: 'number' }]);

export const blogDataSchema = type({
	title: 'string >= 1',
	description: 'string?',
	content: 'string?',
	published: 'boolean?',
	publishedAt: 'string?'
});

export const blogListSchema = blogDataSchema.array();
