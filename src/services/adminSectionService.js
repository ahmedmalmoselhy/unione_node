import db from '../config/knex.js';
import {
  applyCourseScope,
  assertCourseInScope,
  assertDepartmentInScope,
  assertSectionInScope,
  assertStudentInScope,
  buildAdminScope,
} from '../utils/adminScope.js';

function applySectionFilters(query, { search, courseId, professorId, academicTermId, isActive } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder
        .whereILike('c.code', `%${search}%`)
        .orWhereILike('c.name', `%${search}%`)
        .orWhereILike('pu.first_name', `%${search}%`)
        .orWhereILike('pu.last_name', `%${search}%`)
        .orWhereILike('s.room', `%${search}%`);
    });
  }

  if (courseId) {
    query.andWhere('s.course_id', courseId);
  }

  if (professorId) {
    query.andWhere('s.professor_id', professorId);
  }

  if (academicTermId) {
    query.andWhere('s.academic_term_id', academicTermId);
  }

  if (typeof isActive === 'boolean') {
    query.andWhere('s.is_active', isActive);
  }
}

function baseSectionQuery(connection = db) {
  return connection('sections as s')
    .join('courses as c', 'c.id', 's.course_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('users as pu', 'pu.id', 'p.user_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
    .select(
      's.id',
      's.course_id',
      's.professor_id',
      's.academic_term_id',
      's.capacity',
      's.room',
      's.schedule',
      's.is_active',
      's.created_at',
      's.updated_at',
      'c.code as course_code',
      'c.name as course_name',
      'pu.first_name as professor_first_name',
      'pu.last_name as professor_last_name',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester'
    );
}

async function assertSectionRelations(connection, payload) {
  const [course, professor] = await Promise.all([
    connection('courses').where({ id: payload.course_id }).first(),
    connection('professors').where({ id: payload.professor_id }).first(),
  ]);

  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  if (!professor) {
    const error = new Error('Professor not found');
    error.status = 404;
    throw error;
  }

  if (payload.academic_term_id !== undefined && payload.academic_term_id !== null) {
    const term = await connection('academic_terms').where({ id: payload.academic_term_id }).first();
    if (!term) {
      const error = new Error('Academic term not found');
      error.status = 404;
      throw error;
    }
  }
}

export async function listSections({ search, course_id: courseId, professor_id: professorId, academic_term_id: academicTermId, is_active: isActive, page = 1, limit = 25 } = {}, actor) {
  const scope = buildAdminScope(actor);
  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  if (courseId) {
    await assertCourseInScope(db, scope, courseId);
  }

  const rowsQuery = baseSectionQuery();
  applyCourseScope(rowsQuery, scope, 's.course_id');
  applySectionFilters(rowsQuery, { search, courseId, professorId, academicTermId, isActive });

  const totalQuery = db('sections as s')
    .join('courses as c', 'c.id', 's.course_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('users as pu', 'pu.id', 'p.user_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id');
  applyCourseScope(totalQuery, scope, 's.course_id');
  applySectionFilters(totalQuery, { search, courseId, professorId, academicTermId, isActive });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('s.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: rows,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: Number(totalRow?.count || 0),
    },
  };
}

export async function getSectionById(id, actor, connection = db) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(connection, scope, id);
  return baseSectionQuery(connection).where('s.id', id).first();
}

export async function createSection(payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertCourseInScope(trx, scope, payload.course_id);

    const professor = await trx('professors').where({ id: payload.professor_id }).first();
    if (professor?.department_id) {
      await assertDepartmentInScope(trx, scope, professor.department_id);
    }

    await assertSectionRelations(trx, payload);

    const [created] = await trx('sections')
      .insert({
        course_id: payload.course_id,
        professor_id: payload.professor_id,
        academic_term_id: payload.academic_term_id || null,
        capacity: payload.capacity,
        room: payload.room || null,
        schedule: payload.schedule || null,
        is_active: payload.is_active ?? true,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    return getSectionById(created.id, actor, trx);
  });
}

