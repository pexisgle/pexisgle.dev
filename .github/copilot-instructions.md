# Pexisgle Copilot Guide

## Stack & Architecture

**Platform**: SvelteKit 5 (Runes mode) on Cloudflare Workers with D1 (SQLite), KV storage, and Bun tooling.

**Two-realm routing**:

- `(main)`: Public portfolio site with GSAP smooth scrolling, View Transitions, custom SASS styling (no Tailwind)
- `(dashboard)`: Admin UI with Flowbite-Svelte components, Tailwind utilities, nested auth layers

**Data flow**: Client ??? SvelteKit form actions ??? Platform guard ??? Drizzle ORM ??? D1/KV ??? Response

## Critical Patterns (Use These!)

### Platform Bindings (ALWAYS Required)

Never access `platform?.env` directly???use guard functions from [src/lib/server/platform.ts](src/lib/server/platform.ts):

```ts
// In load functions (throws error())
const d1 = requireDatabaseForLoad(platform);
const { db, kv } = requirePlatformForLoad(platform);

// In form actions (throws fail())
const d1 = requireDatabaseForActions(platform);
const { db, kv } = requirePlatformForActions(platform);
```

Bindings: `pexisgle_dev_db` (D1) and `pexisgle_dev_kv` (KV). Then wrap D1 with `generateDB(d1)` for Drizzle queries.

### Auth & Authorization

Session-based with GitHub OAuth (Arctic), sha256-hashed tokens in D1, 30-day expiry with auto-renewal.

**Protect routes** (use [src/lib/server/auth/index.ts](src/lib/server/auth/index.ts)):

```ts
// Layout: throw redirect if not logged in
const user = await requireLogin();

// Nested layout: check role from parent
const { user } = await parent();
if (!roleIsOver('admin', user.role)) error(403);

// Action: check role before mutation
const user = await requireLogin();
if (!roleIsOver('admin', user.role)) return fail(403);
```

Role hierarchy: `none` (0) < `user` (1) < `admin` (2) < `owner` (3). Use `roleIsOver(baseRole, targetRole)` for checks.

**OAuth flow**: `/dashboard/signin/github` ??? GitHub ??? `/callback` ??? upsert user (unique `githubId`) ??? create session ??? set cookie ??? redirect `/dashboard`.

### Database (Drizzle + D1)

Schema: [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts) (user, session, blog, work, urls, sns, skill, certification, award, image).

**Key constraints**:

- D1 lacks `.returning()` ??? pre-generate UUIDs with `uuidv4()` before insert
- No `db.transaction()` ??? use `db.batch()` for atomic multi-step writes (e.g., image + blog insert)
- Always index columns used in `.where()` and `.orderBy()` clauses

```ts
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();
await db.insert(blog).values({ id, title: 'Post' });
```

### File Storage (KV)

Files go to KV via [src/lib/server/storage/thumbnail.ts](src/lib/server/storage/thumbnail.ts):

```ts
const { thumbnailId, thumbnailKvId } = await uploadThumbnail(file, kv);
// thumbnailId ??? insert into image table
// thumbnailKvId ??? stored in KV
```

Public fetch: [/api/image/[id]/+server.ts](<src/routes/(main)/api/image/[id]/+server.ts>) looks up KV id from D1 `image` table, streams from KV with cache headers.

### Forms (Superforms + Arktype)

Schemas: [src/lib/server/form-schemas.ts](src/lib/server/form-schemas.ts). Mix drizzle-arktype (`createInsertSchema`) + custom arktype validators.

**Server**:

```ts
import { superValidate, fail, message } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { blogFormSchema } from '$lib/server/form-schemas';

// Load
const form = await superValidate(arktype(blogFormSchema));

// Action
const form = await superValidate(request, arktype(blogFormSchema));
if (!form.valid) return fail(400, { form });
// ... mutation
return message(form, 'Saved!');
```

**Client** (Svelte 5 runes):

```svelte
<script>
	const { form, errors, enhance } = superForm(data.form);
</script>

<form method="POST" use:enhance>
	<input bind:value={$form.title} />
	{#if $errors.title}<span>{$errors.title}</span>{/if}
</form>
```

**Multiple forms on one page**: Each needs its own schema and form instance with unique `id` option. See examples in admin CRUD pages.

## Developer Workflows

**Local dev**:

```bash
bun run dev                    # Start Vite dev server
bun run db:migrate             # Apply migrations locally
bun run db:studio              # Drizzle Studio on local DB
```

**DB management**:

```bash
bun run db:generate            # Generate migration from schema changes
bun run db:push                # Push schema directly to remote D1
bun run db:migrate:prod        # Apply migrations to production D1
bun run db:studio:prod         # Studio on remote D1
```

**Deploy**:

```bash
bun run deploy                 # Build + wrangler deploy
bun run preview                # Build + local wrangler dev
bun run cf-typegen             # Regenerate worker types after binding changes
```

**Quality checks**:

```bash
bun run format                 # Prettier (auto-fix)
bun run check                  # Svelte type checking
bun run lint                   # ESLint + Prettier check
```

No formal test suite???validation via `check` + `lint`. Local DB uses `better-sqlite3`; prod uses `d1-http` driver (configured in [drizzle.config.ts](drizzle.config.ts) via `LOCAL_DB_PATH` env var).

## Conventions & Gotchas

- **Svelte 5 Runes**: Use `$state()`, `$derived()`, `$props()`, `onclick` (not `on:click`), snippets (not slots). Never destructure reactive objects.
- **UI split**: Flowbite + Tailwind in `(dashboard)` only; `(main)` uses custom SASS ([src/routes/(main)/layout.sass](<src/routes/(main)/layout.sass>), [src/lib/variables.sass](src/lib/variables.sass)).
- **Session renewal**: Auto-extends sessions <15 days from expiry in `validateSessionToken`. Don't break this logic.
- **Admin actions**: Always `fail(403)` for unauthorized, never `redirect()` in actions. Use `error(403)` in layouts.
- **Enum alignment**: Keep role/work type enums synced between [src/lib/types/role.ts](src/lib/types/role.ts), [src/lib/types/work.ts](src/lib/types/work.ts), and DB schema.

## Reference Files

- Auth: [src/lib/server/auth/index.ts](src/lib/server/auth/index.ts)
- DB: [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts), [src/lib/server/db/index.ts](src/lib/server/db/index.ts)
- Platform: [src/lib/server/platform.ts](src/lib/server/platform.ts)
- Forms: [src/lib/server/form-schemas.ts](src/lib/server/form-schemas.ts)
- Storage: [src/lib/server/storage/thumbnail.ts](src/lib/server/storage/thumbnail.ts)
- Types: [src/lib/types/role.ts](src/lib/types/role.ts), [src/lib/types/work.ts](src/lib/types/work.ts)

```

```
