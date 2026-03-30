export async function up(knex) {
  await knex.schema.createTable('student_department_history', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('from_department_id').unsigned().nullable();
    table.bigInteger('to_department_id').unsigned().notNullable();
    table.timestamp('switched_at').defaultTo(knex.fn.now());
    table.bigInteger('switched_by').unsigned().notNullable();
    table.text('note').nullable();

    table.index('student_id');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('from_department_id').references('id').inTable('departments').onDelete('SET NULL');
    table.foreign('to_department_id').references('id').inTable('departments').onDelete('RESTRICT');
    table.foreign('switched_by').references('id').inTable('users').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('student_department_history');
}
