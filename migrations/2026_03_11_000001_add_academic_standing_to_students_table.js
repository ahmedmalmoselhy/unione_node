export async function up(knex) {
  await knex.schema.alterTable('students', (table) => {
    table.enu('academic_standing', ['good_standing', 'probation', 'dismissal']).nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('students', (table) => {
    table.dropColumn('academic_standing');
  });
}
