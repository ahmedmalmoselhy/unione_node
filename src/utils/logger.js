/**
 * Simple logger utility
 * Provides structured logging for the application
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;

function formatMessage(level, message, meta = {}) {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

const logger = {
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(JSON.stringify(formatMessage('error', message, meta)));
    }
  },

  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(JSON.stringify(formatMessage('warn', message, meta)));
    }
  },

  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.info) {
      console.info(JSON.stringify(formatMessage('info', message, meta)));
    }
  },

  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.debug(JSON.stringify(formatMessage('debug', message, meta)));
    }
  },
};

export default logger;
