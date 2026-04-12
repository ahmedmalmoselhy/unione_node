import { success } from '../utils/response.js';
import {
  exportStudents,
  exportProfessors,
  exportEmployees,
  exportEnrollments,
  exportGrades,
  buildCsvDownload,
} from '../services/adminExportService.js';
import XLSX from 'xlsx';

/**
 * Parse CSV string to JSON array
 * @param {string} csvText - CSV content
 * @returns {Array} JSON array
 */
function csvToJson(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Convert CSV to Excel buffer
 * @param {string} csvText - CSV content
 * @returns {Buffer} Excel file buffer
 */
function csvToExcel(csvText) {
  const jsonData = csvToJson(csvText);
  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Send CSV response
 */
function sendCsv(res, filenameBase, csv) {
  const { filename, content } = buildCsvDownload(filenameBase, csv);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(content);
}

/**
 * Send Excel response
 */
function sendExcel(res, filenameBase, csv) {
  const excelBuffer = csvToExcel(csv);
  const filename = `${filenameBase}-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(excelBuffer);
}

/**
 * Determine export format from request
 */
function getExportFormat(req) {
  // Check query parameter
  if (req.query.format === 'excel' || req.query.format === 'xlsx') {
    return 'excel';
  }
  
  // Check Accept header
  const accept = req.headers.accept || '';
  if (accept.includes('spreadsheet') || accept.includes('excel')) {
    return 'excel';
  }
  
  return 'csv';
}

/**
 * POST /api/v1/admin/exports/students
 * Export students to CSV or Excel
 */
export async function students(req, res, next) {
  try {
    const csv = await exportStudents(req.query);
    const format = getExportFormat(req);
    
    if (format === 'excel') {
      return sendExcel(res, 'students-export', csv);
    }
    
    return sendCsv(res, 'students-export', csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/exports/professors
 * Export professors to CSV or Excel
 */
export async function professors(req, res, next) {
  try {
    const csv = await exportProfessors(req.query);
    const format = getExportFormat(req);
    
    if (format === 'excel') {
      return sendExcel(res, 'professors-export', csv);
    }
    
    return sendCsv(res, 'professors-export', csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/exports/employees
 * Export employees to CSV or Excel
 */
export async function employees(req, res, next) {
  try {
    const csv = await exportEmployees(req.query);
    const format = getExportFormat(req);
    
    if (format === 'excel') {
      return sendExcel(res, 'employees-export', csv);
    }
    
    return sendCsv(res, 'employees-export', csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/exports/enrollments
 * Export enrollments to CSV or Excel
 */
export async function enrollments(req, res, next) {
  try {
    const csv = await exportEnrollments(req.query);
    const format = getExportFormat(req);
    
    if (format === 'excel') {
      return sendExcel(res, 'enrollments-export', csv);
    }
    
    return sendCsv(res, 'enrollments-export', csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/exports/grades
 * Export grades to CSV or Excel
 */
export async function grades(req, res, next) {
  try {
    const csv = await exportGrades(req.query);
    const format = getExportFormat(req);
    
    if (format === 'excel') {
      return sendExcel(res, 'grades-export', csv);
    }
    
    return sendCsv(res, 'grades-export', csv);
  } catch (error) {
    return next(error);
  }
}
