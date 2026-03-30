export async function up(knex) {
  await knex.schema.createTable('professors', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().unique();
    table.string('staff_number').notNullable().unique();
    table.bigInteger('department_id').unsigned().notNullable();
    table.string('specialization').notNullable();
    table.enu('academic_rank', ['lecturer', 'assistant_professor', 'associate_professor', 'professor']).notNullable();
    table.string('office_location').nullable();
    table.date('hired_at').notNullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('department_id').references('id').inTable('departments').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('professors');
}
