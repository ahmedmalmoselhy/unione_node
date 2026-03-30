export async function up(knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.string('id').primary();
    table.bigInteger('user_id').unsigned().nullable().index();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.text('payload').notNullable();
    table.integer('last_activity').notNullable().index();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sessions');
}
