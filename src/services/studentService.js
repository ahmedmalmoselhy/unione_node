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
  listStudentAttendanceByUserId,
  listStudentRatingsByUserId,
  listStudentTermGpasByUserId,
  findEnrollmentByIdAndStudentUserId,
  upsertCourseRatingByEnrollmentId,
} from '../models/studentModel.js';
import { buildScheduleIcs, buildTranscriptPdfBuffer } from '../utils/exportBuilders.js';
import { dispatchWebhookEvent } from './webhookService.js';
import announcementModel from '../models/announcementModel.js';

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

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

export async function getStudentTranscript(userId, { academic_term_id: academicTermId } = {}) {
  const [profile, grades] = await Promise.all([
    findStudentProfileByUserId(userId),
    listStudentGradesByUserId(userId, { academicTermId }),
  ]);

  const graded = grades.filter((row) => row.grade_points !== null && row.grade_points !== undefined);
  const totalCredits = graded.reduce((sum, row) => sum + Number(row.credit_hours || 0), 0);
  const weightedGradePoints = graded.reduce(
    (sum, row) => sum + Number(row.grade_points || 0) * Number(row.credit_hours || 0),
    0
  );

  const earnedCredits = grades
    .filter((row) => Number(row.total || 0) >= 60)
    .reduce((sum, row) => sum + Number(row.credit_hours || 0), 0);

  const transcript = {
    academic_history: grades,
    total_gpa: totalCredits > 0 ? Number((weightedGradePoints / totalCredits).toFixed(2)) : 0,
    earned_credits: earnedCredits,
  };

  return {
    student: profile,
    transcript,
  };
}

export async function getStudentAcademicHistory(userId) {
  const [profile, enrollments, termGpas] = await Promise.all([
    findStudentProfileByUserId(userId),
    listStudentEnrollmentsByUserId(userId),
    listStudentTermGpasByUserId(userId),
  ]);

  const completedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'completed');
  const creditsEarned = completedEnrollments.reduce(
    (sum, enrollment) => sum + Number(enrollment.credit_hours || 0),
    0
  );
  const creditsRequired = Number(profile?.department_required_credit_hours || 0) || null;

  const termGpaMap = new Map(termGpas.map((termGpa) => [Number(termGpa.academic_term_id), termGpa]));

  const terms = enrollments
    .filter((enrollment) => enrollment.academic_term_id)
    .reduce((groups, enrollment) => {
      const termId = Number(enrollment.academic_term_id);
      if (!groups.has(termId)) {
        groups.set(termId, []);
      }
      groups.get(termId).push(enrollment);
      return groups;
    }, new Map());

  const orderedTerms = Array.from(terms.entries())
    .sort(([leftId], [rightId]) => leftId - rightId)
    .map(([termId, termEnrollments]) => {
      const first = termEnrollments[0];
      const termGpa = termGpaMap.get(termId);

      return {
        academic_term: {
          id: Number(first.academic_term_id),
          name: first.term_name,
          academic_year: first.term_academic_year,
          semester: first.term_semester,
        },
        term_gpa: termGpa ? Number(termGpa.gpa) : null,
        term_credits: termGpa ? Number(termGpa.credit_hours_completed) : null,
        courses: termEnrollments.map((enrollment) => ({
          enrollment_id: enrollment.id,
          status: enrollment.status,
          registered_at: enrollment.registered_at,
          dropped_at: enrollment.dropped_at,
          course: {
            id: enrollment.course_id,
            code: enrollment.course_code,
            name: enrollment.course_name,
            credit_hours: enrollment.credit_hours,
          },
          grade: enrollment.letter_grade
            ? {
                letter_grade: enrollment.letter_grade,
                total: enrollment.total,
                grade_points: enrollment.grade_points,
              }
            : null,
        })),
      };
    });

  return {
    student: {
      student_number: profile?.student_number,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' '),
      faculty: profile?.faculty_name,
      department: profile?.department_name,
      enrollment_status: profile?.enrollment_status,
      academic_year: profile?.academic_year,
      semester: profile?.semester,
      gpa: profile?.gpa,
      academic_standing: profile?.academic_standing,
    },
    progress: {
      credits_earned: creditsEarned,
      credits_required: creditsRequired,
      progress_pct: creditsRequired && creditsRequired > 0 ? Math.round(Math.min((creditsEarned / creditsRequired) * 100, 100) * 10) / 10 : null,
    },
    terms: orderedTerms,
  };
}

export async function getStudentTranscriptPdf(userId, query = {}) {
  const payload = await getStudentTranscript(userId, query);
  return buildTranscriptPdfBuffer(payload);
}

