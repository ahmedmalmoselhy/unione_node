const Queue = require('bull');
const logger = require('../utils/logger').default;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Webhook queue for outbound webhook deliveries
const webhookQueue = new Queue('webhook-delivery', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with 1 minute
    },
    removeOnComplete: 200,
    removeOnFail: 100,
    timeout: 30000, // 30 second timeout
  },
});

// Error handler
webhookQueue.on('error', (error) => {
  logger.error(`🔗 Webhook queue error: ${error.message}`);
});

// Failed job handler
webhookQueue.on('failed', (job, error) => {
  logger.error(`🔗 Webhook job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`, {
    jobId: job.id,
    webhookId: job.data.webhookId,
    event: job.data.event,
  });
});

// Completed job handler
webhookQueue.on('completed', (job) => {
  logger.debug(`🔗 Webhook delivered: ${job.data.event}`, {
    jobId: job.id,
    webhookId: job.data.webhookId,
  });
});

/**
 * Add webhook to queue
 * @param {object} data - Webhook delivery data
 * @returns {Promise<object>} Bull job
 */
async function addWebhook(data) {
  try {
    const job = await webhookQueue.add({
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.info(`🔗 Webhook queued: ${data.event}`, {
      jobId: job.id,
      webhookId: data.webhookId,
    });
    return job;
  } catch (error) {
    logger.error(`🔗 Failed to queue webhook: ${error.message}`, {
      event: data.event,
    });
    throw error;
  }
}

/**
 * Process webhook delivery
 * @param {object} job - Bull job
 */
async function processWebhook(job) {
  const { webhookUrl, payload, headers, secret } = job.data;
  
  logger.info(`🔗 Delivering webhook: ${job.data.event}`, {
    jobId: job.id,
    webhookId: job.data.webhookId,
    attempt: job.attemptsMade + 1,
    url: webhookUrl,
  });

  const axios = require('axios');
  const crypto = require('crypto');

  // Create signature
  const signature = secret
    ? crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
    : null;

  // Make HTTP request
  const response = await axios.post(webhookUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-UniOne-Event': job.data.event,
      'X-UniOne-Signature': signature,
      ...headers,
    },
    timeout: 30000,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  logger.info(`🔗 Webhook delivered successfully: ${response.status}`, {
    jobId: job.id,
    webhookId: job.data.webhookId,
  });

  return {
    success: true,
    statusCode: response.status,
    attempts: job.attemptsMade + 1,
  };
}

// Register processor
webhookQueue.process(5, processWebhook); // Concurrency: 5

module.exports = {
  webhookQueue,
  addWebhook,
  processWebhook,
};
