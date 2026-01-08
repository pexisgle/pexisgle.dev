---
applyTo: '**/*.ts'
---

Session-based authentication following Lucia Auth patterns with custom role-based access control. Uses sha256-hashed session tokens stored in D1, GitHub OAuth via Arctic, and HttpOnly cookies.

## Architecture (Lucia Auth Pattern)

**Session Token Generation**: 18 random bytes → base64url-encoded (144 bits entropy). Function: `generateSessionToken()` from [src/lib/server/auth/index.ts](src/lib/server/auth/index.ts).

**Session Storage**: Token hashed with sha256 → hex-encoded as session ID. Stored in D1 `session` table with userId and expiresAt. Session lifespan: 30 days, renewed if <15 days remain.

**Cookie**: `auth-session` cookie, HttpOnly, expires with session. No `Secure` flag set (handled by platform). Path: `/`. No explicit SameSite (defaults to Lax in modern browsers).

## Core Functions (Reuse These)

**`generateSessionToken()`**: Creates random token for new sessions.

**`createSession(db, token, userId)`**: Hashes token → sha256 → hex, inserts session into D1, returns Session object.

**`validateSessionToken(db, token)`**: Hashes token, queries session+user with JOIN, checks expiration, renews if <15 days left, returns `{ session, user }` or `{ null, null }`.

**`invalidateSession(db, sessionId)`**: Deletes session from D1. Use for signout.

**`setSessionTokenCookie(event, token, expiresAt)`**: Sets `auth-session` cookie with expiration.

**`deleteSessionTokenCookie(event)`**: Removes `auth-session` cookie.

**`getCurrentSession(event)`**: Reads cookie, validates token, refreshes cookie if session valid, returns `{ session, user }`.

**`requireLogin()`**: Guard for server routes; throws redirect to `/dashboard/signin` if no user. Use in load functions or before actions. Returns authenticated User.

All in [src/lib/server/auth/index.ts](src/lib/server/auth/index.ts).

## GitHub OAuth Flow (Arctic)

**Provider init**: `new GitHub(CLIENT_ID, CLIENT_SECRET, null)` exported as `github` from auth index.

**Authorization** (`/dashboard/signin/github/+server.ts`): Generate state with Arctic's `generateState()`, set `github_oauth_state` cookie (10 min expiry), redirect to GitHub auth URL.

**Callback** (`/dashboard/signin/github/callback/+server.ts`): Verify state matches cookie, exchange code for tokens via `github.validateAuthorizationCode(code)`, fetch user from GitHub API, upsert user (githubId unique), create session, set cookie, redirect to `/dashboard`.

**User creation**: If user doesn't exist, insert with `crypto.randomUUID()` as id, githubId, username, displayName, avatarUrl, default role `'none'`.

## Role-Based Access Control (Project-Specific)

**Role hierarchy**: Defined in [src/lib/types/role.ts](src/lib/types/role.ts): `none` (0) < `user` (1) < `admin` (2) < `owner` (3).

**`roleIsOver(baseRole, targetRole)`**: Returns true if targetRole >= baseRole in hierarchy. Example: `roleIsOver('admin', user.role)` checks if user is admin or owner.

**Layout enforcement**: `(logined)` layout calls `requireLogin()` to ensure session exists. Child layouts get `user` from `parent()`, then check role manually: `if (!roleIsOver('admin', user.role)) return error(403)`. Example: `(admin)` layout, `(user)` layout.

**Action enforcement**: Always use `requireLogin()` first, then check role with `roleIsOver()`. Return `fail(403)` if insufficient. Never use redirect in actions.

## Session Renewal (Inactivity Timeout Pattern)

**Automatic renewal**: If session has <15 days until expiration, `validateSessionToken` extends it by 30 days and updates D1. Cookie is refreshed on every request via `getCurrentSession`.

**No explicit timeout**: Sessions expire after 30 days of inactivity (no requests). Active users stay logged in indefinitely.

## Security Best Practices

- **SHA-256 for session tokens**: Fast hashing acceptable because token has 144 bits entropy (unguessable). Not for passwords.
- **HttpOnly cookies**: Prevents client-side JS access. Mitigates XSS (but not targeted attacks).
- **Session invalidation**: Always call `invalidateSession` + `deleteSessionTokenCookie` on signout. Never just delete cookie.
- **Platform binding check**: `getCurrentSession` short-circuits if `event.platform?.env.pexisgle_dev_db` missing. Guards against runtime errors.
- **CSRF**: SvelteKit handles Origin header checks for POST/PUT/DELETE by default. No additional CSRF token needed.

## Common Patterns

**Protect layout (via parent)**:

```ts
export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent(); // Parent layout already called requireLogin()
	if (!roleIsOver('admin', user.role)) {
		return error(403, 'Forbidden');
	}
	// ...
};
```

**Protect root layout/page (direct)**:

```ts
export const load: PageServerLoad = async () => {
	const user = await requireLogin(); // Throws redirect if not logged in
	// ...
};
```

**Protect action (any role)**:

```ts
export const actions: Actions = {
	default: async (event) => {
		const user = await requireLogin(); // Throws redirect if not logged in
		if (!roleIsOver('admin', user.role)) {
			return fail(403, { message: 'Forbidden' });
		}
		const { db, kv } = requirePlatformForActions(event.platform);
		// ...
	}
};
```

**Signout**:

```ts
const { session } = await getCurrentSession(event);
if (session) {
	await invalidateSession(db, session.id);
	deleteSessionTokenCookie(event);
}
return redirect(302, '/dashboard/signin');
```

## Notes

- **User model**: Includes `githubId` (unique), `username`, `displayName`, `avatarUrl`, `role`. No email or password fields.
- **Session model**: `id` (hashed token), `userId`, `expiresAt`. No createdAt or lastActivityAt tracked.
- **Role defaults**: New users get `role: 'none'`. Must be manually promoted to `'user'`, `'admin'`, or `'owner'`.
- **No refresh tokens**: OAuth tokens from GitHub not stored. Re-authorization required if GitHub access needed after initial login.
- **D1-specific**: Uses Drizzle with D1 binding. Session queries join user table. Keep `generateDB` wrapper for all DB access.
- **Auth pattern**: Always use `requireLogin()` + `roleIsOver()` check for both layouts and actions. Use `error(403)` in layouts, `fail(403)` in actions. No `requireAdmin()` helper needed.
