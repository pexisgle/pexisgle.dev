import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';
import { roles } from '../../types/role';
import { work_types } from '../../types/work';

// Re-export types from centralized modules
export type { Role } from '../../types/role';
export type { WorkType } from '../../types/work';
export { roles, work_types };

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	githubId: integer('github_id').unique().notNull(),
	username: text('username').notNull(),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	role: text('role', { enum: roles }).notNull().default('none')
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const image = sqliteTable('image', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	kv_id: text('kv_id').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const work = sqliteTable(
	'work',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description'),
		thumbnail: text('thumbnail').references(() => image.id),
		type: text('type', { enum: work_types }).notNull(),
		creationPeriod: text('creation_period'),
		article: text('article'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [
		index('work_type_idx').on(table.type),
		index('work_created_at_idx').on(table.createdAt)
	]
);

export const work_urls = sqliteTable('work_urls', {
	id: text('id').primaryKey(),
	workId: text('work_id')
		.notNull()
		.references(() => work.id),
	url: text('url').notNull(),
	title: text('title').notNull()
});

export const blog = sqliteTable(
	'blog',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		title: text('title').notNull(),
		description: text('description'),
		content: text('content'),
		thumbnail: text('thumbnail').references(() => image.id),
		published: integer('published', { mode: 'boolean' }).default(false),
		publishedAt: integer('published_at', { mode: 'timestamp' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [
		index('blog_published_idx').on(table.published),
		index('blog_created_at_idx').on(table.createdAt)
	]
);

export const sns = sqliteTable(
	'sns',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		name: text('name').notNull(),
		icon: text('icon').notNull(),
		url: text('url').notNull(),
		color: text('color').notNull(),
		order: integer('order').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [index('sns_order_idx').on(table.order)]
);

export const skill = sqliteTable(
	'skill',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		name: text('name').notNull(),
		icon: text('icon').notNull(),
		confidence: integer('confidence').notNull(),
		order: integer('order').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [index('skill_order_idx').on(table.order)]
);

export const certification = sqliteTable(
	'certification',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		name: text('name').notNull(),
		date: text('date'),
		status: text('status'),
		order: integer('order').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [index('certification_order_idx').on(table.order)]
);

export const award = sqliteTable(
	'award',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		name: text('name').notNull(),
		date: text('date'),
		status: text('status', { enum: ['Gold', 'Silver', 'Bronze'] }),
		order: integer('order').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [index('award_order_idx').on(table.order)]
);
