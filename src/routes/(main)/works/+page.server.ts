import { getWorks } from '$lib/content';
import { work_types } from '$lib/types/work';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const works = await getWorks();
	return { works, work_types };
};
