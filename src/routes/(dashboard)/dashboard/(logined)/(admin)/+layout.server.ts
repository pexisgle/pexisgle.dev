import type { LayoutServerLoad } from './$types';
import { roleIsOver } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (!roleIsOver('admin', user.role)) {
		return error(403, 'Forbidden');
	}
	return {};
};
