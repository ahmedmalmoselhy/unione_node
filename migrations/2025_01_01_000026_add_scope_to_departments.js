export async function up(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.enu('scope', ['university', 'faculty']).notNullable().defaultTo('faculty');
  });

  await knex.raw('ALTER TABLE departments ALTER COLUMN faculty_id DROP NOT NULL');
}

export async function down(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.dropColumn('scope');
  });

  await knex.raw('ALTER TABLE departments ALTER COLUMN faculty_id SET NOT NULL');
}
