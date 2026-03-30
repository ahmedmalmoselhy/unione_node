import { getRoleId, hashPassword, insertRoleAssignment, nowTs, pick } from './_seed_utils.js';

const maleFirst = ['Ali','Omar','Youssef','Hassan','Karim','Tarek','Islam','Ahmad','Mostafa','Mohamed','Wael','Amr','Ramy','Adel','Ziad','Amir','Sherif','Khaled','Fady','Bassem','Mahmoud','Nader','Hossam','Sami','Raed'];
const femaleFirst = ['Mariam','Nour','Lina','Sara','Rania','Dina','Hana','Noha','Ola','Yasmine','Reem','Salma','Farida','Hala','Enas','Ghada','Donia','Mona','Nadia','Rasha','Iman','Maram','Laila','Dalia','Heba'];
const lastNames = ['Mohsen','Adel','Tarek','Samy','Nabil','Magdy','ElBadry','Samir','Fouad','Kamal','Fathy','Wahba','Ramadan','Soliman','Zaki','Mansour','Abdallah','Ibrahim','Naguib','Yousef','Gaber','Helmy','Rizk','Barakat','Osman','ElMasry','Galal','Tawfik','Khaled','Ashraf'];

export async function seed(knex) {
  const hasStudents = await knex('students').first('id');
  if (hasStudents) return;

  const now = nowTs();
  const password = hashPassword('241996');
  const roleId = await getRoleId(knex, 'student');
  const faculties = Object.fromEntries((await knex('faculties').select('id', 'code')).map((f) => [f.code, f.id]));
  const depts = Object.fromEntries((await knex('departments').select('id', 'code')).map((d) => [d.code, d.id]));

  let nationalIdCounter = 40000000000000;
  let studentCounter = 0;

  const seedStudent = async (facultyCode, deptCode, year, status, enrolledAt, graduatedAt = null) => {
    nationalIdCounter += 1;
    studentCounter += 1;

    const isFemale = studentCounter % 3 === 0;
    const firstName = pick(isFemale ? femaleFirst : maleFirst, `fn${studentCounter}`);
    const lastName = pick(lastNames, `ln${studentCounter}`);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentCounter}@student.unione.com`;
    const studentNum = `STU-${String(studentCounter).padStart(7, '0')}`;

    const [user] = await knex('users')
      .insert({
        national_id: String(nationalIdCounter),
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        gender: isFemale ? 'female' : 'male',
        date_of_birth: `${1995 + year}-${String((studentCounter % 12) + 1).padStart(2, '0')}-10`,
        is_active: status === 'active',
        email_verified_at: now,
        created_at: now,
        updated_at: now,
      })
      .returning('id');

    await insertRoleAssignment(knex, { user_id: user.id, role_id: roleId, granted_at: now, revoked_at: null, faculty_id: null, department_id: null });

    await knex('students').insert({
      user_id: user.id,
      student_number: studentNum,
      faculty_id: faculties[facultyCode],
      department_id: deptCode ? depts[deptCode] : null,
      academic_year: year,
      semester: 'first',
      enrollment_status: status,
      gpa: status === 'graduated' ? Number((2.5 + ((studentCounter % 150) / 100)).toFixed(2)) : null,
      enrolled_at: enrolledAt,
      graduated_at: graduatedAt,
      created_at: now,
      updated_at: now,
    });
  };

  for (const d of ['CS', 'IS', 'CYB', 'AI']) {
    for (let year = 1; year <= 4; year += 1) {
      for (let n = 0; n < 100; n += 1) {
        await seedStudent('CSIT', d, year, 'active', `${2025 - year}-09-15`);
      }
    }
    for (let n = 0; n < 40; n += 1) {
      await seedStudent('CSIT', d, 4, 'graduated', '2019-09-15', '2023-06-30');
    }
  }

  for (let n = 0; n < 100; n += 1) await seedStudent('ENG', 'ENG-GEN', 1, 'active', '2024-09-15');
  for (const d of ['CIVIL', 'ELEC', 'MECH', 'ARCH']) {
    for (let year = 2; year <= 4; year += 1) for (let n = 0; n < 100; n += 1) await seedStudent('ENG', d, year, 'active', `${2025 - year}-09-15`);
    for (let n = 0; n < 40; n += 1) await seedStudent('ENG', d, 4, 'graduated', '2019-09-15', '2023-06-30');
  }

  for (let n = 0; n < 100; n += 1) await seedStudent('BUS', 'BUS-GEN', 1, 'active', '2024-09-15');
  for (const d of ['MKT', 'BUS-FIN', 'BUS-HR', 'ACCT']) {
    for (let year = 2; year <= 4; year += 1) for (let n = 0; n < 100; n += 1) await seedStudent('BUS', d, year, 'active', `${2025 - year}-09-15`);
    for (let n = 0; n < 40; n += 1) await seedStudent('BUS', d, 4, 'graduated', '2019-09-15', '2023-06-30');
  }

  for (let year = 1; year <= 5; year += 1) for (let n = 0; n < 50; n += 1) await seedStudent('MED', 'MED-GEN', year, 'active', `${2025 - year}-09-15`);
  for (let n = 0; n < 50; n += 1) await seedStudent('MED', 'MED-GEN', 5, 'graduated', '2016-09-15', '2021-06-30');

  for (let year = 1; year <= 4; year += 1) for (let n = 0; n < 50; n += 1) await seedStudent('LAW', 'LAW-GEN', year, 'active', `${2025 - year}-09-15`);
  for (let n = 0; n < 40; n += 1) await seedStudent('LAW', 'LAW-GEN', 4, 'graduated', '2019-09-15', '2023-06-30');
}
