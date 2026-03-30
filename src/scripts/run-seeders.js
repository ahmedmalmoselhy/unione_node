import path from 'node:path';
import { pathToFileURL } from 'node:url';
import db from '../config/knex.js';
import { orderedSeedFiles } from './seeder-config.js';

async function run() {
  console.log('Starting ordered seed run...');

  for (const file of orderedSeedFiles) {
    const fullPath = path.resolve(process.cwd(), 'seeds', file);
    const mod = await import(pathToFileURL(fullPath).href);

    if (typeof mod.seed !== 'function') {
      throw new Error(`Missing seed export in ${file}`);
    }

    console.log(`Running ${file}`);
    await mod.seed(db);
  }

  console.log('All seeders completed successfully.');
}

run()
  .catch((error) => {
    console.error('Seeder run failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
