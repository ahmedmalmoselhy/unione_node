import { success, error as errorResponse } from '../utils/response.js';
import { normalizeLocale } from '../middleware/locale.js';

export async function getLocale(req, res) {
  return res.status(200).json(success({ locale: req.locale || 'en' }, 'Locale fetched successfully', 200));
}

export async function setLocale(req, res) {
  const locale = normalizeLocale(req.body?.locale || req.query?.locale);

  if (!locale) {
    return res.status(422).json(errorResponse('Unsupported locale', 422));
  }

  res.cookie('locale', locale, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  return res.status(200).json(success({ locale }, 'Locale updated successfully', 200));
}

export default {
  getLocale,
  setLocale,
};