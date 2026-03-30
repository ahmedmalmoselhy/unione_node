export async function up(knex) {
  await knex.schema.createTable('enrollment_waitlist', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('section_id').unsigned().notNullable();
    table.bigInteger('academic_term_id').unsigned().notNullable();
    table.integer('position').notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.unique(['student_id', 'section_id']);
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
    table.foreign('academic_term_id').references('id').inTable('academic_terms').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('enrollment_waitlist');
}
