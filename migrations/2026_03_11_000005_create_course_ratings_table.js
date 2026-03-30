export async function up(knex) {
  await knex.schema.createTable('course_ratings', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('enrollment_id').unsigned().notNullable().unique();
    table.integer('rating').notNullable();
    table.text('comment').nullable();
    table.timestamp('rated_at').notNullable();
    table.timestamps(true, true);

    table.foreign('enrollment_id').references('id').inTable('enrollments').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('course_ratings');
}
