export async function up(knex) {
  await knex.schema.createTable('sections', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('course_id').unsigned().notNullable();
    table.bigInteger('professor_id').unsigned().notNullable();
    table.integer('academic_year').notNullable();
    table.enu('semester', ['first', 'second', 'summer']).notNullable();
    table.integer('capacity').notNullable();
    table.string('room').nullable();
    table.json('schedule').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.index(['course_id', 'academic_year', 'semester']);
    table.foreign('course_id').references('id').inTable('courses').onDelete('RESTRICT');
    table.foreign('professor_id').references('id').inTable('professors').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sections');
}
