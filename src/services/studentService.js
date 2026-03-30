import {
  findStudentProfileByUserId,
  findStudentByUserId,
  findSectionById,
  countRegisteredInSection,
  findEnrollmentByStudentAndSection,
  createEnrollment,
  findEnrollmentByIdAndUserId,
  markEnrollmentDropped,
  listPrerequisiteCourseIds,
  countPassedPrerequisites,
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

export async function enrollInSection(userId, { section_id: sectionId, academic_term_id: academicTermId }) {
  const student = await findStudentByUserId(userId);
  if (!student) {
    return { ok: false, code: 'student_not_found' };
  }

  if (student.enrollment_status !== 'active') {
    return { ok: false, code: 'student_not_active' };
  }

  const section = await findSectionById(sectionId);
  if (!section || !section.is_active) {
    return { ok: false, code: 'section_not_found' };
  }

  const existing = await findEnrollmentByStudentAndSection(student.id, sectionId);
  if (existing && existing.status !== 'dropped') {
    return { ok: false, code: 'already_enrolled' };
  }

  const prereqIds = await listPrerequisiteCourseIds(section.course_id);
  if (prereqIds.length > 0) {
    const passedCount = await countPassedPrerequisites(student.id, prereqIds);
    if (passedCount < prereqIds.length) {
      return { ok: false, code: 'missing_prerequisites' };
    }
  }

  const registeredCount = await countRegisteredInSection(sectionId);
  if (registeredCount >= Number(section.capacity)) {
    return { ok: false, code: 'section_full' };
  }

  if (existing && existing.status === 'dropped') {
    return { ok: false, code: 'already_exists_dropped' };
  }

  const created = await createEnrollment({
    studentId: student.id,
    sectionId,
    academicTermId: academicTermId || section.academic_term_id,
  });

  return { ok: true, data: created };
}

export async function dropEnrollment(userId, enrollmentId) {
  const enrollment = await findEnrollmentByIdAndUserId(enrollmentId, userId);
  if (!enrollment) {
    return { ok: false, code: 'not_found' };
  }

  if (enrollment.status !== 'registered') {
    return { ok: false, code: 'not_droppable' };
  }

  const dropped = await markEnrollmentDropped(enrollmentId);
  return { ok: true, data: dropped };
}

export default {
  getStudentProfile,
  getStudentEnrollments,
  getStudentGrades,
  enrollInSection,
  dropEnrollment,
};
