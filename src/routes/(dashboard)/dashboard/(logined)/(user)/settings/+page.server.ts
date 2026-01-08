import { requireLogin } from '$lib/server/auth';
import { requirePlatformForLoad, requirePlatformForActions } from '$lib/server/platform';
import { generateDB } from '$lib/server/db';
import { userSettingsSchema } from '$lib/server/form-schemas';
import { superValidate } from 'sveltekit-superforms';
import { arktype } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform }) => {
	const currentUser = await requireLogin();
	const { db: d1 } = requirePlatformForLoad(platform);
	const db = generateDB(d1);

	// Get current user data
	const [userData] = await db.select().from(user).where(eq(user.id, currentUser.id));

	// Initialize form with current values
	const form = await superValidate(
		{
			displayName: userData.displayName ?? ''
		},
		arktype(userSettingsSchema)
	);

	return { form, user: currentUser };
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const currentUser = await requireLogin();
		const { db: d1 } = requirePlatformForActions(platform);
		const db = generateDB(d1);

		const form = await superValidate(request, arktype(userSettingsSchema));
		if (!form.valid) return fail(400, { form });

		// Update user settings
		await db
			.update(user)
			.set({
				displayName: form.data.displayName || null
			})
			.where(eq(user.id, currentUser.id));

		throw redirect(303, '/admin');
	}
};
