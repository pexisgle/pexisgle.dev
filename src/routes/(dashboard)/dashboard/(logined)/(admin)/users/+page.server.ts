import { fail } from '@sveltejs/kit';
import { requireLogin } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { generateDB } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import type { Role } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireDatabaseForLoad, requireDatabaseForActions } from '$lib/server/platform';

export const load: PageServerLoad = async (event) => {
	const { user } = await event.parent();
	const d1 = requireDatabaseForLoad(event.platform);
	const db = generateDB(d1);
	const users = await db.select().from(userTable);

	return { user, users };
};

export const actions: Actions = {
	updateRole: async (event) => {
		const currentUser = await requireLogin();
		// Check basic permission
		if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
			return fail(403, { message: 'Forbidden' });
		}

		const formData = await event.request.formData();
		const userId = formData.get('userId')?.toString();
		const newRole = formData.get('role')?.toString();

		if (!userId || !newRole) {
			return fail(400, { message: 'Missing userId or role' });
		}
		if (!['none', 'user', 'admin', 'owner'].includes(newRole)) {
			return fail(400, { message: 'Invalid role' });
		}

		const d1 = requireDatabaseForActions(event.platform);
		const db = generateDB(d1);

		// Get target user to check their current role
		const targetUser = await db.select().from(userTable).where(eq(userTable.id, userId)).get();
		if (!targetUser) {
			return fail(404, { message: 'User not found' });
		}

		// Owner/Admin Constraints
		const isOwner = currentUser.role === 'owner';

		// 1. Only Owner can create/assign Admin or Owner roles
		if ((newRole === 'admin' || newRole === 'owner') && !isOwner) {
			return fail(403, { message: 'Only Owner can assign Admin or Owner roles' });
		}

		// 2. Only Owner can modify users who are already Admin or Owner
		if ((targetUser.role === 'admin' || targetUser.role === 'owner') && !isOwner) {
			return fail(403, { message: 'Only Owner can modify Admin or Owner users' });
		}

		try {
			await db
				.update(userTable)
				.set({ role: newRole as Role })
				.where(eq(userTable.id, userId));
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to update role' });
		}
	}
};
