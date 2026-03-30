export async function up(knex) {
  await knex.schema.alterTable('role_user', (table) => {
    table.bigInteger('faculty_id').unsigned().nullable();
    table.bigInteger('department_id').unsigned().nullable();
    table.foreign('faculty_id').references('id').inTable('faculties').onDelete('SET NULL');
    table.foreign('department_id').references('id').inTable('departments').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('role_user', (table) => {
    table.dropForeign(['faculty_id']);
    table.dropForeign(['department_id']);
    table.dropColumn('faculty_id');
    table.dropColumn('department_id');
  });
}
