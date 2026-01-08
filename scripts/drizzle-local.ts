import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';

async function findSqliteFile(dir: string): Promise<string | null> {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				const found = await findSqliteFile(fullPath);
				if (found) return found;
			} else if (entry.isFile() && entry.name.endsWith('.sqlite')) {
				return fullPath;
			}
		}
	} catch {
		// Ignore errors (e.g., directory not found)
	}
	return null;
}

async function main() {
	const wranglerDir = join(process.cwd(), '.wrangler');
	const dbPath = await findSqliteFile(wranglerDir);

	if (!dbPath) {
		console.error('Could not find .sqlite file in .wrangler directory');
		process.exit(1);
	}

	const relativeDbPath = relative(process.cwd(), dbPath);
	console.log(`Found database: ${relativeDbPath}`);

	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(relativeDbPath);
		return;
	}

	// Set environment variable based on command
	const envVar = 'LOCAL_DB_PATH';

	// Construct command: bun run drizzle-kit <args>
	const command = 'bun';
	const commandArgs = ['run', 'drizzle-kit', ...args];

	const child = spawn(command, commandArgs, {
		stdio: 'inherit',
		shell: true,
		env: {
			...process.env,
			[envVar]: relativeDbPath
		}
	});

	child.on('exit', (code) => {
		process.exit(code ?? 0);
	});
}

main();
