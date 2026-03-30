import { getRoleId, hashPassword, insertRoleAssignment, nowTs, pick } from './_seed_utils.js';

const maleFirst = ['Ahmed','Mohamed','Khaled','Omar','Hossam','Tarek','Sherif','Walid','Amr','Ramy','Bassem','Adel','Islam','Ziad','Wael','Karim','Fady','Amir','Mostafa','Hassan'];
const femaleFirst = ['Rania','Dina','Sara','Iman','Noha','Mona','Hala','Ghada','Yasmine','Ola','Nadia','Rasha','Salma','Enas','Farida','Nour','Mariam','Hana','Reem','Donia'];
const lastNames = ['Farouk','ElSherif','Mansour','Kamal','Gaber','Helmy','Rizk','Fathy','Soliman','Wahba','ElMasry','Abdallah','Ibrahim','Naguib','Zaki','Yousef','Samir','Barakat','ElGohary','Fouad','Tawfik','Galal','Osman','Lotfy','Ashraf','Mustafa','Ramadan','Sobhy','Fawzy','Badawi'];
const ranks = ['professor','professor','associate_professor','associate_professor','assistant_professor','assistant_professor'];

const deptMeta = {
  CS: { specializations: ['Algorithms & Theory','Software Engineering','Computer Networks','Programming Languages','Human-Computer Interaction','Formal Methods'], building: 'CSIT Building' },
  IS: { specializations: ['Database Systems','Enterprise Architecture','Business Intelligence','ERP Systems','Information Security','Cloud Computing'], building: 'CSIT Building' },
  CYB: { specializations: ['Network Security','Cryptography','Penetration Testing','Digital Forensics','Malware Analysis','Security Governance'], building: 'CSIT Building' },
  AI: { specializations: ['Machine Learning','Deep Learning','Natural Language Processing','Computer Vision','Robotics','Reinforcement Learning'], building: 'CSIT Building' },
  CIVIL: { specializations: ['Structural Engineering','Geotechnical Engineering','Environmental Engineering','Transportation Engineering','Construction Management','Water Resources'], building: 'Engineering Block A' },
  ELEC: { specializations: ['Power Systems','Electronics & Circuits','Control Systems','Telecommunications','Signal Processing','Embedded Systems'], building: 'Engineering Block B' },
  MECH: { specializations: ['Thermodynamics','Fluid Mechanics','Manufacturing','Robotics & Automation','Materials Science','CAD/CAM'], building: 'Engineering Block C' },
  ARCH: { specializations: ['Urban Design','Architectural History','Sustainable Architecture','Interior Architecture','BIM & Digital Design','Landscape Architecture'], building: 'Architecture Studio' },
  'MED-INT': { specializations: ['Cardiology','Endocrinology','Gastroenterology','Rheumatology','Pulmonology','Nephrology'], building: 'Medical Complex' },
  'MED-SURG': { specializations: ['General Surgery','Orthopedic Surgery','Neurosurgery','Cardiothoracic Surgery','Plastic Surgery','Vascular Surgery'], building: 'Medical Complex' },
  'MED-PHAR': { specializations: ['Clinical Pharmacology','Pharmacokinetics','Drug Discovery','Toxicology','Pharmacogenomics','Neuropharmacology'], building: 'Medical Complex' },
  'MED-PATH': { specializations: ['Histopathology','Clinical Pathology','Forensic Pathology','Molecular Pathology','Cytopathology','Immunopathology'], building: 'Medical Complex' },
  MKT: { specializations: ['Digital Marketing','Consumer Behavior','Brand Management','Market Research','International Marketing','Advertising'], building: 'Business Tower' },
  'BUS-FIN': { specializations: ['Investment & Portfolio','Corporate Finance','Financial Derivatives','Banking','Risk Management','Islamic Finance'], building: 'Business Tower' },
  'BUS-HR': { specializations: ['Organizational Behavior','Talent Management','Labor Relations','Training & Development','Performance Management','Compensation & Benefits'], building: 'Business Tower' },
  ACCT: { specializations: ['Financial Accounting','Managerial Accounting','Auditing','Tax Accounting','Cost Accounting','Forensic Accounting'], building: 'Business Tower' },
  'LAW-PUB': { specializations: ['Constitutional Law','Administrative Law','International Public Law','Human Rights Law','Environmental Law','Tax Law'], building: 'Law Building' },
  'LAW-PRI': { specializations: ['Commercial Law','Contract Law','Property Law','Family Law','Intellectual Property','Civil Procedure'], building: 'Law Building' },
  'LAW-CRI': { specializations: ['Criminal Law','Criminal Procedure','Criminology','Juvenile Justice','Cyber Crime Law','International Criminal Law'], building: 'Law Building' },
  'ENG-GEN': { specializations: ['Foundation Mathematics','Applied Physics','Engineering Drawing','Technical Communication','Introduction to Engineering','Computer-Aided Design'], building: 'Engineering Block A' },
  'BUS-GEN': { specializations: ['Introduction to Business','Business Mathematics','Microeconomics','Business Communication','Office Administration','Organizational Management'], building: 'Business Tower' },
  'MED-GEN': { specializations: ['Anatomy','Physiology','Biochemistry','Medical Ethics','Histology','Embryology'], building: 'Medical Complex' },
  'LAW-GEN': { specializations: ['Introduction to Law','Legal Reasoning','Legal Research & Writing','Constitutional Foundations','History of Law','Comparative Law'], building: 'Law Building' },
};