export async function updateSection(id, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const current = await trx('sections').where({ id }).first();
    if (!current) {
      return null;
    }
    await assertSectionInScope(trx, scope, id);

    const relationPayload = {
      course_id: payload.course_id ?? current.course_id,
      professor_id: payload.professor_id ?? current.professor_id,
      academic_term_id: payload.academic_term_id ?? current.academic_term_id,
    };
    await assertCourseInScope(trx, scope, relationPayload.course_id);

    const professor = await trx('professors').where({ id: relationPayload.professor_id }).first();
    if (professor?.department_id) {
      await assertDepartmentInScope(trx, scope, professor.department_id);
    }

    await assertSectionRelations(trx, relationPayload);

    const patch = {};
    for (const key of ['course_id', 'professor_id', 'academic_term_id', 'capacity', 'room', 'schedule', 'is_active']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    await trx('sections').where({ id }).update({ ...patch, updated_at: trx.fn.now() });
    return getSectionById(id, actor, trx);
  });
}

export async function deleteSection(id, actor) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(db, scope, id);
  return db('sections').where({ id }).del();
}

function baseSectionTeachingAssistantQuery(connection = db) {
  return connection('section_teaching_assistants as sta')
    .join('professors as p', 'p.id', 'sta.professor_id')
    .join('users as u', 'u.id', 'p.user_id')
    .select(
      'sta.id',
      'sta.section_id',
      'sta.professor_id',
      'sta.assigned_by_user_id',
      'sta.created_at',
      'sta.updated_at',
      'p.staff_number',
      'u.first_name',
      'u.last_name'
    );
}

export async function listSectionTeachingAssistants(sectionId, actor) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(db, scope, sectionId);

  return baseSectionTeachingAssistantQuery(db)
    .where('sta.section_id', Number(sectionId))
    .orderBy('sta.id', 'asc');
}

export async function assignSectionTeachingAssistant(sectionId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedProfessorId = Number(payload.professor_id);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const professor = await trx('professors').where({ id: normalizedProfessorId }).first();
    if (!professor) {
      const error = new Error('Professor not found');
      error.status = 404;
      throw error;
    }

    if (professor.department_id) {
      await assertDepartmentInScope(trx, scope, professor.department_id);
    }

    const existing = await baseSectionTeachingAssistantQuery(trx)
      .where('sta.section_id', normalizedSectionId)
      .andWhere('sta.professor_id', normalizedProfessorId)
      .first();

    if (existing) {
      return { assignment: existing, created: false };
    }

    const [created] = await trx('section_teaching_assistants')
      .insert({
        section_id: normalizedSectionId,
        professor_id: normalizedProfessorId,
        assigned_by_user_id: actor?.id || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('id');

    const assignment = await baseSectionTeachingAssistantQuery(trx)
      .where('sta.id', created.id)
      .first();

    return { assignment, created: true };
  });
}

export async function removeSectionTeachingAssistant(sectionId, taId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedTaId = Number(taId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const existing = await trx('section_teaching_assistants')
      .where({ id: normalizedTaId, section_id: normalizedSectionId })
      .first();

    if (!existing) {
      return false;
    }

    await trx('section_teaching_assistants')
      .where({ id: normalizedTaId, section_id: normalizedSectionId })
      .del();

    return true;
  });
}

function baseSectionExamScheduleQuery(connection = db) {
  return connection('exam_schedules as es')
    .select(
      'es.id',
      'es.section_id',
      'es.exam_date',
      'es.start_time',
      'es.end_time',
      'es.location',
      'es.is_published',
      'es.published_at',
      'es.created_at',
      'es.updated_at'
    );
}

export async function getSectionExamSchedule(sectionId, actor) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(db, scope, sectionId);

  return baseSectionExamScheduleQuery(db)
    .where('es.section_id', Number(sectionId))
    .first();
}

export async function createSectionExamSchedule(sectionId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const existing = await trx('exam_schedules').where({ section_id: normalizedSectionId }).first();
    if (existing) {
      const error = new Error('Exam schedule already exists for this section');
      error.status = 409;
      throw error;
    }

    const [created] = await trx('exam_schedules')
      .insert({
        section_id: normalizedSectionId,
        exam_date: payload.exam_date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        location: payload.location || null,
        is_published: false,
        published_at: null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('id');

    return baseSectionExamScheduleQuery(trx)
      .where('es.id', created.id)
      .first();
  });
}

