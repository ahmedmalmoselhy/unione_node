import { verifyToken } from '../utils/jwt.js';
import { findActiveById } from '../models/userModel.js';
import { listActiveRolesByUserId } from '../models/roleModel.js';

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const payload = verifyToken(token);

    const user = await findActiveById(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const roles = await listActiveRolesByUserId(user.id);

    req.user = {
      ...user,
      roles,
    };
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
}
