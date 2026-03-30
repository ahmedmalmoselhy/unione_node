export async function up(knex) {
  await knex.schema.createTable('announcements', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('author_id').unsigned().notNullable();
    table.string('title').notNullable();
    table.text('body').notNullable();
    table.enu('type', ['general', 'academic', 'administrative', 'urgent']).notNullable();
    table.enu('visibility', ['university', 'faculty', 'department', 'section']).notNullable();
    table.bigInteger('target_id').unsigned().nullable();
    table.timestamp('published_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().index();

    table.index(['visibility', 'target_id']);
    table.index('published_at');
    table.foreign('author_id').references('id').inTable('users').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('announcements');
}
