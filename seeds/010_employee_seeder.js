import { getRoleId, hashPassword, insertRoleAssignment, nowTs, pick } from './_seed_utils.js';

const deptJobs = {
  HR: ['HR Director', 'HR Manager', 'Recruitment Specialist', 'HR Officer', 'Payroll Officer'],
  FIN: ['Chief Financial Officer', 'Senior Accountant', 'Budget Analyst', 'Finance Officer', 'Payroll Officer'],
  'IT-MGMT': ['IT Director', 'Systems Administrator', 'Network Engineer', 'Technical Support', 'Software Developer'],
  SA: ['Student Affairs Director', 'Student Counselor', 'Affairs Officer', 'Student Support Spec.', 'Welfare Officer'],
  ADM: ['Registrar', 'Admissions Director', 'Admissions Officer', 'Records Officer', 'Archive Officer'],
  'CSIT-SC': ['Student Care Director', 'Welfare Coordinator', 'Support Officer', 'Wellness Coach', 'Care Officer'],
  'CSIT-SA': ['Student Affairs Director', 'Affairs Coordinator', 'Events Officer', 'Activities Officer', 'Admin Officer'],
  'CSIT-LGL': ['Legal Affairs Director', 'Legal Counsel', 'Compliance Officer', 'Legal Officer', 'Contract Spec.'],
  'ENG-SC': ['Student Care Director', 'Welfare Coordinator', 'Support Officer', 'Wellness Coach', 'Care Officer'],
  'ENG-SA': ['Student Affairs Director', 'Affairs Coordinator', 'Events Officer', 'Activities Officer', 'Admin Officer'],
  'ENG-LGL': ['Legal Affairs Director', 'Legal Counsel', 'Compliance Officer', 'Legal Officer', 'Contract Spec.'],
  'MED-SC': ['Student Care Director', 'Welfare Coordinator', 'Support Officer', 'Wellness Coach', 'Care Officer'],
  'MED-SA': ['Student Affairs Director', 'Affairs Coordinator', 'Events Officer', 'Activities Officer', 'Admin Officer'],
  'MED-LGL': ['Legal Affairs Director', 'Legal Counsel', 'Compliance Officer', 'Legal Officer', 'Contract Spec.'],
  'BUS-SC': ['Student Care Director', 'Welfare Coordinator', 'Support Officer', 'Wellness Coach', 'Care Officer'],
  'BUS-SA': ['Student Affairs Director', 'Affairs Coordinator', 'Events Officer', 'Activities Officer', 'Admin Officer'],
  'BUS-LGL': ['Legal Affairs Director', 'Legal Counsel', 'Compliance Officer', 'Legal Officer', 'Contract Spec.'],
  'LAW-SC': ['Student Care Director', 'Welfare Coordinator', 'Support Officer', 'Wellness Coach', 'Care Officer'],
  'LAW-SA': ['Student Affairs Director', 'Affairs Coordinator', 'Events Officer', 'Activities Officer', 'Admin Officer'],
  'LAW-LGL': ['Legal Affairs Director', 'Legal Counsel', 'Compliance Officer', 'Legal Officer', 'Contract Spec.'],
};

const male = ['Ahmed','Mohamed','Khaled','Omar','Hossam','Tarek','Wael','Amr','Islam','Ziad','Karim','Fady','Amir','Mostafa','Hassan','Ramy','Bassem','Adel','Walid','Youssef'];
const female = ['Rania','Dina','Sara','Iman','Noha','Mona','Hala','Ghada','Yasmine','Ola','Nadia','Rasha','Salma','Enas','Farida','Nour','Mariam','Hana','Reem','Donia'];
const last = ['Osman','Hanna','Tawfik','Shawky','Lotfy','Ashraf','Mustafa','Galal','Ramadan','Khaled','Fathy','Soliman','Wahba','ElMasry','Abdallah','Ibrahim','Naguib','Zaki','Yousef','Samir','Fouad','Gaber','Mansour','Kamal','Helmy'];

export async function seed(knex) {
  const exists = await knex('employees').first('id');
  if (exists) return;

  const now = nowTs();
  const password = hashPassword('241996');
  const empRole = await getRoleId(knex, 'employee');
  const headRole = await getRoleId(knex, 'department_head');
  const depts = Object.fromEntries((await knex('departments').select('id', 'code')).map((d) => [d.code, d.id]));

  let nationalIdCounter = 30000000000000;
  let staffCounter = 0;

  for (const [deptCode, jobs] of Object.entries(deptJobs)) {
    if (!depts[deptCode]) continue;
    let firstUserId = null;

    for (let i = 0; i < jobs.length; i += 1) {
      nationalIdCounter += 1;
      staffCounter += 1;
      const isFemale = i % 3 === 2;
      const firstName = pick(isFemale ? female : male, `${deptCode}${i}f`);
      const lastName = pick(last, `${deptCode}${i}l`);
      const email = `${firstName[0].toLowerCase()}.${lastName.toLowerCase()}${staffCounter}@unione.com`;

      const [user] = await knex('users')
        .insert({
          national_id: String(nationalIdCounter),
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          gender: isFemale ? 'female' : 'male',
          date_of_birth: `${1985 - i}-0${i + 1}-15`,
          is_active: true,
          email_verified_at: now,
          created_at: now,
          updated_at: now,
        })
        .returning('id');

      await insertRoleAssignment(knex, { user_id: user.id, role_id: empRole, granted_at: now, revoked_at: null, faculty_id: null, department_id: null });

      await knex('employees').insert({
        user_id: user.id,
        staff_number: `EMP-${String(staffCounter).padStart(4, '0')}`,
        department_id: depts[deptCode],
        job_title: jobs[i],
        employment_type: i === 4 ? 'part_time' : 'full_time',
        salary: i === 0 ? 14000 + (i * 1000) : 5000 + (i * 800),
        hired_at: `${2010 + i}-09-01`,
        created_at: now,
        updated_at: now,
      });

      if (i === 0) firstUserId = user.id;
    }

    if (firstUserId) {
      await insertRoleAssignment(knex, {
        user_id: firstUserId,
        role_id: headRole,
        department_id: depts[deptCode],
        faculty_id: null,
        granted_at: now,
        revoked_at: null,
      });
      await knex('departments').where({ id: depts[deptCode] }).update({ head_id: firstUserId, updated_at: now });
    }
  }
}
