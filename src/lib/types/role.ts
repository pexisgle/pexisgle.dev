export const roles = ['none', 'user', 'admin', 'owner'] as const;
export type Role = (typeof roles)[number];

export const rolesOptions = roles.map((r) => ({ value: r, name: r }));
