const Queue = require('bull');
const logger = require('../utils/logger').default;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Email queue for all outbound emails
const emailQueue = new Queue('email-delivery', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with 1 minute
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
});

// Error handler
emailQueue.on('error', (error) => {
  logger.error(`📧 Email queue error: ${error.message}`);
});

// Failed job handler
emailQueue.on('failed', (job, error) => {
  logger.error(`📧 Email job ${job.id} failed: ${error.message}`, {
    jobId: job.id,
    attempts: job.attemptsMade,
    data: job.data,
  });
});

// Completed job handler
emailQueue.on('completed', (job) => {
  logger.info(`📧 Email job ${job.id} completed`, {
    jobId: job.id,
    type: job.data.type,
  });
});

/**
 * Add email to queue
 * @param {string} type - Email type (announcement, exam_schedule, grade, etc.)
 * @param {object} data - Email data
 * @returns {Promise<object>} Bull job
 */
async function addEmail(type, data) {
  try {
    const job = await emailQueue.add({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    logger.info(`📧 Email queued: ${type}`, { jobId: job.id });
    return job;
  } catch (error) {
    logger.error(`📧 Failed to queue email: ${error.message}`, { type });
    throw error;
  }
}

/**
 * Process email queue
 * @param {object} job - Bull job
 */
async function processEmail(job) {
  const { type, data } = job.data;
  
  logger.info(`📧 Processing email: ${type}`, {
    jobId: job.id,
    attempt: job.attemptsMade + 1,
  });

  // Import email service dynamically to avoid circular dependencies
  const emailService = require('../services/emailDeliveryService');

  switch (type) {
    case 'announcement':
      await emailService.sendAnnouncementEmail(data.userId, data.announcement);
      break;
    case 'exam_schedule':
      await emailService.sendExamScheduleEmail(data.userId, data.examSchedule);
      break;
    case 'grade_published':
      await emailService.sendGradePublishedEmail(data.userId, data.grade);
      break;
    case 'waitlist_promoted':
      await emailService.sendWaitlistPromotedEmail(data.userId, data.enrollment);
      break;
    case 'enrollment_confirmed':
      await emailService.sendEnrollmentConfirmationEmail(data.userId, data.enrollment);
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  return { success: true, type };
}

// Register processor
emailQueue.process(1, processEmail); // Concurrency: 1

module.exports = {
  emailQueue,
  addEmail,
  processEmail,
};
