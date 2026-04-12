import db from '../config/knex.js';
import logger from '../utils/logger.js';

/**
 * Bulk Operations Service
 * Provides batch operations for admin efficiency
 */

/**
 * Bulk enroll students in sections
 * @param {object} params - Bulk enrollment params
 * @returns {Promise<object>} Results
 */
export async function bulkEnrollStudents({ studentIds, sectionIds, academicTermId }) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    waitlisted: 0,
  };

  const term = await db('academic_terms').where('id', academicTermId).first();
  if (!term) {
    throw new Error('Academic term not found');
  }

  // Process each student-section combination
  for (const studentId of studentIds) {
    const student = await db('students').where('id', studentId).first();
    if (!student) {
      results.failed++;
      results.errors.push({ studentId, error: 'Student not found' });
      continue;
    }

    for (const sectionId of sectionIds) {
      try {
        const section = await db('sections as s')
          .leftJoin('courses as c', 'c.id', 's.course_id')
          .where('s.id', sectionId)
          .select('s.*', 'c.code as course_code', 'c.name as course_name')
          .first();

        if (!section || !section.is_active) {
          continue;
        }

        // Check if already enrolled
        const existing = await db('enrollments')
          .where('student_id', studentId)
          .where('section_id', sectionId)
          .whereIn('status', ['registered', 'completed'])
          .first();

        if (existing) {
          continue; // Skip already enrolled
        }

        // Check capacity
        const currentCount = await db('enrollments')
          .where('section_id', sectionId)
          .whereIn('status', ['registered', 'completed'])
          .count('* as count')
          .first();

        if (parseInt(currentCount.count) >= parseInt(section.capacity)) {
          // Add to waitlist
          const waitlistExists = await db('enrollment_waitlist')
            .where('student_id', studentId)
            .where('section_id', sectionId)
            .first();

          if (!waitlistExists) {
            const maxPosition = await db('enrollment_waitlist')
              .where('section_id', sectionId)
              .max('position as max_pos')
              .first();

            await db('enrollment_waitlist').insert({
              student_id: studentId,
              section_id: sectionId,
              academic_term_id: academicTermId,
              position: (parseInt(maxPosition.max_pos) || 0) + 1,
              joined_at: new Date(),
            });

            results.waitlisted++;
          }
          continue;
        }

        // Create enrollment
        const [enrollment] = await db('enrollments')
          .insert({
            student_id: studentId,
            section_id: sectionId,
            academic_term_id: academicTermId,
            status: 'registered',
            registered_at: new Date(),
          })
          .returning('*');

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId,
          sectionId,
          error: error.message,
        });
      }
    }
  }

  return results;
}

/**
 * Bulk update grades for multiple enrollments
 * @param {Array} gradesData - Array of grade data
 * @returns {Promise<object>} Results
 */
export async function bulkUpdateGrades(gradesData) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  await db.transaction(async (trx) => {
    for (const gradeData of gradesData) {
      try {
        const { enrollment_id, midterm, final: finalExam, coursework } = gradeData;

        // Validate enrollment exists
        const enrollment = await trx('enrollments')
          .where('id', enrollment_id)
          .first();

        if (!enrollment) {
          results.failed++;
          results.errors.push({ enrollment_id, error: 'Enrollment not found' });
          continue;
        }

        // Calculate total
        const total = (midterm || 0) + (finalExam || 0) + (coursework || 0);

        // Determine letter grade
        const letterGrade = calculateLetterGrade(total);
        const gradePoints = calculateGradePoints(total);

        // Upsert grade
        const existingGrade = await trx('grades')
          .where('enrollment_id', enrollment_id)
          .first();

        if (existingGrade) {
          await trx('grades')
            .where('enrollment_id', enrollment_id)
            .update({
              midterm,
              final: finalExam,
              coursework,
              total,
              letter_grade: letterGrade,
              grade_points: gradePoints,
              graded_at: new Date(),
            });
        } else {
          await trx('grades').insert({
            enrollment_id,
            midterm,
            final: finalExam,
            coursework,
            total,
            letter_grade: letterGrade,
            grade_points: gradePoints,
            graded_at: new Date(),
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          enrollment_id: gradeData.enrollment_id,
          error: error.message,
        });
      }
    }
  });

  return results;
}

/**
 * Bulk transfer students to new department
 * @param {object} params - Transfer params
 * @returns {Promise<object>} Results
 */
export async function bulkTransferStudents({ studentIds, newDepartmentId, note, transferredBy }) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  const newDept = await db('departments').where('id', newDepartmentId).first();
  if (!newDept) {
    throw new Error('Department not found');
  }

  await db.transaction(async (trx) => {
    for (const studentId of studentIds) {
      try {
        const student = await trx('students').where('id', studentId).first();

        if (!student) {
          results.failed++;
          results.errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        const oldDepartmentId = student.department_id;

        // Update student
        await trx('students')
          .where('id', studentId)
          .update({
            department_id: newDepartmentId,
            updated_at: new Date(),
          });

        // Record transfer history
        await trx('student_department_history').insert({
          student_id: studentId,
          old_department_id: oldDepartmentId,
          new_department_id: newDepartmentId,
          switched_by: transferredBy,
          switched_at: new Date(),
          note: note || null,
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId,
          error: error.message,
        });
      }
    }
  });

  return results;
}

/**
 * Bulk delete enrollments
 * @param {object} params - Delete params
 * @returns {Promise<object>} Results
 */
export async function bulkDeleteEnrollments({ enrollmentIds, reason }) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const enrollmentId of enrollmentIds) {
    try {
      const enrollment = await db('enrollments')
        .where('id', enrollmentId)
        .whereIn('status', ['registered'])
        .first();

      if (!enrollment) {
        results.failed++;
        results.errors.push({ enrollmentId, error: 'Enrollment not found or not droppable' });
        continue;
      }

      await db('enrollments')
        .where('id', enrollmentId)
        .update({
          status: 'dropped',
          dropped_at: new Date(),
        });

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ enrollmentId, error: error.message });
    }
  }

  return results;
}

/**
 * Bulk publish exam schedules
 * @param {Array} examSchedules - Array of exam schedule data
 * @returns {Promise<object>} Results
 */
export async function bulkPublishExamSchedules(examSchedules) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const examData of examSchedules) {
    try {
      const { section_id, exam_date, start_time, end_time, location } = examData;

      const existing = await db('exam_schedules')
        .where('section_id', section_id)
        .first();

      if (existing) {
        await db('exam_schedules')
          .where('section_id', section_id)
          .update({
            exam_date,
            start_time,
            end_time,
            location,
            is_published: true,
            published_at: new Date(),
          });
      } else {
        await db('exam_schedules').insert({
          section_id,
          exam_date,
          start_time,
          end_time,
          location,
          is_published: true,
          published_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        section_id: examData.section_id,
        error: error.message,
      });
    }
  }

  return results;
}

// ====================
// Helper Functions
// ====================

function calculateLetterGrade(total) {
  if (total >= 90) return 'A';
  if (total >= 80) return 'B';
  if (total >= 70) return 'C';
  if (total >= 60) return 'D';
  return 'F';
}

function calculateGradePoints(total) {
  if (total >= 90) return 4.0;
  if (total >= 80) return 3.0;
  if (total >= 70) return 2.0;
  if (total >= 60) return 1.0;
  return 0.0;
}

export default {
  bulkEnrollStudents,
  bulkUpdateGrades,
  bulkTransferStudents,
  bulkDeleteEnrollments,
  bulkPublishExamSchedules,
};
