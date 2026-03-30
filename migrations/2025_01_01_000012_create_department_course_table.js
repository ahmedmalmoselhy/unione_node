export async function up(knex) {
  await knex.schema.createTable('department_course', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('department_id').unsigned().notNullable();
    table.bigInteger('course_id').unsigned().notNullable();
    table.boolean('is_owner').notNullable().defaultTo(false);

    table.unique(['department_id', 'course_id']);
    table.foreign('department_id').references('id').inTable('departments').onDelete('CASCADE');
    table.foreign('course_id').references('id').inTable('courses').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('department_course');
}
