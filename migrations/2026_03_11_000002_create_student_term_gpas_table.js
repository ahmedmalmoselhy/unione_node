export async function up(knex) {
  await knex.schema.createTable('student_term_gpas', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('academic_term_id').unsigned().notNullable();
    table.decimal('gpa', 4, 2).nullable();
    table.integer('credit_hours').notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.unique(['student_id', 'academic_term_id']);
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('academic_term_id').references('id').inTable('academic_terms').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('student_term_gpas');
}
