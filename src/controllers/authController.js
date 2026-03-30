import { success, error as errorResponse } from '../utils/response.js';
import {
  login as loginService,
  getUserWithRoles,
  getTokensForUser,
  logoutCurrentToken,
  revokeUserTokenById,
  logoutAllTokens,
} from '../services/authService.js';

export async function login(req, res, next) {
  try {
    const result = await loginService(req.body);

    if (!result) {
      return res.status(401).json(errorResponse('Invalid email or password', 401));
    }

    if (result.blocked) {
      return res.status(403).json(errorResponse('User account is inactive', 403));
    }

    return res
      .status(200)
      .json(success(result, 'Login successful', 200));
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getUserWithRoles(req.user.id);

    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }

    return res.status(200).json(success(user, 'Current user profile', 200));
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await logoutCurrentToken(req.accessToken, req.user.id);

    return res.status(200).json(
      success(
        {
          revoked: true,
        },
        'Logout successful.',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

export async function tokens(req, res, next) {
  try {
    const userTokens = await getTokensForUser(req.user.id);
    return res.status(200).json(success(userTokens, 'Tokens fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function logoutAll(req, res, next) {
  try {
    const deleted = await logoutAllTokens(req.user.id);
    return res
      .status(200)
      .json(success({ revoked_count: deleted }, 'All tokens revoked successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function revokeToken(req, res, next) {
  try {
    const tokenId = Number(req.params.tokenId);
    const deleted = await revokeUserTokenById(req.user.id, tokenId);

    if (!deleted) {
      return res.status(404).json(errorResponse('Token not found', 404));
    }

    return res.status(200).json(success({ revoked: true }, 'Token revoked successfully', 200));
  } catch (error) {
    return next(error);
  }
}
