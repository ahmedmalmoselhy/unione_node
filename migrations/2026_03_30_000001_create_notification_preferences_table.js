export async function up(knex) {
  await knex.schema.createTable('notification_preferences', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable();
    table.string('event_type', 100).notNullable();
    table.boolean('is_enabled').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.unique(['user_id', 'event_type']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notification_preferences');
}
