export async function up(knex) {
  await knex.schema.alterTable('sections', (table) => {
    table.bigInteger('academic_term_id').unsigned().nullable();
  });

  await knex.schema.alterTable('sections', (table) => {
    table.foreign('academic_term_id').references('id').inTable('academic_terms').onDelete('RESTRICT');
    table.dropIndex(['course_id', 'academic_year', 'semester']);
    table.index(['course_id', 'academic_term_id']);
  });

  await knex.schema.alterTable('sections', (table) => {
    table.dropColumn('academic_year');
    table.dropColumn('semester');
  });

  await knex.schema.alterTable('enrollments', (table) => {
    table.bigInteger('academic_term_id').unsigned().nullable();
    table.foreign('academic_term_id').references('id').inTable('academic_terms').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('enrollments', (table) => {
    table.dropForeign(['academic_term_id']);
    table.dropColumn('academic_term_id');
  });

  await knex.schema.alterTable('sections', (table) => {
    table.dropForeign(['academic_term_id']);
    table.dropIndex(['course_id', 'academic_term_id']);
    table.dropColumn('academic_term_id');
  });

  await knex.schema.alterTable('sections', (table) => {
    table.integer('academic_year').notNullable();
    table.enu('semester', ['first', 'second', 'summer']).notNullable();
    table.index(['course_id', 'academic_year', 'semester']);
  });
}
