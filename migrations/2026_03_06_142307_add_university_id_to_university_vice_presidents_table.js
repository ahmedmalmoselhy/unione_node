export async function up(knex) {
  await knex.schema.alterTable('university_vice_presidents', (table) => {
    table.bigInteger('university_id').unsigned().notNullable();
    table.foreign('university_id').references('id').inTable('university');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('university_vice_presidents', (table) => {
    table.dropForeign(['university_id']);
    table.dropColumn('university_id');
  });
}
