import { success, error as errorResponse } from '../utils/response.js';
import { getUniversity, getFaculties, getDepartments } from '../services/organizationService.js';

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
