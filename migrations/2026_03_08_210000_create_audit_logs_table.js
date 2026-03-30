export async function up(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().nullable();
    table.string('action').notNullable();
    table.string('auditable_type').notNullable();
    table.bigInteger('auditable_id').unsigned().nullable();
    table.text('description').notNullable();
    table.json('old_values').nullable();
    table.json('new_values').nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
}
