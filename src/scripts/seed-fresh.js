import path from 'node:path';
import { pathToFileURL } from 'node:url';
import db from '../config/knex.js';
import { freshResetTables, orderedSeedFiles } from './seeder-config.js';

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function loadSeeder(file) {
  const fullPath = path.resolve(process.cwd(), 'seeds', file);
  const mod = await import(pathToFileURL(fullPath).href);
  if (typeof mod.seed !== 'function') {
    throw new Error(`Missing seed export in ${file}`);
  }
  return mod.seed;
}

async function run() {
  console.log('Resetting seeded data and re-running seeders...');

  const existingRows = await db('information_schema.tables')
    .select('table_name')
    .where({ table_schema: 'public' })
    .whereIn('table_name', freshResetTables);

  const existing = new Set(existingRows.map((row) => row.table_name));
  const tablesToTruncate = freshResetTables.filter((table) => existing.has(table));

  if (tablesToTruncate.length > 0) {
    const quoted = tablesToTruncate.map(quoteIdent).join(', ');
    await db.raw(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
  } else {
    console.warn('No matching tables found for truncation; skipping reset step.');
  }

  for (const file of orderedSeedFiles) {
    const seed = await loadSeeder(file);
    console.log(`Running ${file}`);
    await seed(db);
  }

  console.log('Fresh seed run completed successfully.');
}

run()
  .catch((error) => {
    console.error('Fresh seed run failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
