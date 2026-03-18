import { getWorks, getWork } from '$lib/server/content';
import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';

export const entries: EntryGenerator = async () => {
	const works = await getWorks();
	return works.map((w) => ({ id: w.id }));
};

export const load: PageServerLoad = async ({ params }) => {
	const workItem = await getWork(params.id);

	if (!workItem) {
		throw error(404, 'Work not found');
	}

	return { work: workItem };
};
