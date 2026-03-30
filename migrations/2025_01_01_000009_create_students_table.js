export async function up(knex) {
  await knex.schema.createTable('students', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().unique();
    table.string('student_number').notNullable().unique();
    table.bigInteger('faculty_id').unsigned().notNullable();
    table.bigInteger('department_id').unsigned().nullable();
    table.integer('academic_year').notNullable().defaultTo(1);
    table.enu('semester', ['first', 'second', 'summer']).notNullable().defaultTo('first');
    table.enu('enrollment_status', ['active', 'suspended', 'graduated', 'withdrawn']).notNullable().defaultTo('active');
    table.decimal('gpa', 3, 2).nullable();
    table.date('enrolled_at').notNullable();
    table.date('graduated_at').nullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('faculty_id').references('id').inTable('faculties').onDelete('RESTRICT');
    table.foreign('department_id').references('id').inTable('departments').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('students');
}
