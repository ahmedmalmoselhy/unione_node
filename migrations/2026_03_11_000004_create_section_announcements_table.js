export async function up(knex) {
  await knex.schema.createTable('section_announcements', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('section_id').unsigned().notNullable();
    table.bigInteger('author_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.timestamp('published_at').nullable();
    table.timestamps(true, true);

    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
    table.foreign('author_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('section_announcements');
}
