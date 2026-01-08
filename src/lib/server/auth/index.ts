import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { GitHub } from 'arctic';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as table from '$lib/server/db/schema';
import { generateDB } from '$lib/server/db';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, '');

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(
	db: DrizzleD1Database,
	token: string,
	userId: string
): Promise<table.Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(
	db: DrizzleD1Database,
	token: string
): Promise<{ session: table.Session | null; user: table.User | null }> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			user: {
				id: table.user.id,
				githubId: table.user.githubId,
				username: table.user.username,
				displayName: table.user.displayName,
				avatarUrl: table.user.avatarUrl,
				role: table.user.role
			},
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(db: DrizzleD1Database, sessionId: string): Promise<void> {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

export async function getCurrentSession(event: RequestEvent): Promise<SessionValidationResult> {
	const token = event.cookies.get(sessionCookieName);
	if (!token) {
		return { session: null, user: null };
	}

	if (!event.platform?.env.pexisgle_dev_db) {
		return { session: null, user: null };
	}

	const db = generateDB(event.platform.env.pexisgle_dev_db);
	const { session, user } = await validateSessionToken(db, token);
	if (session) {
		setSessionTokenCookie(event, token, session.expiresAt);
	} else {
		deleteSessionTokenCookie(event);
	}
	return { session, user };
}

export async function requireLogin(): Promise<table.User> {
	const event = getRequestEvent();
	const { user } = await getCurrentSession(event);
	if (!user) {
		throw redirect(302, '/dashboard/signin');
	}
	return user;
}

/*
	Returns true if the target role is over the base role
	baseRole: The role to compare against
	targetRole: The role to compare
*/
export function roleIsOver(baseRole: table.Role, targetRole: table.Role): boolean {
	const hierarchy: Record<table.Role, number> = {
		none: 0,
		user: 1,
		admin: 2,
		owner: 3
	};
	return (hierarchy[targetRole] ?? 0) >= (hierarchy[baseRole] ?? 0);
}
