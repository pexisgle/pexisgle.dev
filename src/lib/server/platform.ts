import { fail, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export interface PlatformEnv {
	db: D1Database;
	kv: KVNamespace;
}

/**
 * For +page.server.ts load() and +layout.server.ts load()
 * Ensures platform bindings are available.
 * Returns both DB and KV bindings or throws a SvelteKit error.
 */
export function requirePlatformForLoad(platform: RequestEvent['platform']): PlatformEnv {
	if (!platform?.env.pexisgle_dev_db) {
		throw error(500, 'Database connection unavailable');
	}
	if (!platform?.env.pexisgle_dev_kv) {
		throw error(500, 'KV storage unavailable');
	}
	return {
		db: platform.env.pexisgle_dev_db,
		kv: platform.env.pexisgle_dev_kv
	};
}

/**
 * For +page.server.ts load() and +layout.server.ts load()
 * Ensures only the database binding is available.
 * Use this when KV is not needed.
 */
export function requireDatabaseForLoad(platform: RequestEvent['platform']): D1Database {
	if (!platform?.env.pexisgle_dev_db) {
		throw error(500, 'Database connection unavailable');
	}
	return platform.env.pexisgle_dev_db;
}

/**
 * For +page.server.ts actions (form submission handlers)
 * Ensures platform bindings are available.
 * Returns both DB and KV bindings or throws an ActionFailure.
 */
export function requirePlatformForActions(platform: RequestEvent['platform']): PlatformEnv {
	if (!platform?.env.pexisgle_dev_db) {
		throw fail(500, { message: 'Database connection unavailable' });
	}
	if (!platform?.env.pexisgle_dev_kv) {
		throw fail(500, { message: 'KV storage unavailable' });
	}
	return {
		db: platform.env.pexisgle_dev_db,
		kv: platform.env.pexisgle_dev_kv
	};
}

/**
 * For +page.server.ts actions (form submission handlers)
 * Ensures only the database binding is available.
 * Use this when KV is not needed.
 */
export function requireDatabaseForActions(platform: RequestEvent['platform']): D1Database {
	if (!platform?.env.pexisgle_dev_db) {
		throw fail(500, { message: 'Database connection unavailable' });
	}
	return platform.env.pexisgle_dev_db;
}
