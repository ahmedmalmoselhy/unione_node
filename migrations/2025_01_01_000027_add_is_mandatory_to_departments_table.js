export async function up(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.boolean('is_mandatory').notNullable().defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.dropColumn('is_mandatory');
  });
}
