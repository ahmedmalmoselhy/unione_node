import { nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const facultyRows = await knex('faculties').select('id', 'code');
  const faculties = Object.fromEntries(facultyRows.map((f) => [f.code, f.id]));

  const departments = [
    { faculty_id: null, name: 'Human Resources', name_ar: 'الموارد البشرية', code: 'HR', type: 'managerial', scope: 'university', is_preparatory: false, is_mandatory: false },
    { faculty_id: null, name: 'Finance & Accounting', name_ar: 'المالية والمحاسبة', code: 'FIN', type: 'managerial', scope: 'university', is_preparatory: false, is_mandatory: false },
    { faculty_id: null, name: 'Information Technology', name_ar: 'تقنية المعلومات', code: 'IT-MGMT', type: 'managerial', scope: 'university', is_preparatory: false, is_mandatory: false },
    { faculty_id: null, name: 'Student Affairs', name_ar: 'شؤون الطلاب', code: 'SA', type: 'managerial', scope: 'university', is_preparatory: false, is_mandatory: false },
    { faculty_id: null, name: 'Admissions & Registration', name_ar: 'القبول والتسجيل', code: 'ADM', type: 'managerial', scope: 'university', is_preparatory: false, is_mandatory: false },

    { faculty_id: faculties.CSIT, name: 'Students Care', name_ar: 'رعاية الطلاب', code: 'CSIT-SC', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.CSIT, name: 'Students Affairs', name_ar: 'شؤون الطلاب', code: 'CSIT-SA', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.CSIT, name: 'Legal', name_ar: 'الشؤون القانونية', code: 'CSIT-LGL', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.CSIT, name: 'Computer Science', name_ar: 'علوم الحاسب', code: 'CS', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.CSIT, name: 'Information Systems', name_ar: 'نظم المعلومات', code: 'IS', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.CSIT, name: 'Cybersecurity', name_ar: 'الأمن السيبراني', code: 'CYB', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.CSIT, name: 'Artificial Intelligence', name_ar: 'الذكاء الاصطناعي', code: 'AI', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },

    { faculty_id: faculties.ENG, name: 'Students Care', name_ar: 'رعاية الطلاب', code: 'ENG-SC', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.ENG, name: 'Students Affairs', name_ar: 'شؤون الطلاب', code: 'ENG-SA', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.ENG, name: 'Legal', name_ar: 'الشؤون القانونية', code: 'ENG-LGL', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.ENG, name: 'General', name_ar: 'القسم العام', code: 'ENG-GEN', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.ENG, name: 'Civil Engineering', name_ar: 'الهندسة المدنية', code: 'CIVIL', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.ENG, name: 'Electrical Engineering', name_ar: 'الهندسة الكهربائية', code: 'ELEC', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.ENG, name: 'Mechanical Engineering', name_ar: 'الهندسة الميكانيكية', code: 'MECH', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.ENG, name: 'Architecture', name_ar: 'العمارة والتصميم', code: 'ARCH', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },

    { faculty_id: faculties.MED, name: 'Students Care', name_ar: 'رعاية الطلاب', code: 'MED-SC', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.MED, name: 'Students Affairs', name_ar: 'شؤون الطلاب', code: 'MED-SA', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.MED, name: 'Legal', name_ar: 'الشؤون القانونية', code: 'MED-LGL', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.MED, name: 'General', name_ar: 'القسم العام', code: 'MED-GEN', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.MED, name: 'Internal Medicine', name_ar: 'الطب الباطني', code: 'MED-INT', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.MED, name: 'Surgery', name_ar: 'الجراحة', code: 'MED-SURG', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.MED, name: 'Pharmacology', name_ar: 'علم الأدوية', code: 'MED-PHAR', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.MED, name: 'Pathology', name_ar: 'علم الأمراض', code: 'MED-PATH', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },

    { faculty_id: faculties.BUS, name: 'Students Care', name_ar: 'رعاية الطلاب', code: 'BUS-SC', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.BUS, name: 'Students Affairs', name_ar: 'شؤون الطلاب', code: 'BUS-SA', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.BUS, name: 'Legal', name_ar: 'الشؤون القانونية', code: 'BUS-LGL', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.BUS, name: 'General', name_ar: 'القسم العام', code: 'BUS-GEN', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.BUS, name: 'Marketing', name_ar: 'التسويق', code: 'MKT', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.BUS, name: 'Finance & Banking', name_ar: 'المالية والمصرفية', code: 'BUS-FIN', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.BUS, name: 'Human Resource Mgmt', name_ar: 'إدارة الموارد البشرية', code: 'BUS-HR', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.BUS, name: 'Accounting', name_ar: 'المحاسبة', code: 'ACCT', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },

    { faculty_id: faculties.LAW, name: 'Students Care', name_ar: 'رعاية الطلاب', code: 'LAW-SC', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.LAW, name: 'Students Affairs', name_ar: 'شؤون الطلاب', code: 'LAW-SA', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.LAW, name: 'Legal', name_ar: 'الشؤون القانونية', code: 'LAW-LGL', type: 'managerial', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.LAW, name: 'General', name_ar: 'القسم العام', code: 'LAW-GEN', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: true },
    { faculty_id: faculties.LAW, name: 'Public Law', name_ar: 'القانون العام', code: 'LAW-PUB', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.LAW, name: 'Private Law', name_ar: 'القانون الخاص', code: 'LAW-PRI', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
    { faculty_id: faculties.LAW, name: 'Criminal Law', name_ar: 'القانون الجنائي', code: 'LAW-CRI', type: 'academic', scope: 'faculty', is_preparatory: false, is_mandatory: false },
  ];

  for (const dept of departments) {
    const existing = await knex('departments').where({ code: dept.code }).first('id');
    const payload = { ...dept, is_active: true, updated_at: now };
    if (existing) {
      await knex('departments').where({ id: existing.id }).update(payload);
    } else {
      await knex('departments').insert({ ...payload, created_at: now });
    }
  }
}
