export async function up(knex) {
  await knex.schema.createTable('exam_schedules', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('section_id').unsigned().notNullable().unique();
    table.date('exam_date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.string('location', 255).nullable();
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('published_at').nullable();
    table.timestamps(true, true);

    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('exam_schedules');
}
