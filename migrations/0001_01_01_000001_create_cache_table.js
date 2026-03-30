export async function up(knex) {
  await knex.schema.createTable('cache', (table) => {
    table.string('key').primary();
    table.text('value').notNullable();
    table.integer('expiration').notNullable().index();
  });

  await knex.schema.createTable('cache_locks', (table) => {
    table.string('key').primary();
    table.string('owner').notNullable();
    table.integer('expiration').notNullable().index();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('cache_locks');
  await knex.schema.dropTableIfExists('cache');
}
