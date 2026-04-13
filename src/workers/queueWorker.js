import logger from './services/logger.js';
import { emailQueue } from './queues/emailQueue.js';
import { webhookQueue } from './queues/webhookQueue.js';

/**
 * Queue Worker Process
 * Handles background job processing for email and webhook queues
 */

async function startWorker() {
  logger.info('🚀 Starting queue worker...');

  // Log queue status
  const emailCounts = await emailQueue.getJobCounts();
  const webhookCounts = await webhookQueue.getJobCounts();

  logger.info('📊 Queue status', {
    email: emailCounts,
    webhook: webhookCounts,
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await Promise.all([
      emailQueue.close(),
      webhookQueue.close(),
    ]);
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await Promise.all([
      emailQueue.close(),
      webhookQueue.close(),
    ]);
    process.exit(0);
  });

  // Log worker errors
  emailQueue.on('error', (error) => {
    logger.error('❌ Email queue worker error', { error: error.message });
  });

  webhookQueue.on('error', (error) => {
    logger.error('❌ Webhook queue worker error', { error: error.message });
  });

  logger.info('✅ Queue worker started successfully');
}

// Start the worker
startWorker().catch((error) => {
  logger.error('💥 Failed to start queue worker', { error: error.message });
  process.exit(1);
});
