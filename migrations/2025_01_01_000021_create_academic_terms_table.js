export async function up(knex) {
  await knex.schema.createTable('academic_terms', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable();
    table.string('name_ar').notNullable();
    table.integer('academic_year').notNullable();
    table.enu('semester', ['first', 'second', 'summer']).notNullable();
    table.date('starts_at').notNullable();
    table.date('ends_at').notNullable();
    table.date('registration_starts_at').notNullable();
    table.date('registration_ends_at').notNullable();
    table.date('withdrawal_deadline').nullable();
    table.date('exam_starts_at').nullable();
    table.date('exam_ends_at').nullable();
    table.date('grade_submission_deadline').nullable();
    table.boolean('is_active').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.unique(['academic_year', 'semester']);
    table.index('is_active');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('academic_terms');
}
