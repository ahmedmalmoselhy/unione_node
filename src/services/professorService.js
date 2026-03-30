import {
  findProfessorProfileByUserId,
  listProfessorSectionsByUserId,
  findProfessorSectionById,
  listProfessorSectionStudents,
  listProfessorSectionGrades,
} from '../models/professorModel.js';

export async function getProfessorProfile(userId) {
  return findProfessorProfileByUserId(userId);
}

export async function getProfessorSections(userId, { academic_term_id: academicTermId } = {}) {
  return listProfessorSectionsByUserId(userId, { academicTermId });
}

export async function getProfessorSchedule(userId, query) {
  return getProfessorSections(userId, query);
}

export async function getProfessorSectionStudents(userId, sectionId) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  return listProfessorSectionStudents(userId, sectionId);
}

export async function getProfessorSectionGrades(userId, sectionId) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  return listProfessorSectionGrades(userId, sectionId);
}

export default {
  getProfessorProfile,
  getProfessorSections,
  getProfessorSchedule,
  getProfessorSectionStudents,
  getProfessorSectionGrades,
};