export async function updateSectionExamSchedule(sectionId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const existing = await trx('exam_schedules').where({ section_id: normalizedSectionId }).first();
    if (!existing) {
      return null;
    }

    const patch = {};
    for (const key of ['exam_date', 'start_time', 'end_time', 'location']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    if (Object.keys(patch).length > 0 && existing.is_published) {
      patch.is_published = false;
      patch.published_at = null;
    }

    await trx('exam_schedules')
      .where({ section_id: normalizedSectionId })
      .update({ ...patch, updated_at: trx.fn.now() });

    return baseSectionExamScheduleQuery(trx)
      .where('es.section_id', normalizedSectionId)
      .first();
  });
}

export async function publishSectionExamSchedule(sectionId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const existing = await trx('exam_schedules').where({ section_id: normalizedSectionId }).first();
    if (!existing) {
      return null;
    }

    await trx('exam_schedules')
      .where({ section_id: normalizedSectionId })
      .update({
        is_published: true,
        published_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });

    return baseSectionExamScheduleQuery(trx)
      .where('es.section_id', normalizedSectionId)
      .first();
  });
}

function baseSectionGroupProjectQuery(connection = db) {
  return connection('group_projects as gp')
    .select(
      'gp.id',
      'gp.section_id',
      'gp.title',
      'gp.description',
      'gp.due_at',
      'gp.max_members',
      'gp.is_active',
      'gp.created_by_user_id',
      'gp.created_at',
      'gp.updated_at'
    );
}

function baseGroupProjectMemberQuery(connection = db) {
  return connection('group_project_members as gpm')
    .join('students as s', 's.id', 'gpm.student_id')
    .join('users as u', 'u.id', 's.user_id')
    .select(
      'gpm.id',
      'gpm.group_project_id',
      'gpm.student_id',
      'gpm.joined_at',
      'gpm.created_at',
      'gpm.updated_at',
      's.student_number',
      'u.first_name',
      'u.last_name'
    );
}

async function hydrateGroupProjectsWithMembers(connection, projects) {
  if (!projects.length) {
    return [];
  }

  const projectIds = projects.map((project) => Number(project.id));
  const members = await baseGroupProjectMemberQuery(connection)
    .whereIn('gpm.group_project_id', projectIds)
    .orderBy('gpm.group_project_id', 'asc')
    .orderBy('gpm.id', 'asc');

  const membersByProject = new Map();
  for (const member of members) {
    if (!membersByProject.has(Number(member.group_project_id))) {
      membersByProject.set(Number(member.group_project_id), []);
    }
    membersByProject.get(Number(member.group_project_id)).push(member);
  }

  return projects.map((project) => ({
    ...project,
    members: membersByProject.get(Number(project.id)) || [],
  }));
}

async function getSectionGroupProjectById(connection, sectionId, projectId) {
  return baseSectionGroupProjectQuery(connection)
    .where('gp.section_id', Number(sectionId))
    .andWhere('gp.id', Number(projectId))
    .first();
}

async function getSectionGroupProjectWithMembers(connection, sectionId, projectId) {
  const project = await getSectionGroupProjectById(connection, sectionId, projectId);
  if (!project) {
    return null;
  }

  const [hydrated] = await hydrateGroupProjectsWithMembers(connection, [project]);
  return hydrated;
}

export async function listSectionGroupProjects(sectionId, actor) {
  const scope = buildAdminScope(actor);
  const normalizedSectionId = Number(sectionId);
  await assertSectionInScope(db, scope, normalizedSectionId);

  const projects = await baseSectionGroupProjectQuery(db)
    .where('gp.section_id', normalizedSectionId)
    .orderBy('gp.id', 'asc');

  return hydrateGroupProjectsWithMembers(db, projects);
}

export async function createSectionGroupProject(sectionId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const [created] = await trx('group_projects')
      .insert({
        section_id: normalizedSectionId,
        title: payload.title,
        description: payload.description || null,
        due_at: payload.due_at || null,
        max_members: payload.max_members || 5,
        is_active: payload.is_active ?? true,
        created_by_user_id: actor?.id || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('id');

    return getSectionGroupProjectWithMembers(trx, normalizedSectionId, created.id);
  });
}

