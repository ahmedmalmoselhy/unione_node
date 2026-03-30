export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('national_id').notNullable().unique();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('phone').nullable();
    table.enu('gender', ['male', 'female']).notNullable();
    table.date('date_of_birth').nullable();
    table.string('avatar_path').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('email_verified_at').nullable();
    table.string('remember_token').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().index();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
