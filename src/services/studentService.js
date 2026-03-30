import {
  findStudentProfileByUserId,
  listStudentEnrollmentsByUserId,
  listStudentGradesByUserId,
} from '../models/studentModel.js';

export async function getStudentProfile(userId) {
  return findStudentProfileByUserId(userId);
}

export async function getStudentEnrollments(userId, { status, academic_term_id: academicTermId } = {}) {
  return listStudentEnrollmentsByUserId(userId, {
    status,
    academicTermId,
  });
}

export async function getStudentGrades(userId, { academic_term_id: academicTermId } = {}) {
  return listStudentGradesByUserId(userId, {
    academicTermId,
  });
}

export default {
  getStudentProfile,
  getStudentEnrollments,
  getStudentGrades,
};