export async function getStudentSchedule(userId, { academic_term_id: academicTermId } = {}) {
  const enrollments = await listStudentEnrollmentsByUserId(userId, {
    status: 'registered',
    academicTermId,
  });

  return enrollments.map((row) => ({
    section_id: row.section_id,
    course_id: row.course_id,
    course_code: row.course_code,
    course_name: row.course_name,
    professor_id: row.professor_id,
    professor_first_name: row.professor_first_name,
    professor_last_name: row.professor_last_name,
    section_room: row.section_room,
    section_schedule: row.section_schedule,
    term_name: row.term_name,
    academic_term_id: row.academic_term_id,
    term_starts_at: row.term_starts_at,
    term_ends_at: row.term_ends_at,
  }));
}

export async function getStudentScheduleIcs(userId, query = {}) {
  const schedule = await getStudentSchedule(userId, query);
  return buildScheduleIcs(schedule, 'UniOne Student Schedule');
}

export async function getStudentAttendance(userId, { section_id: sectionId, academic_term_id: academicTermId } = {}) {
  return listStudentAttendanceByUserId(userId, {
    sectionId,
    academicTermId,
  });
}

export async function getStudentRatings(userId, { academic_term_id: academicTermId } = {}) {
  return listStudentRatingsByUserId(userId, {
    academicTermId,
  });
}

export async function submitStudentRating(userId, { enrollment_id: enrollmentId, rating, comment }) {
  const enrollment = await findEnrollmentByIdAndStudentUserId(enrollmentId, userId);

  if (!enrollment) {
    return { ok: false, code: 'enrollment_not_found' };
  }

  if (enrollment.status !== 'completed') {
    return { ok: false, code: 'enrollment_not_completed' };
  }

  const saved = await upsertCourseRatingByEnrollmentId(enrollmentId, { rating, comment });

  return { ok: true, data: saved };
}

export async function getStudentSectionAnnouncements(userId, sectionId) {
  return announcementModel.listSectionAnnouncementsForStudent(userId, sectionId);
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

  if (!section.term_is_active) {
    const today = new Date().toISOString().slice(0, 10);
    const registrationStartsAt = toDateOnly(section.registration_starts_at);
    const registrationEndsAt = toDateOnly(section.registration_ends_at);

    if (registrationStartsAt && today < registrationStartsAt) {
      return { ok: false, code: 'registration_not_started' };
    }

    if (registrationEndsAt && today > registrationEndsAt) {
      return { ok: false, code: 'registration_closed' };
    }
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

  await dispatchWebhookEvent('enrollment.created', {
    enrollment_id: created.id,
    student_id: created.student_id,
    section_id: created.section_id,
    academic_term_id: created.academic_term_id,
    status: created.status,
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

  const section = await findSectionById(enrollment.section_id);
  if (section && !section.term_is_active) {
    const today = new Date().toISOString().slice(0, 10);
    const withdrawalDeadline = toDateOnly(section.withdrawal_deadline);

    if (withdrawalDeadline && today > withdrawalDeadline) {
      return { ok: false, code: 'withdrawal_deadline_passed' };
    }
  }

  const dropped = await markEnrollmentDropped(enrollmentId);

  const droppedSection = await findSectionById(dropped.section_id);
  const registeredCount = await countRegisteredInSection(dropped.section_id);
  if (droppedSection && registeredCount < Number(droppedSection.capacity)) {
    const next = await popNextWaitlistEntry(dropped.section_id);
    if (next) {
      const existing = await findEnrollmentByStudentAndSection(next.student_id, dropped.section_id);
      if (!existing) {
        const promoted = await createEnrollment({
          studentId: next.student_id,
          sectionId: dropped.section_id,
          academicTermId: next.academic_term_id,
        });

        await dispatchWebhookEvent('waitlist.promoted', {
          enrollment_id: promoted.id,
          student_id: promoted.student_id,
          section_id: promoted.section_id,
          academic_term_id: promoted.academic_term_id,
        });
      }
      await normalizeWaitlistPositions(dropped.section_id);
    }
  }

  await dispatchWebhookEvent('enrollment.dropped', {
    enrollment_id: dropped.id,
    student_id: dropped.student_id,
    section_id: dropped.section_id,
    academic_term_id: dropped.academic_term_id,
    status: dropped.status,
  });

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
  getStudentTranscript,
  getStudentTranscriptPdf,
  getStudentSchedule,
  getStudentScheduleIcs,
  getStudentAttendance,
  getStudentRatings,
  submitStudentRating,
  getStudentSectionAnnouncements,
  enrollInSection,
  dropEnrollment,
  getStudentWaitlist,
  removeStudentWaitlistEntry,
};
