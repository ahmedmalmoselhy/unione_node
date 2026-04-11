import { success, error as errorResponse } from '../utils/response.js';
import {
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
} from '../services/adminSectionService.js';

export async function index(req, res, next) {
  try {
    const data = await listSections(req.query, req.user);
    return res.status(200).json(success(data, 'Sections fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getSectionById(id, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Section not found', 404));
    }
    return res.status(200).json(success(data, 'Section fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createSection(req.body, req.user);
    return res.status(201).json(success(data, 'Section created successfully', 201));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate section unique value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateSection(id, req.body, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Section not found', 404));
    }
    return res.status(200).json(success(data, 'Section updated successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate section unique value', 409));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteSection(id, req.user);
    if (!deleted) {
      return res.status(404).json(errorResponse('Section not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Section deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Section cannot be deleted because it is referenced by other records', 409));
    }
    return next(error);
  }
}

export async function listTeachingAssistants(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await listSectionTeachingAssistants(sectionId, req.user);
    return res.status(200).json(success(data, 'Section teaching assistants fetched successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function storeTeachingAssistant(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const { assignment, created } = await assignSectionTeachingAssistant(sectionId, req.body, req.user);
    const statusCode = created ? 201 : 200;
    const message = created ? 'Teaching assistant assigned successfully' : 'Teaching assistant already assigned';
    return res.status(statusCode).json(success(assignment, message, statusCode));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function destroyTeachingAssistant(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const taId = Number(req.params.taId);
    const removed = await removeSectionTeachingAssistant(sectionId, taId, req.user);
    if (!removed) {
      return res.status(404).json(errorResponse('Teaching assistant assignment not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Teaching assistant removed successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function showExamSchedule(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await getSectionExamSchedule(sectionId, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Exam schedule not found', 404));
    }
    return res.status(200).json(success(data, 'Section exam schedule fetched successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function storeExamSchedule(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await createSectionExamSchedule(sectionId, req.body, req.user);
    return res.status(201).json(success(data, 'Section exam schedule created successfully', 201));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.status === 409) {
      return res.status(409).json(errorResponse(error.message, 409));
    }
    return next(error);
  }
}

export async function updateExamSchedule(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await updateSectionExamSchedule(sectionId, req.body, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Exam schedule not found', 404));
    }
    return res.status(200).json(success(data, 'Section exam schedule updated successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function publishExamSchedule(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await publishSectionExamSchedule(sectionId, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Exam schedule not found', 404));
    }
    return res.status(200).json(success(data, 'Section exam schedule published successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function listGroupProjects(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await listSectionGroupProjects(sectionId, req.user);
    return res.status(200).json(success(data, 'Section group projects fetched successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function storeGroupProject(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await createSectionGroupProject(sectionId, req.body, req.user);
    return res.status(201).json(success(data, 'Section group project created successfully', 201));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function updateGroupProject(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const projectId = Number(req.params.projectId);
    const data = await updateSectionGroupProject(sectionId, projectId, req.body, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Group project not found', 404));
    }
    return res.status(200).json(success(data, 'Section group project updated successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.status === 409) {
      return res.status(409).json(errorResponse(error.message, 409));
    }
    return next(error);
  }
}

export async function destroyGroupProject(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const projectId = Number(req.params.projectId);
    const deleted = await deleteSectionGroupProject(sectionId, projectId, req.user);
    if (!deleted) {
      return res.status(404).json(errorResponse('Group project not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Section group project deleted successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function storeGroupProjectMember(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const projectId = Number(req.params.projectId);
    const { member, created } = await addSectionGroupProjectMember(sectionId, projectId, req.body, req.user);
    const statusCode = created ? 201 : 200;
    const message = created ? 'Group project member added successfully' : 'Student already assigned to this group project';
    return res.status(statusCode).json(success(member, message, statusCode));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.status === 400) {
      return res.status(400).json(errorResponse(error.message, 400));
    }
    if (error.status === 409) {
      return res.status(409).json(errorResponse(error.message, 409));
    }
    return next(error);
  }
}

export async function destroyGroupProjectMember(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const projectId = Number(req.params.projectId);
    const memberId = Number(req.params.memberId);
    const deleted = await removeSectionGroupProjectMember(sectionId, projectId, memberId, req.user);
    if (!deleted) {
      return res.status(404).json(errorResponse('Group project member not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Group project member removed successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export default {
  index,
  show,
  store,
  update,
  destroy,
  listTeachingAssistants,
  storeTeachingAssistant,
  destroyTeachingAssistant,
  showExamSchedule,
  storeExamSchedule,
  updateExamSchedule,
  publishExamSchedule,
  listGroupProjects,
  storeGroupProject,
  updateGroupProject,
  destroyGroupProject,
  storeGroupProjectMember,
  destroyGroupProjectMember,
};