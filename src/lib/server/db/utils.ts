import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { type SQLiteTable, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export async function shiftOrder(
	db: DrizzleD1Database<Record<string, unknown>>,
	table: SQLiteTable,
	orderCol: AnySQLiteColumn,
	newOrder: number,
	oldOrder: number | null = null,
	operation: 'insert' | 'update' | 'delete' = 'insert'
) {
	if (operation === 'insert') {
		// Shift everything >= newOrder up by 1
		await db
			.update(table)
			.set({ order: sql`${orderCol} + 1` })
			.where(sql`${orderCol} >= ${newOrder}`);
	} else if (operation === 'delete' && oldOrder !== null) {
		// Shift everything > oldOrder down by 1
		await db
			.update(table)
			.set({ order: sql`${orderCol} - 1` })
			.where(sql`${orderCol} > ${oldOrder}`);
	} else if (operation === 'update' && oldOrder !== null) {
		if (newOrder < oldOrder) {
			// Moving up: Shift items between newOrder and oldOrder (inclusive start, exclusive end) UP by 1
			await db
				.update(table)
				.set({ order: sql`${orderCol} + 1` })
				.where(sql`${orderCol} >= ${newOrder} AND ${orderCol} < ${oldOrder}`);
		} else if (newOrder > oldOrder) {
			// Moving down: Shift items between oldOrder and newOrder (exclusive start, inclusive end) DOWN by 1
			await db
				.update(table)
				.set({ order: sql`${orderCol} - 1` })
				.where(sql`${orderCol} > ${oldOrder} AND ${orderCol} <= ${newOrder}`);
		}
	}
}
