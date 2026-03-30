import { success, error as errorResponse } from '../utils/response.js';
import {
  getProfessorProfile,
  getProfessorSections,
  getProfessorSchedule,
  getProfessorSectionStudents,
  getProfessorSectionGrades,
} from '../services/professorService.js';

export async function profile(req, res, next) {
  try {
    const data = await getProfessorProfile(req.user.id);

    if (!data) {
      return res.status(404).json(errorResponse('Professor profile not found', 404));
    }

    return res.status(200).json(success(data, 'Professor profile fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function sections(req, res, next) {
  try {
    const data = await getProfessorSections(req.user.id, req.query);
    return res.status(200).json(success(data, 'Professor sections fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function schedule(req, res, next) {
  try {
    const data = await getProfessorSchedule(req.user.id, req.query);
    return res.status(200).json(success(data, 'Professor schedule fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function sectionStudents(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await getProfessorSectionStudents(req.user.id, sectionId);

    if (!data) {
      return res.status(404).json(errorResponse('Section not found for professor', 404));
    }

    return res.status(200).json(success(data, 'Section students fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function sectionGrades(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await getProfessorSectionGrades(req.user.id, sectionId);

    if (!data) {
      return res.status(404).json(errorResponse('Section not found for professor', 404));
    }

    return res.status(200).json(success(data, 'Section grades fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}
