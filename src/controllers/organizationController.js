import { success, error as errorResponse } from '../utils/response.js';
import {
  getUniversity,
  getFaculties,
  getDepartments,
  getUniversityVicePresidents,
  patchUniversity,
  addFaculty,
  patchFaculty,
  removeFaculty,
  addDepartment,
  patchDepartment,
  removeDepartment,
  addUniversityVicePresident,
  patchUniversityVicePresident,
  removeUniversityVicePresident,
} from '../services/organizationService.js';

export async function university(req, res, next) {
  try {
    const data = await getUniversity();

    if (!data) {
      return res.status(404).json(errorResponse('University not found', 404));
    }

    return res.status(200).json(success(data, 'University fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function faculties(req, res, next) {
  try {
    const data = await getFaculties(req.query);
    return res.status(200).json(success(data, 'Faculties fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function departments(req, res, next) {
  try {
    const data = await getDepartments(req.query);
    return res.status(200).json(success(data, 'Departments fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function vicePresidents(req, res, next) {
  try {
    const data = await getUniversityVicePresidents();
    return res.status(200).json(success(data, 'University vice presidents fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function updateUniversity(req, res, next) {
  try {
    const data = await patchUniversity(req.user, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('University not found', 404));
    }

    return res.status(200).json(success(data, 'University updated successfully', 200));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate value conflicts with existing record', 409));
    }
    return next(error);
  }
}

export async function createFaculty(req, res, next) {
  try {
    const data = await addFaculty(req.user, req.body);
    return res.status(201).json(success(data, 'Faculty created successfully', 201));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate faculty code or unique value', 409));
    }
    return next(error);
  }
}

export async function updateFaculty(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await patchFaculty(req.user, id, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('Faculty not found', 404));
    }

    return res.status(200).json(success(data, 'Faculty updated successfully', 200));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate faculty code or unique value', 409));
    }
    return next(error);
  }
}

export async function deleteFaculty(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await removeFaculty(req.user, id);

    if (!deleted) {
      return res.status(404).json(errorResponse('Faculty not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Faculty deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Faculty cannot be deleted because it is referenced by other records', 409));
    }
    return next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const data = await addDepartment(req.user, req.body);
    return res.status(201).json(success(data, 'Department created successfully', 201));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate department code or unique value', 409));
    }
    return next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await patchDepartment(req.user, id, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('Department not found', 404));
    }

    return res.status(200).json(success(data, 'Department updated successfully', 200));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate department code or unique value', 409));
    }
    return next(error);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await removeDepartment(req.user, id);

    if (!deleted) {
      return res.status(404).json(errorResponse('Department not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Department deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Department cannot be deleted because it is referenced by other records', 409));
    }
    return next(error);
  }
}

export async function createVicePresident(req, res, next) {
  try {
    const data = await addUniversityVicePresident(req.body);

    if (!data) {
      return res.status(404).json(errorResponse('University not found', 404));
    }

    return res.status(201).json(success(data, 'University vice president created successfully', 201));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate vice president assignment', 409));
    }
    return next(error);
  }
}

export async function updateVicePresident(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await patchUniversityVicePresident(id, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('University vice president not found', 404));
    }

    return res.status(200).json(success(data, 'University vice president updated successfully', 200));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate vice president assignment', 409));
    }
    return next(error);
  }
}

export async function deleteVicePresident(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await removeUniversityVicePresident(id);

    if (!deleted) {
      return res.status(404).json(errorResponse('University vice president not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'University vice president deleted successfully', 200));
  } catch (error) {
    return next(error);
  }
}
