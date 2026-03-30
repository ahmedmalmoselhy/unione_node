import db from '../config/knex.js';
import { hashAccessToken } from '../utils/token.js';

const USER_TOKENABLE_TYPE = 'App\\Models\\User';

export function getUserTokenableType() {
  return USER_TOKENABLE_TYPE;
}

export async function createPersonalAccessToken({
  userId,
  token,
  name = 'api-token',
  abilities = ['*'],
  expiresAt = null,
}) {
  const tokenHash = hashAccessToken(token);

  const [row] = await db('personal_access_tokens')
    .insert({
      tokenable_type: USER_TOKENABLE_TYPE,
      tokenable_id: userId,
      name,
      token: tokenHash,
      abilities: JSON.stringify(abilities),
      expires_at: expiresAt,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'name', 'abilities', 'last_used_at', 'expires_at', 'created_at']);

  return row;
}

export async function findValidTokenByRawToken(rawToken) {
  const tokenHash = hashAccessToken(rawToken);

  return db('personal_access_tokens')
    .select('*')
    .where({ token: tokenHash, tokenable_type: USER_TOKENABLE_TYPE })
    .andWhere((query) => {
      query.whereNull('expires_at').orWhere('expires_at', '>', db.fn.now());
    })
    .first();
}

export async function touchTokenUsage(id) {
  await db('personal_access_tokens')
    .where({ id })
    .update({ last_used_at: db.fn.now(), updated_at: db.fn.now() });
}

export async function listTokensByUserId(userId) {
  return db('personal_access_tokens')
    .select('id', 'name', 'abilities', 'last_used_at', 'expires_at', 'created_at')
    .where({ tokenable_type: USER_TOKENABLE_TYPE, tokenable_id: userId })
    .orderBy('id', 'desc');
}

export async function deleteTokenByRawToken(rawToken, userId) {
  const tokenHash = hashAccessToken(rawToken);

  return db('personal_access_tokens')
    .where({ token: tokenHash, tokenable_type: USER_TOKENABLE_TYPE, tokenable_id: userId })
    .del();
}

export async function deleteTokenById(userId, tokenId) {
  return db('personal_access_tokens')
    .where({ tokenable_type: USER_TOKENABLE_TYPE, tokenable_id: userId, id: tokenId })
    .del();
}

export async function deleteAllTokensByUserId(userId) {
  return db('personal_access_tokens')
    .where({ tokenable_type: USER_TOKENABLE_TYPE, tokenable_id: userId })
    .del();
}

export default {
  getUserTokenableType,
  createPersonalAccessToken,
  findValidTokenByRawToken,
  touchTokenUsage,
  listTokensByUserId,
  deleteTokenByRawToken,
  deleteTokenById,
  deleteAllTokensByUserId,
};
