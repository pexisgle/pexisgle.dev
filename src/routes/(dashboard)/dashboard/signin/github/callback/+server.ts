import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { github } from '$lib/server/auth';
import { generateDB } from '$lib/server/db';
import type { RequestEvent } from './$types';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { OAuth2Tokens } from 'arctic';
import { requirePlatformForActions } from '$lib/server/platform';

interface GitHubUser {
	id: number;
	login: string;
	name: string;
	avatar_url: string;
}

export async function GET(event: RequestEvent): Promise<Response> {
	const { db: d1 } = requirePlatformForActions(event.platform);

	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;
	if (code === null || state === null || storedState === null) {
		return new Response(null, {
			status: 400
		});
	}
	if (state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch {
		// Invalid code or client credentials
		return new Response(null, {
			status: 400
		});
	}
	const githubUserResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`,
			'User-Agent': 'pexisgle-dev'
		}
	});

	if (!githubUserResponse.ok) {
		const text = await githubUserResponse.text();
		console.error('GitHub User Fetch Error:', githubUserResponse.status, text);
		return new Response('GitHub API Error', { status: 500 });
	}
	const githubUser: GitHubUser = await githubUserResponse.json();
	const db = generateDB(d1);

	const existingUser = await db
		.select()
		.from(table.user)
		.where(eq(table.user.githubId, githubUser.id))
		.get();

	if (existingUser) {
		const sessionToken = generateSessionToken();
		const session = await createSession(db, sessionToken, existingUser.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/dashboard'
			}
		});
	}

	const userId = crypto.randomUUID();
	await db.insert(table.user).values({
		id: userId,
		githubId: githubUser.id,
		username: githubUser.login,
		displayName: githubUser.name,
		avatarUrl: githubUser.avatar_url
	});

	const sessionToken = generateSessionToken();
	const session = await createSession(db, sessionToken, userId);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/dashboard'
		}
	});
}
