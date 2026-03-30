import crypto from 'node:crypto';

export function hashAccessToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default {
  hashAccessToken,
};
