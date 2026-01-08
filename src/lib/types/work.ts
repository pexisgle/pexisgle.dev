export const work_types = ['creation', 'program', 'contest', 'other'] as const;
export type WorkType = (typeof work_types)[number];

export const workTypesOptions = work_types.map((t) => ({ value: t, name: t }));
