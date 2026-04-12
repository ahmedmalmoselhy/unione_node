const { emailQueue } = require('../queues/emailQueue');
const { webhookQueue } = require('../queues/webhookQueue');
const logger = require('../utils/logger').default;

/**
 * GET /api/v1/admin/queue/status
 * Get queue system status
 */
async function getQueueStatus(req, res) {
  try {
    const emailCounts = await emailQueue.getJobCounts();
    const webhookCounts = await webhookQueue.getJobCounts();

    const status = {
      email: {
        waiting: emailCounts.waiting,
        active: emailCounts.active,
        completed: emailCounts.completed,
        failed: emailCounts.failed,
        delayed: emailCounts.delayed,
      },
      webhook: {
        waiting: webhookCounts.waiting,
        active: webhookCounts.active,
        completed: webhookCounts.completed,
        failed: webhookCounts.failed,
        delayed: webhookCounts.delayed,
      },
      healthy: true,
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  } catch (error) {
    logger.error(`Queue status error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to get queue status',
      healthy: false,
    });
  }
}

/**
 * GET /api/v1/admin/queue/failed
 * Get failed jobs
 */
async function getFailedJobs(req, res) {
  try {
    const { queue: queueName } = req.query;
    const start = parseInt(req.query.start) || 0;
    const end = parseInt(req.query.end) || 50;

    let failedJobs = [];

    if (!queueName || queueName === 'email') {
      const emailFailed = await emailQueue.getFailed(start, end);
      failedJobs.push(...emailFailed.map(job => ({
        queue: 'email',
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
      })));
    }

    if (!queueName || queueName === 'webhook') {
      const webhookFailed = await webhookQueue.getFailed(start, end);
      failedJobs.push(...webhookFailed.map(job => ({
        queue: 'webhook',
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
      })));
    }

    res.json({
      failedJobs,
      total: failedJobs.length,
    });
  } catch (error) {
    logger.error(`Get failed jobs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get failed jobs' });
  }
}

/**
 * POST /api/v1/admin/queue/:jobId/retry
 * Retry a failed job
 */
async function retryFailedJob(req, res) {
  try {
    const { jobId } = req.params;
    const { queue: queueName } = req.body;

    let job;

    if (queueName === 'email') {
      job = await emailQueue.getJob(jobId);
    } else if (queueName === 'webhook') {
      job = await webhookQueue.getJob(jobId);
    } else {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.retry();

    res.json({
      message: 'Job queued for retry',
      jobId: job.id,
    });
  } catch (error) {
    logger.error(`Retry job error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retry job' });
  }
}

module.exports = {
  getQueueStatus,
  getFailedJobs,
  retryFailedJob,
};
