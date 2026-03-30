export async function up(knex) {
  await knex.schema.createTable('departments', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('faculty_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.string('name_ar').notNullable();
    table.string('code').notNullable().unique();
    table.enu('type', ['academic', 'managerial']).notNullable();
    table.boolean('is_preparatory').notNullable().defaultTo(false);
    table.bigInteger('head_id').unsigned().nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.foreign('faculty_id').references('id').inTable('faculties').onDelete('CASCADE');
    table.foreign('head_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('departments');
}
