export async function up(knex) {
  await knex.schema.createTable('attendance_sessions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('section_id').unsigned().notNullable();
    table.bigInteger('created_by').unsigned().notNullable();
    table.date('session_date').notNullable();
    table.string('topic', 255).nullable();
    table.timestamps(true, true);

    table.unique(['section_id', 'session_date']);
    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });

  await knex.schema.createTable('attendance_records', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('attendance_session_id').unsigned().notNullable();
    table.bigInteger('student_id').unsigned().notNullable();
    table.enu('status', ['present', 'absent', 'late', 'excused']).notNullable().defaultTo('absent');
    table.string('note', 255).nullable();
    table.timestamps(true, true);

    table.unique(['attendance_session_id', 'student_id']);
    table.foreign('attendance_session_id').references('id').inTable('attendance_sessions').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('attendance_records');
  await knex.schema.dropTableIfExists('attendance_sessions');
}
