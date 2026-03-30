import rateLimit from 'express-rate-limit';

function buildLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message,
    },
  });
}

export const apiLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please try again in a minute.',
});

export const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please try again later.',
});

export const passwordLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts. Please try again later.',
});

export const writeLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many write requests. Slow down and try again shortly.',
});

export default {
  apiLimiter,
  loginLimiter,
  passwordLimiter,
  writeLimiter,
};
