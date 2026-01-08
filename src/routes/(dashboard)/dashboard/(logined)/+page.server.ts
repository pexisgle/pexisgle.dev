import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { generateDB } from '$lib/server/db';
import { requireDatabaseForActions } from '$lib/server/platform';

export const actions: Actions = {
	default: async (event) => {
		const { session } = await auth.getCurrentSession(event);
		if (!session) {
			return fail(401);
		}
		const d1 = requireDatabaseForActions(event.platform);
		const db = generateDB(d1);
		await auth.invalidateSession(db, session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/dashboard/signin');
	}
};
