import { success } from '../utils/response.js';
import db from '../config/knex.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/v1/users/avatar
 * Upload user avatar
 */
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide an image file',
      });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Get old avatar path
    const user = await db('users').where('id', userId).first();

    // Delete old avatar if exists
    if (user && user.avatar_path) {
      const oldPath = path.join(__dirname, '../../', user.avatar_path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new avatar
    await db('users')
      .where('id', userId)
      .update({
        avatar_path: avatarUrl,
        updated_at: new Date(),
      });

    return res.status(200).json(
      success(
        {
          avatar_url: avatarUrl,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
        },
        'Avatar uploaded successfully',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/v1/users/avatar
 * Remove user avatar
 */
export async function deleteAvatar(req, res, next) {
  try {
    const userId = req.user.id;

    // Get user
    const user = await db('users').where('id', userId).first();

    if (!user || !user.avatar_path) {
      return res.status(404).json({
        error: 'No avatar found',
      });
    }

    // Delete file
    const filePath = path.join(__dirname, '../../', user.avatar_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update database
    await db('users')
      .where('id', userId)
      .update({
        avatar_path: null,
        updated_at: new Date(),
      });

    return res.status(200).json(
      success({ deleted: true }, 'Avatar deleted successfully', 200)
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/users/avatar/:userId
 * Get user avatar URL
 */
export async function getAvatar(req, res, next) {
  try {
    const userId = parseInt(req.params.userId);

    const user = await db('users')
      .where('id', userId)
      .select('id', 'avatar_path', 'first_name', 'last_name')
      .first();

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.status(200).json(
      success(
        {
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          avatar_url: user.avatar_path || null,
        },
        'Avatar retrieved',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

export default {
  uploadAvatar,
  deleteAvatar,
  getAvatar,
};
