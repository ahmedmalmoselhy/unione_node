export async function up(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.integer('required_credit_hours').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.dropColumn('required_credit_hours');
  });
}
