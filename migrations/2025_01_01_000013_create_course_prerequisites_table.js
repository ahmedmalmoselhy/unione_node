export async function up(knex) {
  await knex.schema.createTable('course_prerequisites', (table) => {
    table.bigInteger('course_id').unsigned().notNullable();
    table.bigInteger('prerequisite_id').unsigned().notNullable();

    table.primary(['course_id', 'prerequisite_id']);
    table.foreign('course_id').references('id').inTable('courses').onDelete('CASCADE');
    table.foreign('prerequisite_id').references('id').inTable('courses').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('course_prerequisites');
}
