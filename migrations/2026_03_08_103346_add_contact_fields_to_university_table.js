export async function up(knex) {
  await knex.schema.alterTable('university', (table) => {
    table.string('phone').nullable();
    table.string('email').nullable();
    table.string('website').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('university', (table) => {
    table.dropColumn('phone');
    table.dropColumn('email');
    table.dropColumn('website');
  });
}
