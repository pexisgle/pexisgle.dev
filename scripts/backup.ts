import { writeFile } from "fs/promises";

async function backup() {
  const appUrl = process.env.APP_URL;
  const backupApiKey = process.env.BACKUP_API_KEY;

  if (!appUrl) {
    console.error("Error: APP_URL is not defined in environment variables.");
    process.exit(1);
  }

  if (!backupApiKey) {
    console.error("Error: BACKUP_API_KEY is not defined in environment variables.");
    process.exit(1);
  }

  const date = new Date().toISOString().split("T")[0];
  const filename = `pexisgle-backup-${date}.json`;
  const url = `${appUrl}/dashboard/api/admin/export`;

  console.log(`Starting backup...`);
  console.log(`Target URL: ${url}`);
  console.log(`Output File: ${filename}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${backupApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch backup: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    await writeFile(filename, data);

    console.log(`Backup successfully saved to ${filename}`);
    
    // Output filename for GitHub Actions if needed
    // console.log(`::set-output name=backup_file::${filename}`); 

  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

backup();
