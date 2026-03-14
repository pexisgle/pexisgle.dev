import { getSNS, getSkills, getCertifications, getAwards } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [snsList, skils, certifications, awards] = await Promise.all([
		getSNS(),
		getSkills(),
		getCertifications(),
		getAwards()
	]);

	return { sns: snsList, skils, certifications, awards };
};
