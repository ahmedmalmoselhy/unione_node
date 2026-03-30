import { comparePassword } from '../utils/password.js';
import { generateToken, decodeToken } from '../utils/jwt.js';
import { findActiveByEmail, findActiveById } from '../models/userModel.js';
import { listActiveRolesByUserId } from '../models/roleModel.js';
import {
  createPersonalAccessToken,
  listTokensByUserId,
  deleteTokenByRawToken,
  deleteTokenById,
  deleteAllTokensByUserId,
} from '../models/personalAccessTokenModel.js';

function parseAbilities(abilities) {
  if (!abilities) {
    return [];
  }

  try {
    const parsed = JSON.parse(abilities);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function login({ email, password }) {
  const user = await findActiveByEmail(email, true);

  if (!user) {
    return null;
  }

  if (!user.is_active) {
    return { blocked: true };
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return null;
  }

  const roleRows = await listActiveRolesByUserId(user.id);

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    roles: roleRows.map((role) => role.name),
  };

  const token = generateToken(tokenPayload);
  const decoded = decodeToken(token);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  await createPersonalAccessToken({
    userId: user.id,
    token,
    name: 'auth-login',
    abilities: ['*'],
    expiresAt,
  });

  const profile = {
    id: user.id,
    national_id: user.national_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    date_of_birth: user.date_of_birth,
    avatar_path: user.avatar_path,
    is_active: user.is_active,
    must_change_password: user.must_change_password,
    roles: roleRows,
  };

  return {
    token,
    user: profile,
  };
}

export async function getUserWithRoles(userId) {
  const user = await findActiveById(userId);

  if (!user) {
    return null;
  }

  const roleRows = await listActiveRolesByUserId(user.id);

  return {
    ...user,
    roles: roleRows,
  };
}

export async function getTokensForUser(userId) {
  const rows = await listTokensByUserId(userId);

  return rows.map((row) => ({
    ...row,
    abilities: parseAbilities(row.abilities),
  }));
}

export async function logoutCurrentToken(rawToken, userId) {
  return deleteTokenByRawToken(rawToken, userId);
}

export async function revokeUserTokenById(userId, tokenId) {
  return deleteTokenById(userId, tokenId);
}

export async function logoutAllTokens(userId) {
  return deleteAllTokensByUserId(userId);
}
