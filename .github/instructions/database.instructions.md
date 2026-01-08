---
applyTo: '**/.ts'
---

Drizzle ORM for Cloudflare D1 (SQLite) with type-safe, SQL-like queries. Always use `generateDB()` helper from [src/lib/server/db/index.ts](src/lib/server/db/index.ts) with D1 binding from platform. Schema in [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts). Use `db.batch()` for transactions (D1 doesn't support `db.transaction()`). Pre-generate IDs with `uuidv4()` before insert (D1 lacks `.returning()` support).

## Database Initialization

**Helper function**: `generateDB(db: D1Database)` wraps Cloudflare D1 binding in Drizzle instance. Throws error if binding undefined—always call `requireDatabaseForLoad(platform)` or `requireDatabaseForActions(platform)` from [src/lib/server/platform.ts](src/lib/server/platform.ts) before invoking. Pattern:

```typescript
const d1 = requireDatabaseForLoad(platform); // or requireDatabaseForActions
const db = generateDB(d1);
```

Never access `platform?.env?.pexisgle_db` directly—use require helpers to fail fast with clear error.

## Schema Definition

**Table declarations** in [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts) using `drizzle-orm/sqlite-core`:

```typescript
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull(),
	role: text('role', { enum: roles }).notNull().default('none'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});
```

**Column types**: `text()` for strings; `integer()` for numbers (use `{ mode: 'timestamp' }` for Date, `{ mode: 'boolean' }` for booleans). Constraints: `.primaryKey()`, `.notNull()`, `.default(value)`, `.references(() => table.column)` for foreign keys. Dynamic defaults: `.$defaultFn(() => uuidv4())`.

**Indexes**: Add as second argument to `sqliteTable`:

```typescript
export const blog = sqliteTable(
	'blog',
	{
		/* columns */
	},
	(table) => [
		index('blog_published_idx').on(table.published),
		index('blog_created_at_idx').on(table.createdAt)
	]
);
```

Index frequently queried/sorted columns for performance. Keep all schema definitions in single file.

## Query Operations

**SELECT**: Basic pattern `db.select().from(table)`. Add `.where()`, `.orderBy()`, `.limit()`, `.offset()` as needed. Use operators from `drizzle-orm`: `eq()`, `ne()`, `gt()`, `gte()`, `lt()`, `lte()`, `like()`, `and()`, `or()`.

```typescript
import { eq, desc, and, gt } from 'drizzle-orm';

// All rows
const users = await db.select().from(user);

// Filtered
const admins = await db.select().from(user).where(eq(user.role, 'admin'));

// Multiple conditions
const published = await db
	.select()
	.from(blog)
	.where(and(eq(blog.published, true), gt(blog.createdAt, new Date('2024-01-01'))));

// Sorted & paginated
const page = await db.select().from(blog).orderBy(desc(blog.createdAt)).limit(10).offset(20);
```

**INSERT**: Single or multiple rows via `.values()`. D1 doesn't support `.returning()`—generate IDs beforehand with `uuidv4()`.

```typescript
import { v4 as uuidv4 } from 'uuid';

const newId = uuidv4();
await db.insert(blog).values({ id: newId, title: 'Post' });

// Bulk insert
await db.insert(skill).values([
	{ id: uuidv4(), name: 'JavaScript', confidence: 90 },
	{ id: uuidv4(), name: 'TypeScript', confidence: 85 }
]);
```

**UPDATE**: Chain `.set()` and `.where()`. Always include where clause to avoid updating all rows.

```typescript
await db.update(user).set({ role: 'admin' }).where(eq(user.id, userId));
```

**DELETE**: Requires `.where()` clause. Use for cleanup (e.g., expired sessions).

```typescript
await db.delete(session).where(lt(session.expiresAt, new Date()));
```

**JOIN**: Use `.leftJoin()`, `.innerJoin()` with `eq()` for join condition. Specify columns in `.select()` to avoid ambiguity.

```typescript
const results = await db
	.select({
		postId: blog.id,
		title: blog.title,
		authorName: user.username
	})
	.from(blog)
	.leftJoin(user, eq(blog.authorId, user.id));
```

## Batch Operations (Transactions)

D1 doesn't support `db.transaction()`—use `db.batch()` instead. Push queries into array, then execute atomically (all commit or all rollback).

```typescript
import type { BatchItem } from 'drizzle-orm/batch';

const batch: BatchItem<'sqlite'>[] = [];

batch.push(db.insert(image).values({ id: thumbnailId, kv_id: thumbnailKvId }));

batch.push(db.insert(blog).values({ id: blogId, title: 'My Blog', thumbnail: thumbnailId }));

await db.batch(batch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
```

**Type casting**: D1 batch requires non-empty tuple type; cast array with `as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]` to satisfy type checker.

**Use for multi-step writes**: Image upload + blog creation, work update + URL deletion, etc. Prefer batch over individual queries to ensure atomicity.

## Migrations

**Local dev**: Generate migration with `bun run drizzle-kit generate`. Apply with `bun run scripts/drizzle-local.ts migrate`. Inspect schema in Drizzle Studio: `bun run scripts/drizzle-local.ts studio`.

**Production**: Push directly to D1 with `bun run drizzle-kit migrate` or `bun run drizzle-kit push`. Config in [drizzle.config.ts](drizzle.config.ts)—uses `d1-http` driver for remote, `better-sqlite3` for local.

**Schema changes**: Edit [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts), generate migration, then apply. Keep all table definitions in single file for consistency.

## Validation Integration

**drizzle-arktype** in [src/lib/server/form-schemas.ts](src/lib/server/form-schemas.ts) generates schemas from Drizzle tables:

```typescript
import { createInsertSchema } from 'drizzle-arktype';
import { blog } from '$lib/server/db/schema';

export const blogSchema = createInsertSchema(blog);

// Extend with custom validation
export const blogFormSchema = type({
	id: 'string?',
	title: 'string >= 1',
	description: 'string?',
	published: 'boolean?',
	thumbnail: 'File?'
});
```

Use in superforms: `superValidate(request, arktype(blogFormSchema))`. Keep schemas aligned with DB enums from [src/lib/types/role.ts](src/lib/types/role.ts) and [src/lib/types/work.ts](src/lib/types/work.ts).

## Type Inference

**Leverage built-in types**: Use `.$inferSelect` and `.$inferInsert` instead of manually defining interfaces.

```typescript
type User = typeof user.$inferSelect;
type NewUser = typeof user.$inferInsert;
```

TypeScript auto-completes columns and validates types—no drift between schema and code.

## Common Patterns

**Session management**: Create with `generateSessionToken()`, store hashed ID in D1, validate with JOIN to fetch user. Delete expired sessions periodically with `lt(session.expiresAt, new Date())`.

**Pagination**: Combine `.orderBy(desc(table.createdAt))`, `.limit(PAGE_SIZE)`, `.offset((page - 1) * PAGE_SIZE)` for standard pagination.

**Image upload**: Use `uploadThumbnail()` from [src/lib/server/storage/thumbnail.ts](src/lib/server/storage/thumbnail.ts) to get IDs, insert into `image` table, reference via foreign key in `blog`/`work` tables.

## Best Practices

- **Always guard bindings**: Call `requireDatabaseForLoad/Actions` before `generateDB()` to throw early if D1 undefined.
- **Pre-generate IDs**: D1 lacks `.returning()`—use `uuidv4()` before insert, store ID for subsequent references.
- **Prefer batch**: Group multi-step writes into single `db.batch()` for atomicity and reduced roundtrips.
- **Index strategically**: Add indexes on columns used in `.where()` and `.orderBy()` clauses; profile query performance.
- **Centralize schema**: Keep all tables, enums, indexes in [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts)—single source of truth.
- **Infer types**: Use `.$inferSelect`/`.$inferInsert` to auto-generate types from schema—avoid manual interfaces.

## D1 Limitations

- **No `.returning()`**: Can't fetch generated IDs from insert/update. Pre-generate IDs with `uuidv4()`.
- **No `db.transaction()`**: Use `db.batch()` for atomic multi-query operations.
- **Limited SQL features**: Some advanced SQLite features unavailable in D1; check Cloudflare docs for supported syntax.

## Reference

- Official docs: https://orm.drizzle.team/docs/overview
- SQLite/D1 guide: https://orm.drizzle.team/docs/get-started-sqlite
- Query API: https://orm.drizzle.team/docs/select
- Migrations: https://orm.drizzle.team/docs/migrations
