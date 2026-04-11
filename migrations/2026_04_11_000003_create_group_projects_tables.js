export async function up(knex) {
  await knex.schema.createTable('group_projects', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('section_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.timestamp('due_at').nullable();
    table.integer('max_members').notNullable().defaultTo(5);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.bigInteger('created_by_user_id').unsigned().nullable();
    table.timestamps(true, true);

    table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
    table.foreign('created_by_user_id').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.createTable('group_project_members', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('group_project_id').unsigned().notNullable();
    table.bigInteger('student_id').unsigned().notNullable();
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.unique(['group_project_id', 'student_id']);
    table.foreign('group_project_id').references('id').inTable('group_projects').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('group_project_members');
  await knex.schema.dropTableIfExists('group_projects');
}
