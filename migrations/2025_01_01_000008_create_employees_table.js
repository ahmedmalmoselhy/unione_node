export async function up(knex) {
  await knex.schema.createTable('employees', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().unique();
    table.string('staff_number').notNullable().unique();
    table.bigInteger('department_id').unsigned().notNullable();
    table.string('job_title').notNullable();
    table.enu('employment_type', ['full_time', 'part_time', 'contract']).notNullable();
    table.decimal('salary', 10, 2).nullable();
    table.date('hired_at').notNullable();
    table.date('terminated_at').nullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('department_id').references('id').inTable('departments').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('employees');
}
