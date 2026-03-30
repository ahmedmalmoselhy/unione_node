export async function up(knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary();
    table.string('type').notNullable();
    table.string('notifiable_type').notNullable();
    table.bigInteger('notifiable_id').unsigned().notNullable();
    table.text('data').notNullable();
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);

    table.index(['notifiable_type', 'notifiable_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
}
