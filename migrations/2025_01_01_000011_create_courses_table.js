export async function up(knex) {
  await knex.schema.createTable('courses', (table) => {
    table.bigIncrements('id').primary();
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.string('name_ar').notNullable();
    table.text('description').nullable();
    table.integer('credit_hours').notNullable();
    table.integer('lecture_hours').notNullable();
    table.integer('lab_hours').notNullable().defaultTo(0);
    table.integer('level').notNullable();
    table.boolean('is_elective').notNullable().defaultTo(false);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('courses');
}
