import path from 'node:path';
import { pathToFileURL } from 'node:url';
import db from '../config/knex.js';

const orderedSeedFiles = [
  '001_university_seeder.js',
  '002_role_seeder.js',
  '003_user_seeder.js',
  '004_university_admin_seeder.js',
  '005_faculty_seeder.js',
  '006_department_seeder.js',
  '007_course_seeder.js',
  '008_professor_seeder.js',
  '009_university_vice_president_seeder.js',
  '010_employee_seeder.js',
  '011_faculty_admin_seeder.js',
  '012_department_admin_seeder.js',
  '013_student_seeder.js',
  '014_academic_term_seeder.js',
  '015_section_seeder.js',
  '016_enrollment_seeder.js',
  '017_grade_seeder.js',
  '018_announcement_seeder.js',
];

async function run() {
  console.log('Starting ordered seed run...');

  for (const file of orderedSeedFiles) {
    const fullPath = path.resolve(process.cwd(), 'seeds', file);
    const mod = await import(pathToFileURL(fullPath).href);

    if (typeof mod.seed !== 'function') {
      throw new Error(`Missing seed export in ${file}`);
    }

    console.log(`Running ${file}`);
    await mod.seed(db);
  }

  console.log('All seeders completed successfully.');
}

run()
  .catch((error) => {
    console.error('Seeder run failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
