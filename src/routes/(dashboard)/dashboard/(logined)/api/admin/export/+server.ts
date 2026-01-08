import { json } from '@sveltejs/kit';
import { BACKUP_API_KEY } from '$env/static/private';
import { getCurrentSession, roleIsOver } from '$lib/server/auth';
import { generateDB } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	// 1. Check API Key Authentication
	const authHeader = event.request.headers.get('Authorization');
	const isApiKeyValid = BACKUP_API_KEY && authHeader === `Bearer ${BACKUP_API_KEY}`;

	// 2. Check Session Authentication if API Key is invalid
	if (!isApiKeyValid) {
		const { user } = await getCurrentSession(event);
		// Require 'admin' role or higher
		if (!user || !roleIsOver(user.role, 'admin')) {
			return new Response('Unauthorized', { status: 401 });
		}
	}

	// Initialize Database
	const db = generateDB(event.platform?.env.pexisgle_dev_db);

	// Fetch all data concurrently
	const [users, images, works, workUrls, blogs, snss, skills, certifications, awards] =
		await Promise.all([
			db.select().from(table.user),
			db.select().from(table.image),
			db.select().from(table.work),
			db.select().from(table.work_urls),
			db.select().from(table.blog),
			db.select().from(table.sns),
			db.select().from(table.skill),
			db.select().from(table.certification),
			db.select().from(table.award)
		]);

	const exportData = {
		metadata: {
			exportedAt: new Date().toISOString(),
			version: '1.0'
		},
		data: {
			users,
			images,
			works,
			workUrls,
			blogs,
			snss,
			skills,
			certifications,
			awards
		}
	};

	return json(exportData, {
		headers: {
			'Content-Disposition': `attachment; filename="pexisgle-backup-${new Date().toISOString()}.json"`
		}
	});
};
