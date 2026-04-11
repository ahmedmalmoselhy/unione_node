import {
  findProfessorProfileByUserId,
  listProfessorSectionsByUserId,
  findProfessorSectionById,
  listSectionEnrollmentIds,
  listProfessorSectionStudents,
  listProfessorSectionGrades,
  upsertSectionGrades,
  createAttendanceSession,
  listProfessorAttendanceSessions,
  findProfessorAttendanceSession,
  upsertAttendanceRecords,
  listAttendanceRecordsBySession,
} from '../models/professorModel.js';
import { dispatchWebhookEvent } from './webhookService.js';
import { sendBulkEmails } from './emailDeliveryService.js';
import { buildScheduleIcs } from '../utils/exportBuilders.js';
import announcementModel from '../models/announcementModel.js';

function computeGrade(total) {
  if (total >= 97) return { letter_grade: 'A+', grade_points: 4.0 };
  if (total >= 93) return { letter_grade: 'A', grade_points: 4.0 };
  if (total >= 90) return { letter_grade: 'A-', grade_points: 3.7 };
  if (total >= 87) return { letter_grade: 'B+', grade_points: 3.3 };
  if (total >= 83) return { letter_grade: 'B', grade_points: 3.0 };
  if (total >= 80) return { letter_grade: 'B-', grade_points: 2.7 };
  if (total >= 77) return { letter_grade: 'C+', grade_points: 2.3 };
  if (total >= 73) return { letter_grade: 'C', grade_points: 2.0 };
  if (total >= 70) return { letter_grade: 'C-', grade_points: 1.7 };
  if (total >= 67) return { letter_grade: 'D+', grade_points: 1.3 };
  if (total >= 63) return { letter_grade: 'D', grade_points: 1.0 };
  if (total >= 60) return { letter_grade: 'D-', grade_points: 0.7 };
  return { letter_grade: 'F', grade_points: 0.0 };
}

export async function getProfessorProfile(userId) {
  return findProfessorProfileByUserId(userId);
}

export async function getProfessorSections(userId, { academic_term_id: academicTermId } = {}) {
  return listProfessorSectionsByUserId(userId, { academicTermId });
}

export async function getProfessorSchedule(userId, query) {
  return getProfessorSections(userId, query);
}

export async function getProfessorScheduleIcs(userId, query) {
  const sections = await getProfessorSchedule(userId, query);

  const scheduleRows = sections.map((row) => ({
    section_id: row.id,
    course_code: row.course_code,
    course_name: row.course_name,
    professor_first_name: 'Professor',
    professor_last_name: String(userId),
    section_room: row.room,
    section_schedule: row.schedule,
    term_starts_at: null,
    term_ends_at: null,
  }));

  return buildScheduleIcs(scheduleRows, 'UniOne Professor Schedule');
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

export async function submitProfessorSectionGrades(userId, sectionId, grades) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  const enrollmentMap = await listSectionEnrollmentIds(sectionId);

  const gradeRows = grades.map((entry) => {
    if (!enrollmentMap.has(Number(entry.enrollment_id))) {
      const error = new Error(`Enrollment ${entry.enrollment_id} does not belong to section ${sectionId}`);
      error.status = 400;
      throw error;
    }

    const midterm = entry.midterm ?? 0;
    const finalExam = entry.final ?? 0;
    const coursework = entry.coursework ?? 0;
    const total = Number((midterm + finalExam + coursework).toFixed(2));
    const { letter_grade, grade_points } = computeGrade(total);

    return {
      enrollment_id: Number(entry.enrollment_id),
      midterm,
      final: finalExam,
      coursework,
      total,
      letter_grade,
      grade_points,
    };
  });

  await upsertSectionGrades(gradeRows, userId);

  await dispatchWebhookEvent('grades.submitted', {
    professor_user_id: userId,
    section_id: sectionId,
    grades_count: gradeRows.length,
    enrollment_ids: gradeRows.map((row) => row.enrollment_id),
  });

  const latestGrades = await listProfessorSectionGrades(userId, sectionId);
  const touchedEnrollmentIds = new Set(gradeRows.map((row) => Number(row.enrollment_id)));
  const emailMessages = latestGrades
    .filter((row) => touchedEnrollmentIds.has(Number(row.enrollment_id)) && row.email)
    .map((row) => {
      const studentName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.student_number;
      const gradeText = row.letter_grade
        ? `Your final grade is ${row.letter_grade}${row.total !== null ? ` (${row.total}/100)` : ''}.`
        : row.total !== null
          ? `Your final score is ${row.total}/100.`
          : 'Your final grade has been published.';

      return {
        to: row.email,
        subject: `Final grade published: ${row.course_code || 'Course'}`,
        text: [
          `Hello ${studentName},`,
          '',
          `Your final grade for ${row.course_code || 'course'}${row.course_name ? ` - ${row.course_name}` : ''} has been published.`,
          gradeText,
        ].join('\n'),
      };
    });

  await sendBulkEmails(emailMessages);

  return latestGrades;
}

