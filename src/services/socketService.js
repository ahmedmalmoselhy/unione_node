const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const logger = require('../utils/logger').default;

let io;

/**
 * Initialize Socket.io server
 * @param {object} server - HTTP server instance
 * @returns {object} Socket.io server
 */
async function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Set up Redis adapter for horizontal scaling
  try {
    const pubClient = createClient({
      url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined,
    });
    
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    logger.info('🔌 Socket.io Redis adapter connected');
  } catch (error) {
    logger.warn('⚠️ Socket.io Redis adapter failed, using default adapter', {
      error: error.message,
    });
  }

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      socket.userId = decoded.userId || decoded.id;
      socket.userRoles = decoded.roles || [];
      
      next();
    } catch (error) {
      logger.error('Socket authentication failed', { error: error.message });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('🔌 User connected', { userId: socket.userId });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    if (socket.userRoles) {
      socket.userRoles.forEach((role) => {
        socket.join(`role:${role}`);
      });
    }

    // Handle custom events
    socket.on('join:section', (sectionId) => {
      socket.join(`section:${sectionId}`);
      logger.debug(`User ${socket.userId} joined section ${sectionId}`);
    });

    socket.on('leave:section', (sectionId) => {
      socket.leave(`section:${sectionId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info('🔌 User disconnected', {
        userId: socket.userId,
        reason,
      });
    });
  });

  return io;
}

/**
 * Emit notification to user
 * @param {number} userId - User ID
 * @param {object} notification - Notification data
 */
function emitNotification(userId, notification) {
  if (!io) {
    logger.warn('Socket.io not initialized, skipping notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    payload: notification.payload,
    timestamp: new Date().toISOString(),
  });

  logger.debug(`📧 Emitted notification to user ${userId}`, {
    notificationId: notification.id,
  });
}

/**
 * Emit announcement to all users in scope
 * @param {object} announcement - Announcement data
 * @param {string} scope - Scope (university, faculty, department, section)
 * @param {number} targetId - Target ID (optional)
 */
function emitAnnouncement(announcement, scope, targetId) {
  if (!io) return;

  const event = {
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    type: announcement.type,
    scope,
    timestamp: new Date().toISOString(),
  };

  if (scope === 'university') {
    io.emit('announcement', event);
  } else if (scope === 'faculty' && targetId) {
    io.to(`role:faculty_admin`).emit('announcement', event);
  } else if (scope === 'department' && targetId) {
    io.to(`role:department_admin`).emit('announcement', event);
  } else if (scope === 'section' && targetId) {
    io.to(`section:${targetId}`).emit('announcement', event);
  }

  logger.debug(`📢 Emitted announcement: ${scope}`, {
    announcementId: announcement.id,
  });
}

/**
 * Emit grade update to student
 * @param {number} studentId - Student ID
 * @param {object} grade - Grade data
 */
function emitGradeUpdate(studentId, grade) {
  if (!io) return;

  io.to(`user:${studentId}`).emit('grade.updated', {
    enrollment_id: grade.enrollment_id,
    course_name: grade.course_name,
    letter_grade: grade.letter_grade,
    total: grade.total,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit enrollment update to student
 * @param {number} studentId - Student ID
 * @param {object} enrollment - Enrollment data
 */
function emitEnrollmentUpdate(studentId, enrollment) {
  if (!io) return;

  io.to(`user:${studentId}`).emit('enrollment.updated', {
    enrollment_id: enrollment.id,
    section_id: enrollment.section_id,
    status: enrollment.status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get Socket.io instance
 * @returns {object|null} Socket.io server
 */
function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  emitNotification,
  emitAnnouncement,
  emitGradeUpdate,
  emitEnrollmentUpdate,
  getIO,
};
