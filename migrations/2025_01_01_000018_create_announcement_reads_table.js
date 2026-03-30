export async function up(knex) {
  await knex.schema.createTable('announcement_reads', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('announcement_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();
    table.timestamp('read_at').defaultTo(knex.fn.now());

    table.unique(['announcement_id', 'user_id']);
    table.foreign('announcement_id').references('id').inTable('announcements').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('announcement_reads');
}
