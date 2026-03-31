import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import { getToken } from '$lib/dashboard/auth';

export const prerender = false;
export const ssr = false;
export const csr = true;

export const load: LayoutLoad = async () => {
	let token = '';
	if (browser) {
		token = getToken();
		if (!token || token.length === 0) {
			redirect(307, '/dashboard/signin');
		}
	}
	return {
		token
	};
};
