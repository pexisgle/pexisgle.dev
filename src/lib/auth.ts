/**
 * Client-side authentication utilities.
 * The GitHub OAuth access token is stored in a browser cookie (gh_token)
 * set by the server-side OAuth callback.
 */
import { Octokit } from '@octokit/rest';
const COOKIE_NAME = 'gh_token';

/** Create an Octokit instance with the given token. Shared across auth and github modules. */
export const octokitWithToken = (token: string): Octokit =>
	new Octokit({ auth: token, userAgent: 'pexisgle-dashboard/1.0' });

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
	try {
		const octokit = octokitWithToken(token);
		const { data } = await octokit.rest.users.getAuthenticated();
		return data as GitHubUser;
	} catch {
		return null;
	}
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
	try {
		const octokit = octokitWithToken(token);
		const { data } = await octokit.rest.repos.get({ owner, repo });
		return data.permissions?.push === true;
	} catch {
		return false;
	}
}
