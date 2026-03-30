export async function up(knex) {
  await knex.schema.createTable('webhooks', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable();
    table.string('url', 2048).notNullable();
    table.string('secret', 64).notNullable();
    table.json('events').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('failure_count').notNullable().defaultTo(0);
    table.timestamp('last_triggered_at').nullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  await knex.schema.createTable('webhook_deliveries', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('webhook_id').unsigned().notNullable();
    table.string('event').notNullable();
    table.json('payload').notNullable();
    table.integer('response_status').nullable();
    table.text('response_body').nullable();
    table.integer('attempt').notNullable().defaultTo(1);
    table.timestamp('delivered_at').nullable();
    table.timestamps(true, true);

    table.foreign('webhook_id').references('id').inTable('webhooks').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('webhook_deliveries');
  await knex.schema.dropTableIfExists('webhooks');
}
