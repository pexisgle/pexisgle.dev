/**
 * Client-side authentication utilities.
 * The GitHub OAuth access token is stored in a browser cookie (gh_token)
 * set by the server-side OAuth callback.
 */

const COOKIE_NAME = 'gh_token';

/** Read the GitHub token from the browser cookie. Returns '' if not present. */
export function getToken(): string {
	if (typeof document === 'undefined') return '';
	const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : '';
}

/** Remove the GitHub token cookie (logout). */
export function clearToken(): void {
	document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export interface GitHubUser {
	login: string;
	name: string | null;
	avatar_url: string;
}

/** Fetch the authenticated GitHub user's profile. */
export async function getGitHubUser(token: string): Promise<GitHubUser | null> {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${token}`,
			'User-Agent': 'pexisgle-dashboard'
		}
	});
	if (!res.ok) return null;
	return res.json() as Promise<GitHubUser>;
}

/**
 * Check if the token has push access to the configured repository.
 * Returns false if the token is invalid, expired, or lacks write permission.
 */
export async function checkRepoAccess(
	token: string,
	owner: string,
	repo: string
): Promise<boolean> {
	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'User-Agent': 'pexisgle-dashboard'
		}
	});
	if (!res.ok) return false;
	const data = (await res.json()) as { permissions?: { push?: boolean } };
	return data.permissions?.push === true;
}
