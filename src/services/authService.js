import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { findActiveByEmail, findActiveById } from '../models/userModel.js';
import { listActiveRolesByUserId } from '../models/roleModel.js';

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
