export async function up(knex) {
  await knex.schema.createTable('faculties', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable();
    table.string('name_ar').notNullable();
    table.string('code').notNullable().unique();
    table.enu('enrollment_type', ['immediate', 'none', 'deferred']).notNullable();
    table.bigInteger('dean_id').unsigned().nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.foreign('dean_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('faculties');
}
