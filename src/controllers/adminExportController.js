import { success } from '../utils/response.js';
import {
  exportStudents,
  exportProfessors,
  exportEmployees,
  exportEnrollments,
  exportGrades,
  buildCsvDownload,
} from '../services/adminExportService.js';

function sendCsv(res, filenameBase, csv) {
  const { filename, content } = buildCsvDownload(filenameBase, csv);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(content);
}

export async function students(req, res, next) {
  try {
    const csv = await exportStudents(req.query);
    return sendCsv(res, 'students-export', csv);
  } catch (error) {
    return next(error);
  }
}

export async function professors(req, res, next) {
  try {
    const csv = await exportProfessors(req.query);
    return sendCsv(res, 'professors-export', csv);
  } catch (error) {
    return next(error);
  }
}

export async function employees(req, res, next) {
  try {
    const csv = await exportEmployees(req.query);
    return sendCsv(res, 'employees-export', csv);
  } catch (error) {
    return next(error);
  }
}

export async function enrollments(req, res, next) {
  try {
    const csv = await exportEnrollments(req.query);
    return sendCsv(res, 'enrollments-export', csv);
  } catch (error) {
    return next(error);
  }
}

export async function grades(req, res, next) {
  try {
    const csv = await exportGrades(req.query);
    return sendCsv(res, 'grades-export', csv);
  } catch (error) {
    return next(error);
  }
}