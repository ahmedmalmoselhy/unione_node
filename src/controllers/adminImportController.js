import { success, error as errorResponse } from '../utils/response.js';
import {
  importStudentsFromCsv,
  importProfessorsFromCsv,
  importGradesFromCsv,
} from '../services/adminImportService.js';

function extractCsvContent(req) {
  if (req.file?.buffer) {
    return req.file.buffer.toString('utf8');
  }

  if (typeof req.body?.csv === 'string') {
    return req.body.csv;
  }

  return null;
}

function missingCsvResponse() {
  return errorResponse('CSV file is required', 422);
}

export async function students(req, res, next) {
  try {
    const csvText = extractCsvContent(req);
    if (!csvText) {
      return res.status(422).json(missingCsvResponse());
    }

    const result = await importStudentsFromCsv(csvText);
    return res.status(200).json(success(result, 'Students imported successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function professors(req, res, next) {
  try {
    const csvText = extractCsvContent(req);
    if (!csvText) {
      return res.status(422).json(missingCsvResponse());
    }

    const result = await importProfessorsFromCsv(csvText);
    return res.status(200).json(success(result, 'Professors imported successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function grades(req, res, next) {
  try {
    const csvText = extractCsvContent(req);
    if (!csvText) {
      return res.status(422).json(missingCsvResponse());
    }

    const result = await importGradesFromCsv(csvText);
    return res.status(200).json(success(result, 'Grades imported successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  students,
  professors,
  grades,
};