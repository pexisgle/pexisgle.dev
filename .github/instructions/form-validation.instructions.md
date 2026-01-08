---
applyTo: 'src/**/*.svelte, src/**/*.server].ts'
---

SvelteKit forms use sveltekit-superforms with arktype schemas defined in [src/lib/server/form-schemas.ts](src/lib/server/form-schemas.ts). **Define schemas at module top-level** (outside functions) for proper caching—adapter is memoized based on arguments.

## Schema Definition (arktype)

- Define shape with `type({...})` or derive from Drizzle using `createInsertSchema(table)`. Keep enums aligned with [src/lib/types/role.ts](src/lib/types/role.ts) and [src/lib/types/work.ts](src/lib/types/work.ts).
- Use optional fields with `?`, `boolean` for booleans, `number` for numbers, and `'literal'` for literals to match superforms coercion.
- Export schemas from [src/lib/server/form-schemas.ts](src/lib/server/form-schemas.ts) for reuse across load/actions.

## Server-side Usage

**Import from Superforms, not SvelteKit**: `import { superValidate, message, fail, setError } from 'sveltekit-superforms';`

**Load function** (empty form or populate):

```ts
const form = await superValidate(arktype(schema)); // Empty form
// OR populate from DB:
const form = await superValidate(userData, arktype(schema));
return { form }; // Always return { form }
```

**Form actions** (use `request`, not `event`):

```ts
const form = await superValidate(request, arktype(schema));
if (!form.valid) return fail(400, { form }); // Superforms fail
// Do side-effects...
return message(form, 'Saved successfully!'); // Superforms message
```

**File uploads**: Set `allowFiles: true` in both load and actions when schema includes `File`:

```ts
const form = await superValidate(request, arktype(schema), { allowFiles: true });
```

Then upload via `uploadThumbnail` using KV from `requirePlatformForActions`. Use `message`, `fail`, or `setError` from Superforms (not SvelteKit) when returning forms with files.

## Platform & Auth Guards

- Always guard platform bindings before DB/KV use: call `requirePlatformForLoad/Actions` or `requireDatabaseForLoad/Actions` from [src/lib/server/platform.ts](src/lib/server/platform.ts); build Drizzle with `generateDB` from [src/lib/server/db/index.ts](src/lib/server/db/index.ts).
- Authenticated routes: in layouts use `requireLogin()` then check role with `roleIsOver()` from [src/lib/server/auth/index.ts](src/lib/server/auth/index.ts); in actions use same pattern: `requireLogin()` + `roleIsOver()` check, return `fail(403)` if unauthorized.

## Client-side Usage

```svelte
<script lang="ts">
	const { form, errors, enhance, message } = superForm(data.form);
</script>

{#if $message}<div class="message">{$message}</div>{/if}

<form method="POST" use:enhance>
	<input name="name" bind:value={$form.name} aria-invalid={$errors.name ? 'true' : undefined} />
	{#if $errors.name}<span class="invalid">{$errors.name}</span>{/if}
	<button>Submit</button>
</form>
```

- Render validation errors from `$errors`; use `$form.submitting` for loading states.
- Avoid duplicating validation logic in the browser—use server-side validation.
- Type forms when needed: `type WorkForm = Infer<typeof workFormSchema>;`

**CRITICAL: superForm initialization must happen once at component top-level**:

```svelte
// CORRECT: Initialize once const {(form, errors, enhance)} = superForm(data.form); // WRONG: Never wrap
in $derived or $derived.by - causes form fields to disappear const formApi = $derived.by(() => superForm(data.form));
// ❌ BAD const {(form, errors)} = $derived(formApi); // ❌ BAD
```

`superForm` creates stateful stores and effects that must persist across renders. Wrapping in `$derived` causes re-initialization on every render, destroying form state and making input fields vanish. Always call `superForm` directly at script top-level, never inside reactive contexts.

## Multiple Forms on One Page

When a page needs multiple forms (e.g., create/update, delete, import), **each form MUST have its own schema** and validated form instance. **Do NOT reuse the same schema with different IDs**.

### Server-side (multiple forms)

```ts
import {
	certificationFormSchema,
	deleteFormSchema,
	importFormSchema
} from '$lib/server/form-schemas';

export const load: PageServerLoad = async ({ platform, parent }) => {
	// Create separate validated forms for each action
	const form = await superValidate(arktype(certificationFormSchema));
	const deleteForm = await superValidate(arktype(deleteFormSchema));
	const importForm = await superValidate(arktype(importFormSchema), { allowFiles: true });

	return { certifications, user, form, deleteForm, importForm };
};

export const actions: Actions = {
	create: async ({ request, platform }) => {
		const form = await superValidate(request, arktype(certificationFormSchema));
		if (!form.valid) return fail(400, { form });
		// ... handle create
		return { form };
	},
	delete: async ({ request, platform }) => {
		const form = await superValidate(request, arktype(deleteFormSchema));
		if (!form.valid) return fail(400, { form });
		// ... handle delete
		return { form };
	},
	import: async ({ request, platform }) => {
		const form = await superValidate(request, arktype(importFormSchema), { allowFiles: true });
		if (!form.valid) return fail(400, { form });
		// ... handle import
		return { form };
	}
};
```

### Client-side (multiple forms)

```svelte
<script lang="ts">
	// Each form gets its own superForm instance with corresponding data property
	// svelte-ignore state_referenced_locally
	const { form, enhance: formEnhance, errors } = superForm(data.form);

	// svelte-ignore state_referenced_locally
	const { enhance: deleteEnhance } = superForm(data.deleteForm, {
		id: 'delete-form',
		dataType: 'json'
	});

	// svelte-ignore state_referenced_locally
	const { enhance: importEnhance } = superForm(data.importForm, {
		id: 'import-form',
		dataType: 'form' // Use 'form' for file uploads
	});
</script>

<!-- Main create/update form -->
<form method="POST" action="?/create" use:formEnhance>
	<!-- form fields -->
</form>

<!-- Delete form -->
<form method="POST" action="?/delete" use:deleteEnhance>
	<input type="hidden" name="id" value={item.id} />
	<button type="submit">Delete</button>
</form>

<!-- Import form -->
<form method="POST" action="?/import" enctype="multipart/form-data" use:importEnhance>
	<input type="file" name="file" accept=".json" />
	<button type="submit">Import</button>
</form>
```

### Schema Examples

```ts
// Main CRUD schema
export const certificationFormSchema = type({
	id: 'string?',
	name: 'string >= 1',
	date: 'string?',
	status: 'string?',
	order: 'number >= 0'
});

// Delete schema (only needs ID)
export const deleteFormSchema = type({
	id: 'string >= 1'
});

// Import schema (file upload)
export const importFormSchema = type({
	file: 'File'
});
```

**Key Points**:

- ✅ Create separate schemas for each form type
- ✅ Return multiple validated forms from load function
- ✅ Use corresponding `data.form`, `data.deleteForm`, `data.importForm` in client
- ✅ Give each superForm a unique `id` option
- ❌ Do NOT reuse the same schema: `superForm(data.form, { id: 'delete' })`
- ❌ Do NOT reuse the same form data for multiple actions

## Best Practices

- Co-locate server logic in `+page.server.ts` and UI in `+page.svelte`.
- Keep DB writes in actions, not loads.
- Superforms normalizes booleans, numbers, and files automatically when schema expects them.
- For JSON blobs (e.g., work URLs), parse/serialize centrally and keep schema expectations clear.
