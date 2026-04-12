import { success } from '../utils/response.js';
import { getIO } from '../services/socketService.js';

/**
 * GET /api/v1/realtime/status
 * Get real-time connection status
 */
export async function getStatus(req, res) {
  const io = getIO();

  return res.status(200).json(
    success(
      {
        enabled: !!io,
        connections: io ? io.engine.clientsCount : 0,
        server_url: `ws://${process.env.APP_URL?.replace('http://', '') || 'localhost:3000'}`,
      },
      'Real-time status',
      200
    )
  );
}

/**
 * POST /api/v1/realtime/test
 * Send test notification to current user
 */
export async function sendTestNotification(req, res) {
  const io = getIO();

  if (!io) {
    return res.status(503).json({
      error: 'Real-time notifications not enabled',
      message: 'Socket.io is not initialized',
    });
  }

  const testNotification = {
    id: `test_${Date.now()}`,
    title: 'Test Notification',
    body: 'This is a test notification from the real-time system',
    type: 'test',
    timestamp: new Date().toISOString(),
  };

  io.to(`user:${req.user.id}`).emit('notification', testNotification);

  return res.status(200).json(
    success(
      {
        sent: true,
        notification: testNotification,
        message: 'Test notification sent to your client',
      },
      'Test notification sent',
      200
    )
  );
}

export default {
  getStatus,
  sendTestNotification,
};
