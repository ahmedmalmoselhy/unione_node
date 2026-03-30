import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
const expiresIn = process.env.JWT_EXPIRE || '7d';

export const generateToken = (payload) => {
  const jti = payload?.jti || crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, secret, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default { generateToken, verifyToken, decodeToken };
