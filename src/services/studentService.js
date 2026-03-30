import {
  findStudentProfileByUserId,
  findStudentByUserId,
  findSectionById,
  countRegisteredInSection,
  findWaitlistEntry,
  createWaitlistEntry,
  listWaitlistByUserId,
  deleteWaitlistByUserAndSection,
  popNextWaitlistEntry,
  normalizeWaitlistPositions,
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
    const waitlistEntry = await findWaitlistEntry(student.id, sectionId);
    if (waitlistEntry) {
      return { ok: false, code: 'already_waitlisted' };
    }

    const createdWaitlist = await createWaitlistEntry({
      studentId: student.id,
      sectionId,
      academicTermId: academicTermId || section.academic_term_id,
    });

    return {
      ok: false,
      code: 'section_full_waitlisted',
      data: createdWaitlist,
    };
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

  const section = await findSectionById(dropped.section_id);
  const registeredCount = await countRegisteredInSection(dropped.section_id);
  if (section && registeredCount < Number(section.capacity)) {
    const next = await popNextWaitlistEntry(dropped.section_id);
    if (next) {
      const existing = await findEnrollmentByStudentAndSection(next.student_id, dropped.section_id);
      if (!existing) {
        await createEnrollment({
          studentId: next.student_id,
          sectionId: dropped.section_id,
          academicTermId: next.academic_term_id,
        });
      }
      await normalizeWaitlistPositions(dropped.section_id);
    }
  }

  return { ok: true, data: dropped };
}

export async function getStudentWaitlist(userId) {
  return listWaitlistByUserId(userId);
}

export async function removeStudentWaitlistEntry(userId, sectionId) {
  const deleted = await deleteWaitlistByUserAndSection(userId, sectionId);
  await normalizeWaitlistPositions(sectionId);
  return deleted;
}

export default {
  getStudentProfile,
  getStudentEnrollments,
  getStudentGrades,
  enrollInSection,
  dropEnrollment,
  getStudentWaitlist,
  removeStudentWaitlistEntry,
};
