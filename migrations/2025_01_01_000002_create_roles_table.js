export async function up(knex) {
  await knex.schema.createTable('roles', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable().unique();
    table.string('label').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('roles');
}
