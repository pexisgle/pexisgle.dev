import { drizzle } from 'drizzle-orm/d1';

export const generateDB = (db: D1Database | undefined) => {
	if (!db) throw new Error('D1Database is not defined');
	return drizzle(db);
};
