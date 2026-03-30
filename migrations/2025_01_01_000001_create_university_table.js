export async function up(knex) {
  await knex.schema.createTable('university', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable();
    table.string('name_ar').notNullable();
    table.text('address').notNullable();
    table.string('logo_path').nullable();
    table.date('established_at').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('university');
}
