import { getImportTemplate } from '../services/adminImportTemplateService.js';

function sendTemplate(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
}

export async function students(req, res) {
  const csv = getImportTemplate('students');
  return sendTemplate(res, 'students_import_template.csv', csv);
}

export async function professors(req, res) {
  const csv = getImportTemplate('professors');
  return sendTemplate(res, 'professors_import_template.csv', csv);
}

export async function grades(req, res) {
  const csv = getImportTemplate('grades');
  return sendTemplate(res, 'grades_import_template.csv', csv);
}

export default {
  students,
  professors,
  grades,
};