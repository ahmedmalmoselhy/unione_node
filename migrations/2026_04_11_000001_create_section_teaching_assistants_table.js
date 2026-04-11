export async function up(knex) {
  await knex.schema.createTable('section_teaching_assistants', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('section_id').unsigned().notNullable();
    table.bigInteger('professor_id').unsigned().notNullable();
    table.bigInteger('assigned_by_user_id').unsigned().nullable();
    table.timestamps(true, true);

    table.unique(['section_id', 'professor_id']);
    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
    table.foreign('professor_id').references('id').inTable('professors').onDelete('CASCADE');
    table.foreign('assigned_by_user_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('section_teaching_assistants');
}
