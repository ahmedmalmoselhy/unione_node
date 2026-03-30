import path from 'node:path';
import { pathToFileURL } from 'node:url';
import db from '../config/knex.js';
import { orderedSeedFiles, trackedTables } from './seeder-config.js';

function tableString(rows) {
  const headers = ['table', 'before', 'during_dry_run', 'after_rollback', 'delta_dry_run'];
  const line = headers.map((h) => h.padEnd(24)).join('');
  const sep = '-'.repeat(line.length);

  const body = rows
    .map((r) => {
      return [
        String(r.table).padEnd(24),
        String(r.before).padEnd(24),
        String(r.during).padEnd(24),
        String(r.after).padEnd(24),
        String(r.delta).padEnd(24),
      ].join('');
    })
    .join('\n');

  return `${line}\n${sep}\n${body}`;
}

async function getCounts(knexOrTrx, tables) {
  const counts = {};
  for (const table of tables) {
    const result = await knexOrTrx(table).count({ count: '*' }).first();
    counts[table] = Number(result?.count ?? 0);
  }
  return counts;
}

async function verifySchemaReady() {
  const missing = [];
  for (const table of trackedTables) {
    const exists = await db.schema.hasTable(table);
    if (!exists) {
      missing.push(table);
    }
  }
  return missing;
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
  console.log('Seed parity verification (dry-run with transaction rollback)');

  const missingTables = await verifySchemaReady();
  if (missingTables.length) {
    console.error('Cannot verify seed parity because required tables are missing.');
    console.error(`Missing: ${missingTables.join(', ')}`);
    console.error('Run migrations first, then retry seed verification.');
    process.exitCode = 2;
    return;
  }

  const before = await getCounts(db, trackedTables);
  let during = null;

  try {
    await db.transaction(async (trx) => {
      for (const file of orderedSeedFiles) {
        const seed = await loadSeeder(file);
        await seed(trx);
      }

      during = await getCounts(trx, trackedTables);

      // Always rollback: this is a verification-only dry run.
      throw new Error('__ROLLBACK_DRY_RUN__');
    });
  } catch (error) {
    if (error.message !== '__ROLLBACK_DRY_RUN__') {
      throw error;
    }
  }

  const after = await getCounts(db, trackedTables);

  const rows = trackedTables.map((table) => ({
    table,
    before: before[table],
    during: during?.[table] ?? before[table],
    after: after[table],
    delta: (during?.[table] ?? before[table]) - before[table],
  }));

  console.log(tableString(rows));

  const drift = rows.filter((r) => r.before !== r.after);
  if (drift.length) {
    console.error('Rollback drift detected. Some row counts changed after dry-run rollback:');
    for (const d of drift) {
      console.error(`- ${d.table}: before=${d.before}, after=${d.after}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Dry-run verification completed successfully. No persisted changes after rollback.');
}

run()
  .catch((error) => {
    console.error('Seed parity verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
