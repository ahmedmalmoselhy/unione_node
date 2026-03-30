export async function up(knex) {
  await knex.schema.createTable('role_user', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable();
    table.bigInteger('role_id').unsigned().notNullable();
    table.timestamp('granted_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at').nullable();

    table.index(['user_id', 'role_id']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('role_user');
}
