export async function up(knex) {
  await knex.schema.createTable('notification_quiet_hours', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().unique();
    table.string('start_time', 5).notNullable();
    table.string('end_time', 5).notNullable();
    table.string('timezone', 64).notNullable().defaultTo('UTC');
    table.boolean('is_enabled').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notification_quiet_hours');
}
