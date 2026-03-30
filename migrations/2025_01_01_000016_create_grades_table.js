export async function up(knex) {
  await knex.schema.createTable('grades', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('enrollment_id').unsigned().notNullable().unique();
    table.decimal('midterm', 5, 2).nullable();
    table.decimal('final', 5, 2).nullable();
    table.decimal('coursework', 5, 2).nullable();
    table.decimal('total', 5, 2).nullable();
    table.string('letter_grade', 3).nullable();
    table.decimal('grade_points', 3, 2).nullable();
    table.bigInteger('graded_by').unsigned().nullable();
    table.timestamp('graded_at').nullable();
    table.timestamps(true, true);

    table.foreign('enrollment_id').references('id').inTable('enrollments').onDelete('CASCADE');
    table.foreign('graded_by').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('grades');
}