export async function seed(knex) {
  const existing = await knex('professors').first('id');
  if (existing) return;

  const now = nowTs();
  const password = hashPassword('241996');
  const professorRole = await getRoleId(knex, 'professor');
  const deanRole = await getRoleId(knex, 'dean');
  const headRole = await getRoleId(knex, 'department_head');

  const departments = await knex('departments')
    .where({ type: 'academic' })
    .whereNotNull('faculty_id')
    .orderBy('faculty_id')
    .orderBy('id')
    .select('id', 'code', 'faculty_id');

  let nationalIdCounter = 20000000000000;
  let staffCounter = 0;
  const deanAssigned = new Set();

  for (const dept of departments) {
    const meta = deptMeta[dept.code] || { specializations: ['General Studies'], building: 'Main Building' };
    let firstProfUserId = null;

    for (let i = 0; i < meta.specializations.length; i += 1) {
      const isFemale = i % 3 === 2;
      const firstName = pick(isFemale ? femaleFirst : maleFirst, `${dept.code}${i}`);
      const lastName = pick(lastNames, `${dept.code}${i}l`);

      nationalIdCounter += 1;
      staffCounter += 1;

      const email = `${firstName[0].toLowerCase()}.${lastName.toLowerCase()}${staffCounter}@unione.com`;
      const staffNum = `PROF-${String(staffCounter).padStart(4, '0')}`;
      const rank = ranks[i % ranks.length];
      const hiredYear = 2000 + (i % 23);
      const dobYear = hiredYear - (27 + (i % 14));

      const [user] = await knex('users')
        .insert({
          national_id: String(nationalIdCounter),
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          gender: isFemale ? 'female' : 'male',
          date_of_birth: `${dobYear}-${String((i % 12) + 1).padStart(2, '0')}-01`,
          is_active: true,
          email_verified_at: now,
          created_at: now,
          updated_at: now,
        })
        .returning('id');

      await insertRoleAssignment(knex, {
        user_id: user.id,
        role_id: professorRole,
        granted_at: now,
        revoked_at: null,
        faculty_id: null,
        department_id: null,
      });

      const [prof] = await knex('professors')
        .insert({
          user_id: user.id,
          staff_number: staffNum,
          department_id: dept.id,
          specialization: meta.specializations[i],
          academic_rank: rank,
          office_location: `${meta.building}, Office ${(i + 1) * 10}${dept.id}`,
          hired_at: `${hiredYear}-09-01`,
          created_at: now,
          updated_at: now,
        })
        .returning('id');

      if (i === 0) {
        firstProfUserId = user.id;
        await insertRoleAssignment(knex, {
          user_id: user.id,
          role_id: headRole,
          department_id: dept.id,
          faculty_id: null,
          granted_at: now,
          revoked_at: null,
        });
        await knex('departments').where({ id: dept.id }).update({ head_id: user.id, updated_at: now });
      }

      if (i === 0 && !deanAssigned.has(dept.faculty_id)) {
        deanAssigned.add(dept.faculty_id);
        await insertRoleAssignment(knex, {
          user_id: user.id,
          role_id: deanRole,
          faculty_id: dept.faculty_id,
          department_id: null,
          granted_at: now,
          revoked_at: null,
        });
        await knex('faculties').where({ id: dept.faculty_id }).update({ dean_id: user.id, updated_at: now });
      }
    }

    if (!firstProfUserId) {
      // no-op
    }
  }
}
