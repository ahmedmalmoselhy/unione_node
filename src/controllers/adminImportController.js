import { success, error as errorResponse } from '../utils/response.js';
import {
  importStudentsFromCsv,
  importProfessorsFromCsv,
  importGradesFromCsv,
} from '../services/adminImportService.js';
import XLSX from 'xlsx';

/**
 * Extract content from uploaded file (CSV or Excel)
 * @param {object} req - Express request
 * @returns {string|null} File content as string
 */
function extractFileContent(req) {
  // Handle file uploads (multipart/form-data)
  if (req.file?.buffer) {
    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;
    const originalName = req.file.originalname || '';
    
    // Check if Excel file
    const isExcel = mimetype.includes('spreadsheet') || 
                    mimetype.includes('excel') ||
                    originalName.match(/\.(xlsx|xls)$/i);
    
    if (isExcel) {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert to CSV-like format
      if (jsonData.length === 0) return null;
      
      const headers = jsonData[0].join(',');
      const rows = jsonData.slice(1).map(row => row.join(','));
      return [headers, ...rows].join('\n');
    }
    
    // CSV file
    return fileBuffer.toString('utf8');
  }

  // Handle CSV string in body
  if (typeof req.body?.csv === 'string') {
    return req.body.csv;
  }
  
  // Handle Excel data in body (JSON format)
  if (req.body?.excel_data && Array.isArray(req.body.excel_data)) {
    const headers = req.body.excel_data[0].join(',');
    const rows = req.body.excel_data.slice(1).map(row => row.join(','));
    return [headers, ...rows].join('\n');
  }

  return null;
}

/**
 * Determine if file is supported (CSV or Excel)
 */
function getFileType(req) {
  if (req.file) {
    const mimetype = req.file.mimetype;
    const originalName = req.file.originalname || '';
    
    if (mimetype.includes('spreadsheet') || 
        mimetype.includes('excel') ||
        originalName.match(/\.(xlsx|xls)$/i)) {
      return 'Excel';
    }
    return 'CSV';
  }
  
  return req.body?.excel_data ? 'Excel (JSON)' : 'CSV';
}

function missingFileResponse() {
  return errorResponse('File (CSV or Excel) is required', 422);
}

/**
 * POST /api/v1/admin/imports/students
 * Import students from CSV or Excel file
 */
export async function students(req, res, next) {
  try {
    const fileContent = extractFileContent(req);
    if (!fileContent) {
      return res.status(422).json(missingFileResponse());
    }

    const fileType = getFileType(req);
    const result = await importStudentsFromCsv(fileContent);
    
    return res.status(200).json(success({
      ...result,
      file_type: fileType,
    }, `Students imported successfully from ${fileType}`, 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/imports/professors
 * Import professors from CSV or Excel file
 */
export async function professors(req, res, next) {
  try {
    const fileContent = extractFileContent(req);
    if (!fileContent) {
      return res.status(422).json(missingFileResponse());
    }

    const fileType = getFileType(req);
    const result = await importProfessorsFromCsv(fileContent);
    
    return res.status(200).json(success({
      ...result,
      file_type: fileType,
    }, `Professors imported successfully from ${fileType}`, 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/imports/grades
 * Import grades from CSV or Excel file
 */
export async function grades(req, res, next) {
  try {
    const fileContent = extractFileContent(req);
    if (!fileContent) {
      return res.status(422).json(missingFileResponse());
    }

    const fileType = getFileType(req);
    const result = await importGradesFromCsv(fileContent);
    
    return res.status(200).json(success({
      ...result,
      file_type: fileType,
    }, `Grades imported successfully from ${fileType}`, 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  students,
  professors,
  grades,
};
