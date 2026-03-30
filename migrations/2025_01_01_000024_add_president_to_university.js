export async function up(knex) {
  await knex.schema.alterTable('university', (table) => {
    table.bigInteger('president_id').unsigned().nullable();
    table.foreign('president_id').references('id').inTable('professors').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('university', (table) => {
    table.dropForeign(['president_id']);
    table.dropColumn('president_id');
  });
}
