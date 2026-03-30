import { nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const deptRows = await knex('departments').select('id', 'code');
  const depts = Object.fromEntries(deptRows.map((d) => [d.code, d.id]));

  const courses = [
    { code: 'MATH101', name: 'Calculus I', name_ar: 'حساب التفاضل والتكامل 1', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'CS', shared_with: ['IS', 'CYB', 'AI'] },
    { code: 'MATH102', name: 'Calculus II', name_ar: 'حساب التفاضل والتكامل 2', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'CS', shared_with: ['IS', 'CYB', 'AI'] },
    { code: 'MATH201', name: 'Linear Algebra', name_ar: 'الجبر الخطي', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'CS', shared_with: ['AI', 'CYB'] },
    { code: 'MATH202', name: 'Discrete Mathematics', name_ar: 'الرياضيات المتقطعة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'CS', shared_with: ['IS', 'CYB'] },
    { code: 'CS101', name: 'Introduction to Programming', name_ar: 'مقدمة في البرمجة', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 1, is_elective: false, owner: 'CS', shared_with: ['IS', 'CYB', 'AI'] },
    { code: 'CS102', name: 'Data Structures', name_ar: 'هياكل البيانات', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'CS', shared_with: ['IS', 'AI'] },
    { code: 'CS103', name: 'Object-Oriented Programming', name_ar: 'البرمجة كائنية التوجه', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'CS', shared_with: ['IS'] },
    { code: 'CS201', name: 'Algorithms & Complexity', name_ar: 'الخوارزميات والتعقيد', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'CS', shared_with: ['AI'] },
    { code: 'CS301', name: 'Operating Systems', name_ar: 'أنظمة التشغيل', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'CS', shared_with: ['CYB'] },
    { code: 'CS302', name: 'Computer Architecture', name_ar: 'معمارية الحاسوب', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'CS', shared_with: [] },
    { code: 'CS401', name: 'Compiler Design', name_ar: 'تصميم المترجمات', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'CS', shared_with: [] },
    { code: 'CS402', name: 'Distributed Systems', name_ar: 'الأنظمة الموزعة', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: true, owner: 'CS', shared_with: ['IS'] },
    { code: 'IS201', name: 'Database Design & Management', name_ar: 'تصميم وإدارة قواعد البيانات', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'IS', shared_with: ['CS', 'CYB'] },
    { code: 'IS301', name: 'Systems Analysis & Design', name_ar: 'تحليل وتصميم الأنظمة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'IS', shared_with: [] },
    { code: 'IS302', name: 'Enterprise Resource Planning', name_ar: 'تخطيط موارد المؤسسة', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'IS', shared_with: [] },
    { code: 'IS401', name: 'Business Intelligence & Analytics', name_ar: 'ذكاء الأعمال والتحليلات', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: false, owner: 'IS', shared_with: ['AI'] },
    { code: 'CYB201', name: 'Network Fundamentals', name_ar: 'أساسيات الشبكات', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'CYB', shared_with: ['IS', 'CS'] },
    { code: 'CYB301', name: 'Ethical Hacking & Penetration Testing', name_ar: 'الاختراق الأخلاقي واختبار الاختراق', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'CYB', shared_with: [] },
    { code: 'CYB302', name: 'Cryptography & Information Security', name_ar: 'التشفير وأمن المعلومات', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'CYB', shared_with: ['CS'] },
    { code: 'CYB401', name: 'Digital Forensics', name_ar: 'الجنائيات الرقمية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: false, owner: 'CYB', shared_with: [] },
    { code: 'CYB402', name: 'Cloud Security', name_ar: 'أمن الحوسبة السحابية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: true, owner: 'CYB', shared_with: [] },
    { code: 'AI201', name: 'Probability & Statistics for AI', name_ar: 'الاحتمالات والإحصاء للذكاء الاصطناعي', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'AI', shared_with: ['CS'] },
    { code: 'AI301', name: 'Machine Learning', name_ar: 'التعلم الآلي', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'AI', shared_with: ['CS', 'IS'] },
    { code: 'AI302', name: 'Deep Learning & Neural Networks', name_ar: 'التعلم العميق والشبكات العصبية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'AI', shared_with: [] },
    { code: 'AI401', name: 'Natural Language Processing', name_ar: 'معالجة اللغات الطبيعية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: false, owner: 'AI', shared_with: [] },
    { code: 'AI402', name: 'Computer Vision', name_ar: 'رؤية الحاسوب', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: true, owner: 'AI', shared_with: [] },
    { code: 'ENG001', name: 'Engineering Mathematics I', name_ar: 'رياضيات هندسية 1', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'ENG-GEN', shared_with: ['CIVIL', 'ELEC', 'MECH', 'ARCH'] },
    { code: 'ENG002', name: 'Engineering Mathematics II', name_ar: 'رياضيات هندسية 2', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'ENG-GEN', shared_with: ['CIVIL', 'ELEC', 'MECH', 'ARCH'] },
    { code: 'ENG003', name: 'Engineering Drawing & CAD', name_ar: 'الرسم الهندسي والتصميم بالحاسوب', credit_hours: 2, lecture_hours: 1, lab_hours: 2, level: 1, is_elective: false, owner: 'ENG-GEN', shared_with: ['CIVIL', 'MECH', 'ARCH'] },
    { code: 'ENG004', name: 'Engineering Physics', name_ar: 'الفيزياء الهندسية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 1, is_elective: false, owner: 'ENG-GEN', shared_with: ['CIVIL', 'ELEC', 'MECH'] },
    { code: 'CIVIL201', name: 'Mechanics of Materials', name_ar: 'ميكانيكا المواد', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'CIVIL', shared_with: ['MECH'] },
    { code: 'CIVIL202', name: 'Fluid Mechanics', name_ar: 'ميكانيكا الموائع', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'CIVIL', shared_with: ['MECH'] },
    { code: 'CIVIL301', name: 'Structural Analysis', name_ar: 'تحليل الإنشاءات', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'CIVIL', shared_with: [] },
    { code: 'CIVIL302', name: 'Geotechnical Engineering', name_ar: 'الهندسة الجيوتقنية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'CIVIL', shared_with: [] },
    { code: 'CIVIL401', name: 'Reinforced Concrete Design', name_ar: 'تصميم الخرسانة المسلحة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'CIVIL', shared_with: [] },
    { code: 'ELEC201', name: 'Circuit Theory', name_ar: 'نظرية الدوائر الكهربائية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'ELEC', shared_with: [] },
    { code: 'ELEC202', name: 'Electronics I', name_ar: 'الإلكترونيات 1', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 2, is_elective: false, owner: 'ELEC', shared_with: [] },
    { code: 'ELEC301', name: 'Signals & Systems', name_ar: 'الإشارات والأنظمة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'ELEC', shared_with: [] },
    { code: 'ELEC401', name: 'Power Systems Analysis', name_ar: 'تحليل منظومات القدرة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'ELEC', shared_with: [] },
    { code: 'ELEC402', name: 'Renewable Energy Systems', name_ar: 'أنظمة الطاقة المتجددة', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: true, owner: 'ELEC', shared_with: [] },
    { code: 'MECH201', name: 'Thermodynamics I', name_ar: 'الديناميكا الحرارية 1', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'MECH', shared_with: [] },
    { code: 'MECH301', name: 'Machine Design', name_ar: 'تصميم الآلات', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'MECH', shared_with: [] },
    { code: 'MECH302', name: 'Manufacturing Processes', name_ar: 'عمليات التصنيع', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'MECH', shared_with: [] },
    { code: 'MECH401', name: 'Control Systems', name_ar: 'أنظمة التحكم', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'MECH', shared_with: ['ELEC'] },
    { code: 'ARCH201', name: 'Architectural Design I', name_ar: 'التصميم المعماري 1', credit_hours: 4, lecture_hours: 2, lab_hours: 4, level: 2, is_elective: false, owner: 'ARCH', shared_with: [] },
    { code: 'ARCH202', name: 'History of Architecture', name_ar: 'تاريخ العمارة', credit_hours: 2, lecture_hours: 2, lab_hours: 0, level: 2, is_elective: false, owner: 'ARCH', shared_with: [] },
    { code: 'ARCH301', name: 'Urban Planning', name_ar: 'التخطيط العمراني', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'ARCH', shared_with: [] },
    { code: 'ARCH401', name: 'Sustainable Architecture', name_ar: 'العمارة المستدامة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: true, owner: 'ARCH', shared_with: [] },
    { code: 'MED101', name: 'Human Anatomy', name_ar: 'علم تشريح الإنسان', credit_hours: 4, lecture_hours: 3, lab_hours: 2, level: 1, is_elective: false, owner: 'MED-INT', shared_with: ['MED-SURG', 'MED-PHAR', 'MED-PATH'] },
    { code: 'MED102', name: 'Physiology', name_ar: 'علم وظائف الأعضاء', credit_hours: 4, lecture_hours: 3, lab_hours: 2, level: 1, is_elective: false, owner: 'MED-INT', shared_with: ['MED-SURG', 'MED-PHAR', 'MED-PATH'] },
    { code: 'MED103', name: 'Biochemistry', name_ar: 'الكيمياء الحيوية', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 1, is_elective: false, owner: 'MED-PHAR', shared_with: ['MED-INT', 'MED-SURG', 'MED-PATH'] },
    { code: 'MED-INT301', name: 'Clinical Medicine I', name_ar: 'الطب السريري 1', credit_hours: 4, lecture_hours: 3, lab_hours: 2, level: 3, is_elective: false, owner: 'MED-INT', shared_with: [] },
    { code: 'MED-INT401', name: 'Cardiology', name_ar: 'أمراض القلب', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'MED-INT', shared_with: [] },
    { code: 'MED-INT402', name: 'Endocrinology', name_ar: 'الغدد الصماء', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'MED-INT', shared_with: [] },
    { code: 'MED-SURG301', name: 'Principles of Surgery', name_ar: 'مبادئ الجراحة', credit_hours: 4, lecture_hours: 3, lab_hours: 2, level: 3, is_elective: false, owner: 'MED-SURG', shared_with: [] },
    { code: 'MED-SURG401', name: 'General Surgery', name_ar: 'الجراحة العامة', credit_hours: 4, lecture_hours: 3, lab_hours: 2, level: 4, is_elective: false, owner: 'MED-SURG', shared_with: [] },
    { code: 'MED-PHAR301', name: 'General Pharmacology', name_ar: 'علم الأدوية العام', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'MED-PHAR', shared_with: ['MED-INT'] },
    { code: 'MED-PHAR401', name: 'Clinical Pharmacology', name_ar: 'علم الأدوية السريري', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'MED-PHAR', shared_with: [] },
    { code: 'BUS001', name: 'Principles of Economics', name_ar: 'مبادئ الاقتصاد', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'BUS-GEN', shared_with: ['MKT', 'BUS-FIN', 'BUS-HR', 'ACCT'] },
    { code: 'BUS002', name: 'Business Mathematics', name_ar: 'رياضيات الأعمال', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'BUS-GEN', shared_with: ['MKT', 'BUS-FIN', 'BUS-HR', 'ACCT'] },
    { code: 'BUS003', name: 'Introduction to Management', name_ar: 'مقدمة في الإدارة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'BUS-GEN', shared_with: ['MKT', 'BUS-FIN', 'BUS-HR', 'ACCT'] },
    { code: 'MKT201', name: 'Principles of Marketing', name_ar: 'مبادئ التسويق', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'MKT', shared_with: ['BUS-HR'] },
    { code: 'MKT301', name: 'Consumer Behavior', name_ar: 'سلوك المستهلك', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'MKT', shared_with: [] },
    { code: 'MKT302', name: 'Digital Marketing', name_ar: 'التسويق الرقمي', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'MKT', shared_with: [] },
    { code: 'MKT401', name: 'Strategic Marketing', name_ar: 'التسويق الاستراتيجي', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'MKT', shared_with: [] },
    { code: 'BUS-FIN201', name: 'Financial Accounting', name_ar: 'المحاسبة المالية', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'BUS-FIN', shared_with: ['MKT', 'BUS-HR'] },
    { code: 'BUS-FIN301', name: 'Corporate Finance', name_ar: 'تمويل الشركات', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'BUS-FIN', shared_with: [] },
    { code: 'BUS-FIN302', name: 'Investment & Portfolio Management', name_ar: 'إدارة الاستثمار والمحافظ', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'BUS-FIN', shared_with: [] },
    { code: 'BUS-FIN401', name: 'Banking Operations & Management', name_ar: 'عمليات وإدارة البنوك', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'BUS-FIN', shared_with: [] },
    { code: 'BUS-HR201', name: 'Organizational Behavior', name_ar: 'السلوك التنظيمي', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'BUS-HR', shared_with: ['MKT'] },
    { code: 'BUS-HR301', name: 'Recruitment & Selection', name_ar: 'التوظيف والاختيار', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'BUS-HR', shared_with: [] },
    { code: 'BUS-HR401', name: 'Performance Management', name_ar: 'إدارة الأداء', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'BUS-HR', shared_with: [] },
    { code: 'LAW101', name: 'Introduction to Law', name_ar: 'مقدمة في القانون', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 1, is_elective: false, owner: 'LAW-PUB', shared_with: ['LAW-PRI', 'LAW-CRI'] },
    { code: 'LAW102', name: 'Legal Research & Writing', name_ar: 'البحث والكتابة القانونية', credit_hours: 2, lecture_hours: 2, lab_hours: 0, level: 1, is_elective: false, owner: 'LAW-PUB', shared_with: ['LAW-PRI', 'LAW-CRI'] },
    { code: 'ACCT201', name: 'Intermediate Accounting', name_ar: 'المحاسبة المتوسطة', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'ACCT', shared_with: ['BUS-FIN'] },
    { code: 'ACCT301', name: 'Cost Accounting', name_ar: 'محاسبة التكاليف', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'ACCT', shared_with: [] },
    { code: 'ACCT302', name: 'Auditing & Assurance', name_ar: 'المراجعة والتحقق', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'ACCT', shared_with: [] },
    { code: 'ACCT401', name: 'Advanced Financial Reporting', name_ar: 'التقرير المالي المتقدم', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'ACCT', shared_with: [] },
    { code: 'MED-PATH301', name: 'Systemic Pathology', name_ar: 'علم الأمراض التجهيزي', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 3, is_elective: false, owner: 'MED-PATH', shared_with: ['MED-INT'] },
    { code: 'MED-PATH401', name: 'Molecular Pathology', name_ar: 'علم الأمراض الجزيئي', credit_hours: 3, lecture_hours: 2, lab_hours: 2, level: 4, is_elective: false, owner: 'MED-PATH', shared_with: [] },
    { code: 'LAW-PUB201', name: 'Constitutional Law', name_ar: 'القانون الدستوري', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'LAW-PUB', shared_with: [] },
    { code: 'LAW-PUB301', name: 'Administrative Law', name_ar: 'القانون الإداري', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'LAW-PUB', shared_with: [] },
    { code: 'LAW-PUB401', name: 'International Public Law', name_ar: 'القانون الدولي العام', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'LAW-PUB', shared_with: [] },
    { code: 'LAW-CRI201', name: 'Criminal Law', name_ar: 'قانون العقوبات', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'LAW-CRI', shared_with: ['LAW-PUB'] },
    { code: 'LAW-CRI301', name: 'Criminal Procedure', name_ar: 'الإجراءات الجنائية', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'LAW-CRI', shared_with: [] },
    { code: 'LAW-CRI401', name: 'Criminology & Penology', name_ar: 'علم الجريمة والعقوبات', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'LAW-CRI', shared_with: [] },
    { code: 'LAW-PRI201', name: 'Civil Law', name_ar: 'القانون المدني', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 2, is_elective: false, owner: 'LAW-PRI', shared_with: [] },
    { code: 'LAW-PRI301', name: 'Commercial Law', name_ar: 'القانون التجاري', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 3, is_elective: false, owner: 'LAW-PRI', shared_with: ['LAW-PUB'] },
    { code: 'LAW-PRI401', name: 'Private International Law', name_ar: 'القانون الدولي الخاص', credit_hours: 3, lecture_hours: 3, lab_hours: 0, level: 4, is_elective: false, owner: 'LAW-PRI', shared_with: [] }
  ];

  for (const c of courses) {
    let course = await knex('courses').where({ code: c.code }).first('id');
    const coursePayload = {
      code: c.code,
      name: c.name,
      name_ar: c.name_ar,
      credit_hours: c.credit_hours,
      lecture_hours: c.lecture_hours,
      lab_hours: c.lab_hours,
      level: c.level,
      is_elective: c.is_elective,
      is_active: true,
      updated_at: now,
    };

    if (!course) {
      const [inserted] = await knex('courses')
        .insert({ ...coursePayload, created_at: now })
        .returning('id');
      course = inserted;
    } else {
      await knex('courses').where({ id: course.id }).update(coursePayload);
    }

    if (depts[c.owner]) {
      await knex('department_course')
        .insert({ department_id: depts[c.owner], course_id: course.id, is_owner: true })
        .onConflict(['department_id', 'course_id'])
        .merge({ is_owner: true });
    }

    for (const sharedCode of c.shared_with) {
      if (!depts[sharedCode]) continue;
      await knex('department_course')
        .insert({ department_id: depts[sharedCode], course_id: course.id, is_owner: false })
        .onConflict(['department_id', 'course_id'])
        .merge({ is_owner: false });
    }
  }

  const codeRows = await knex('courses').select('id', 'code');
  const courseIds = Object.fromEntries(codeRows.map((r) => [r.code, r.id]));

  const prerequisites = {
    MATH102: ['MATH101'], MATH201: ['MATH102'], MATH202: ['MATH101'], CS102: ['CS101'], CS103: ['CS101'],
    CS201: ['CS102', 'MATH202'], CS301: ['CS201'], CS302: ['CS201'], CS401: ['CS301'], CS402: ['CS301'],
    IS201: ['CS101'], IS301: ['IS201', 'CS103'], IS302: ['IS301'], IS401: ['IS302'], CYB201: ['CS101'],
    CYB301: ['CYB201'], CYB302: ['CYB201', 'MATH202'], CYB401: ['CYB301'], CYB402: ['CYB301'], AI201: ['MATH101'],
    AI301: ['AI201', 'CS102', 'MATH201'], AI302: ['AI301'], AI401: ['AI302'], AI402: ['AI302'], ENG002: ['ENG001'],
    CIVIL201: ['ENG004'], CIVIL202: ['ENG004'], CIVIL301: ['CIVIL201'], CIVIL302: ['CIVIL201'], CIVIL401: ['CIVIL301'],
    ELEC201: ['ENG004', 'ENG001'], ELEC202: ['ELEC201'], ELEC301: ['ELEC202'], ELEC401: ['ELEC301'], ELEC402: ['ELEC301'],
    MECH201: ['ENG004'], MECH301: ['MECH201', 'CIVIL201'], MECH302: ['MECH201'], MECH401: ['MECH301'],
    ARCH201: ['ENG003'], ARCH301: ['ARCH201'], ARCH401: ['ARCH301'], 'MED-INT301': ['MED101', 'MED102'],
    'MED-INT401': ['MED-INT301'], 'MED-INT402': ['MED-INT301'], 'MED-SURG301': ['MED101', 'MED102'], 'MED-SURG401': ['MED-SURG301'],
    'MED-PHAR301': ['MED103'], 'MED-PHAR401': ['MED-PHAR301'], MKT201: ['BUS001', 'BUS003'], MKT301: ['MKT201'],
    MKT302: ['MKT201'], MKT401: ['MKT301'], 'BUS-FIN201': ['BUS001', 'BUS002'], 'BUS-FIN301': ['BUS-FIN201'],
    'BUS-FIN302': ['BUS-FIN301'], 'BUS-FIN401': ['BUS-FIN302'], 'BUS-HR201': ['BUS003'], 'BUS-HR301': ['BUS-HR201'],
    'BUS-HR401': ['BUS-HR301'], 'LAW-PUB201': ['LAW101'], 'LAW-PUB301': ['LAW-PUB201'], 'LAW-PUB401': ['LAW-PUB301'],
    'LAW-PRI201': ['LAW101'], 'LAW-PRI301': ['LAW-PRI201'], 'LAW-PRI401': ['LAW-PRI301'], 'LAW-CRI201': ['LAW101'],
    'LAW-CRI301': ['LAW-CRI201'], 'LAW-CRI401': ['LAW-CRI301'], ACCT201: ['BUS001', 'BUS002'], ACCT301: ['ACCT201'],
    ACCT302: ['ACCT201'], ACCT401: ['ACCT301'], 'MED-PATH301': ['MED101', 'MED102'], 'MED-PATH401': ['MED-PATH301'],
  };

  for (const [courseCode, prereqs] of Object.entries(prerequisites)) {
    const courseId = courseIds[courseCode];
    if (!courseId) continue;
    for (const p of prereqs) {
      const prereqId = courseIds[p];
      if (!prereqId) continue;
      await knex('course_prerequisites')
        .insert({ course_id: courseId, prerequisite_id: prereqId })
        .onConflict(['course_id', 'prerequisite_id'])
        .ignore();
    }
  }
}
