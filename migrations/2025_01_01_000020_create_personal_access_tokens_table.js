export async function up(knex) {
  await knex.schema.createTable('personal_access_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.string('tokenable_type').notNullable();
    table.bigInteger('tokenable_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.string('token', 64).notNullable().unique();
    table.text('abilities').nullable();
    table.timestamp('last_used_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamps(true, true);

    table.index(['tokenable_type', 'tokenable_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('personal_access_tokens');
}
