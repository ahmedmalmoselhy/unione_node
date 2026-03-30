export async function up(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.string('logo_path').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.dropColumn('logo_path');
  });
}
