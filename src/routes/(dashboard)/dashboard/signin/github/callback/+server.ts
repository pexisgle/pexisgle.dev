import { github } from '$lib/server/auth';
import { PUBLIC_GITHUB_OWNER, PUBLIC_GITHUB_REPO } from '$env/static/public';
import type { RequestEvent } from './$types';
import type { OAuth2Tokens } from 'arctic';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, { status: 400 });
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch {
		return new Response(null, { status: 400 });
	}

	const accessToken = tokens.accessToken();

	// Verify the account has push access to the configured repository.
	const repoRes = await fetch(
		`https://api.github.com/repos/${PUBLIC_GITHUB_OWNER}/${PUBLIC_GITHUB_REPO}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'User-Agent': 'pexisgle-dashboard'
			}
		}
	);

	if (!repoRes.ok) {
		return new Response('Repository not accessible', { status: 403 });
	}

	const repoData = (await repoRes.json()) as { permissions?: { push?: boolean } };
	if (!repoData.permissions?.push) {
		return new Response('Write access to repository is required', { status: 403 });
	}

	// Store the GitHub token in a JS-readable cookie (dashboard uses it for API calls).
	event.cookies.set('gh_token', accessToken, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: false,
		maxAge: 60 * 60 * 24 * 30, // 30 days
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: { Location: '/dashboard' }
	});
}