export async function createProfessorAttendanceSession(userId, sectionId, { session_date: sessionDate, topic }) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  const created = await createAttendanceSession(sectionId, userId, sessionDate, topic);

  await dispatchWebhookEvent('attendance.session_created', {
    session_id: created.id,
    section_id: created.section_id,
    created_by: created.created_by,
    session_date: created.session_date,
  });

  return created;
}

export async function getProfessorAttendanceSessions(userId, sectionId) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  return listProfessorAttendanceSessions(userId, sectionId);
}

export async function getProfessorAttendanceSessionDetails(userId, sectionId, sessionId) {
  const session = await findProfessorAttendanceSession(userId, sectionId, sessionId);
  if (!session) {
    return null;
  }

  const records = await listAttendanceRecordsBySession(sessionId);
  return { session, records };
}

export async function updateProfessorAttendanceRecords(userId, sectionId, sessionId, { records }) {
  const session = await findProfessorAttendanceSession(userId, sectionId, sessionId);
  if (!session) {
    return null;
  }

  const enrollmentMap = await listSectionEnrollmentIds(sectionId);
  const sectionStudentIds = new Set([...enrollmentMap.values()]);

  for (const record of records) {
    if (!sectionStudentIds.has(Number(record.student_id))) {
      const error = new Error(`Student ${record.student_id} is not enrolled in section ${sectionId}`);
      error.status = 400;
      throw error;
    }
  }

  await upsertAttendanceRecords(sessionId, records);
  await dispatchWebhookEvent('attendance.records_updated', {
    professor_user_id: userId,
    section_id: sectionId,
    attendance_session_id: sessionId,
    records_count: records.length,
  });

  return getProfessorAttendanceSessionDetails(userId, sectionId, sessionId);
}

export async function getProfessorSectionAnnouncements(userId, sectionId) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  return announcementModel.listSectionAnnouncementsForProfessor(userId, sectionId);
}

export async function createProfessorSectionAnnouncement(userId, sectionId, { title, body, published_at: publishedAt }) {
  const section = await findProfessorSectionById(userId, sectionId);
  if (!section) {
    return null;
  }

  const announcement = await announcementModel.createSectionAnnouncement({
    sectionId,
    authorId: userId,
    title,
    body,
    publishedAt: publishedAt || null,
  });

  const recipientEmails = await announcementModel.listSectionAnnouncementRecipientEmails(sectionId);
  await sendBulkEmails([
    {
      to: recipientEmails,
      subject: `New announcement: ${section.course_code || 'Section'}`,
      text: [
        'A new announcement has been posted for your enrolled section.',
        `Course: ${section.course_code || 'N/A'}${section.course_name ? ` - ${section.course_name}` : ''}`,
        `Title: ${title}`,
        '',
        String(body || ''),
      ].join('\n'),
    },
  ]);

  return announcement;
}

export default {
  getProfessorProfile,
  getProfessorSections,
  getProfessorSchedule,
  getProfessorScheduleIcs,
  getProfessorSectionStudents,
  getProfessorSectionGrades,
  submitProfessorSectionGrades,
  createProfessorAttendanceSession,
  getProfessorAttendanceSessions,
  getProfessorAttendanceSessionDetails,
  updateProfessorAttendanceRecords,
  getProfessorSectionAnnouncements,
  createProfessorSectionAnnouncement,
};
