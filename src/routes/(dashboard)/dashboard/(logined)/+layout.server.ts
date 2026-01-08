import type { LayoutServerLoad } from './$types';
import { requireLogin, roleIsOver } from '$lib/server/auth';
import { menuItems } from '$lib/server/menu';

export const load: LayoutServerLoad = async () => {
	const user = await requireLogin();
	const menu = menuItems.filter((item) => roleIsOver(item.requiredRole, user.role));
	return { user, menu };
};
