import { success, error as errorResponse } from '../utils/response.js';
import {
  getProfessorProfile,
  getProfessorSections,
  getProfessorSchedule,
  getProfessorSectionStudents,
  getProfessorSectionGrades,
  submitProfessorSectionGrades,
  createProfessorAttendanceSession,
  getProfessorAttendanceSessions,
  getProfessorAttendanceSessionDetails,
  updateProfessorAttendanceRecords,
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

export async function submitSectionGrades(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await submitProfessorSectionGrades(req.user.id, sectionId, req.body.grades);

    if (!data) {
      return res.status(404).json(errorResponse('Section not found for professor', 404));
    }

    return res.status(200).json(success(data, 'Section grades submitted successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function attendanceSessions(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await getProfessorAttendanceSessions(req.user.id, sectionId);

    if (!data) {
      return res.status(404).json(errorResponse('Section not found for professor', 404));
    }

    return res.status(200).json(success(data, 'Attendance sessions fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function createAttendanceSession(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await createProfessorAttendanceSession(req.user.id, sectionId, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('Section not found for professor', 404));
    }

    return res.status(201).json(success(data, 'Attendance session created successfully', 201));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Attendance session already exists for that date', 409));
    }
    return next(error);
  }
}

export async function attendanceSessionDetails(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const sessionId = Number(req.params.sessionId);
    const data = await getProfessorAttendanceSessionDetails(req.user.id, sectionId, sessionId);

    if (!data) {
      return res.status(404).json(errorResponse('Attendance session not found for professor', 404));
    }

    return res.status(200).json(success(data, 'Attendance session details fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function updateAttendanceSession(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const sessionId = Number(req.params.sessionId);
    const data = await updateProfessorAttendanceRecords(req.user.id, sectionId, sessionId, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('Attendance session not found for professor', 404));
    }

    return res.status(200).json(success(data, 'Attendance records updated successfully', 200));
  } catch (error) {
    return next(error);
  }
}
