export async function up(knex) {
  await knex.schema.createTable('jobs', (table) => {
    table.bigIncrements('id').primary();
    table.string('queue').notNullable().index();
    table.text('payload').notNullable();
    table.integer('attempts').notNullable();
    table.integer('reserved_at').nullable();
    table.integer('available_at').notNullable();
    table.integer('created_at').notNullable();
  });

  await knex.schema.createTable('job_batches', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.integer('total_jobs').notNullable();
    table.integer('pending_jobs').notNullable();
    table.integer('failed_jobs').notNullable();
    table.text('failed_job_ids').notNullable();
    table.text('options').nullable();
    table.integer('cancelled_at').nullable();
    table.integer('created_at').notNullable();
    table.integer('finished_at').nullable();
  });

  await knex.schema.createTable('failed_jobs', (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid').notNullable().unique();
    table.text('connection').notNullable();
    table.text('queue').notNullable();
    table.text('payload').notNullable();
    table.text('exception').notNullable();
    table.timestamp('failed_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('failed_jobs');
  await knex.schema.dropTableIfExists('job_batches');
  await knex.schema.dropTableIfExists('jobs');
}
