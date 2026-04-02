const SUPPORTED_LOCALES = new Set(['en', 'ar']);

function parseLocaleCookie(cookieHeader = '') {
  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function localeMiddleware(req, res, next) {
  const headerLocale = req.get('x-locale') || req.query.locale || parseLocaleCookie(req.headers.cookie);
  const locale = SUPPORTED_LOCALES.has(String(headerLocale).toLowerCase()) ? String(headerLocale).toLowerCase() : 'en';

  req.locale = locale;
  res.setHeader('Content-Language', locale);
  next();
}

export function normalizeLocale(input) {
  const locale = String(input || '').toLowerCase();
  return SUPPORTED_LOCALES.has(locale) ? locale : null;
}

export default localeMiddleware;