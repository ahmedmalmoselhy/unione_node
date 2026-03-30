export async function up(knex) {
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.string('email').primary();
    table.string('token').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').nullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('password_reset_tokens');
}
