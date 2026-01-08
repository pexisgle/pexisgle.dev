import { redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user } = await auth.getCurrentSession(event);
	if (user) {
		return redirect(302, '/dashboard');
	}
	return {};
};
