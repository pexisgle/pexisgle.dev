import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default process.env.LOCAL_DB_PATH
	? defineConfig({
			out: './drizzle',
			schema: './src/lib/server/db/schema.ts',
			dialect: 'sqlite',
			dbCredentials: {
				url: process.env.LOCAL_DB_PATH!
			}
		})
	: defineConfig({
			out: './drizzle',
			schema: './src/lib/server/db/schema.ts',
			dialect: 'sqlite',
			driver: 'd1-http',
			dbCredentials: {
				accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
				databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
				token: process.env.CLOUDFLARE_D1_TOKEN!
			}
		});
