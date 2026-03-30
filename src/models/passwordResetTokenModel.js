import db from '../config/knex.js';

export async function findPasswordResetTokenByEmail(email) {
  return db('password_reset_tokens').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
}

export async function upsertPasswordResetToken({ email, tokenHash, expiresAt }) {
  const row = {
    email,
    token: tokenHash,
    created_at: db.fn.now(),
    expires_at: expiresAt,
  };

  await db('password_reset_tokens')
    .insert(row)
    .onConflict('email')
    .merge(row);
}

export async function deletePasswordResetTokenByEmail(email) {
  return db('password_reset_tokens').whereRaw('LOWER(email) = LOWER(?)', [email]).del();
}

export default {
  findPasswordResetTokenByEmail,
  upsertPasswordResetToken,
  deletePasswordResetTokenByEmail,
};
