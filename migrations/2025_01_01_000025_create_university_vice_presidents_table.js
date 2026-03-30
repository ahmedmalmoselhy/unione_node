export async function up(knex) {
  await knex.schema.createTable('university_vice_presidents', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('professor_id').unsigned().notNullable().unique();
    table.string('title').notNullable();
    table.string('title_ar').notNullable();
    table.integer('order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.date('appointed_at').notNullable();
    table.date('ended_at').nullable();
    table.timestamps(true, true);

    table.foreign('professor_id').references('id').inTable('professors').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('university_vice_presidents');
}
