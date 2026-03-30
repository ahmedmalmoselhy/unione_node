export async function up(knex) {
  await knex.schema.createTable('enrollments', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('section_id').unsigned().notNullable();
    table.enu('status', ['registered', 'dropped', 'completed', 'failed', 'incomplete']).notNullable().defaultTo('registered');
    table.timestamp('registered_at').defaultTo(knex.fn.now());
    table.timestamp('dropped_at').nullable();
    table.timestamps(true, true);

    table.unique(['student_id', 'section_id']);
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('enrollments');
}
