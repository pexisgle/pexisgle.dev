import { GitHub } from 'arctic';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

/** Arctic GitHub OAuth client - used only by the sign-in server routes. */
export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, '');