export async function updateSectionGroupProject(sectionId, projectId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedProjectId = Number(projectId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const project = await getSectionGroupProjectById(trx, normalizedSectionId, normalizedProjectId);
    if (!project) {
      return null;
    }

    if (payload.max_members !== undefined) {
      const currentMembersRow = await trx('group_project_members')
        .where({ group_project_id: normalizedProjectId })
        .count('* as count')
        .first();
      const currentMembers = Number(currentMembersRow?.count || 0);
      if (currentMembers > Number(payload.max_members)) {
        const error = new Error('max_members cannot be less than current member count');
        error.status = 409;
        throw error;
      }
    }

    const patch = {};
    for (const key of ['title', 'description', 'due_at', 'max_members', 'is_active']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    await trx('group_projects')
      .where({ id: normalizedProjectId, section_id: normalizedSectionId })
      .update({ ...patch, updated_at: trx.fn.now() });

    return getSectionGroupProjectWithMembers(trx, normalizedSectionId, normalizedProjectId);
  });
}

export async function deleteSectionGroupProject(sectionId, projectId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedProjectId = Number(projectId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const deleted = await trx('group_projects')
      .where({ id: normalizedProjectId, section_id: normalizedSectionId })
      .del();

    return deleted > 0;
  });
}

export async function addSectionGroupProjectMember(sectionId, projectId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedProjectId = Number(projectId);
    const normalizedStudentId = Number(payload.student_id);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const project = await getSectionGroupProjectById(trx, normalizedSectionId, normalizedProjectId);
    if (!project) {
      const error = new Error('Group project not found');
      error.status = 404;
      throw error;
    }

    await assertStudentInScope(trx, scope, normalizedStudentId);

    const enrollment = await trx('enrollments')
      .where({ section_id: normalizedSectionId, student_id: normalizedStudentId })
      .whereIn('status', ['registered', 'completed'])
      .first();

    if (!enrollment) {
      const error = new Error('Student must be enrolled in this section');
      error.status = 400;
      throw error;
    }

    const existing = await baseGroupProjectMemberQuery(trx)
      .where('gpm.group_project_id', normalizedProjectId)
      .andWhere('gpm.student_id', normalizedStudentId)
      .first();
    if (existing) {
      return { member: existing, created: false };
    }

    const countRow = await trx('group_project_members')
      .where({ group_project_id: normalizedProjectId })
      .count('* as count')
      .first();
    const memberCount = Number(countRow?.count || 0);
    if (memberCount >= Number(project.max_members || 0)) {
      const error = new Error('Group project is at maximum capacity');
      error.status = 409;
      throw error;
    }

    const [created] = await trx('group_project_members')
      .insert({
        group_project_id: normalizedProjectId,
        student_id: normalizedStudentId,
        joined_at: trx.fn.now(),
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('id');

    const member = await baseGroupProjectMemberQuery(trx)
      .where('gpm.id', created.id)
      .first();

    return { member, created: true };
  });
}

export async function removeSectionGroupProjectMember(sectionId, projectId, memberId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedProjectId = Number(projectId);
    const normalizedMemberId = Number(memberId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const project = await getSectionGroupProjectById(trx, normalizedSectionId, normalizedProjectId);
    if (!project) {
      const error = new Error('Group project not found');
      error.status = 404;
      throw error;
    }

    const deleted = await trx('group_project_members')
      .where({ id: normalizedMemberId, group_project_id: normalizedProjectId })
      .del();

    return deleted > 0;
  });
}

export default {
  listSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  listSectionTeachingAssistants,
  assignSectionTeachingAssistant,
  removeSectionTeachingAssistant,
  getSectionExamSchedule,
  createSectionExamSchedule,
  updateSectionExamSchedule,
  publishSectionExamSchedule,
  listSectionGroupProjects,
  createSectionGroupProject,
  updateSectionGroupProject,
  deleteSectionGroupProject,
  addSectionGroupProjectMember,
  removeSectionGroupProjectMember,
};