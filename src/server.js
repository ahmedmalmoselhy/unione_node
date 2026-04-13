import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import * as Sentry from '@sentry/node';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import { initializeSocket } from './services/socketService.js';
import { httpLogger } from './services/logger.js';
import logger from './services/logger.js';
import cache from './services/cacheService.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import cacheRoutes from './routes/cacheRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';
import authRoutes from './routes/authRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import professorRoutes from './routes/professorRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import adminWebhookRoutes from './routes/adminWebhookRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import localeRoutes from './routes/localeRoutes.js';
import adminExportRoutes from './routes/adminExportRoutes.js';
import adminImportTemplateRoutes from './routes/adminImportTemplateRoutes.js';
import adminImportRoutes from './routes/adminImportRoutes.js';
import adminAcademicTermRoutes from './routes/adminAcademicTermRoutes.js';
import adminProfessorRoutes from './routes/adminProfessorRoutes.js';
import adminCourseRoutes from './routes/adminCourseRoutes.js';
import adminSectionRoutes from './routes/adminSectionRoutes.js';
import adminStudentRoutes from './routes/adminStudentRoutes.js';
import adminEmployeeRoutes from './routes/adminEmployeeRoutes.js';
import adminEnrollmentRoutes from './routes/adminEnrollmentRoutes.js';
import adminGradeRoutes from './routes/adminGradeRoutes.js';
import adminAssignmentRoutes from './routes/adminAssignmentRoutes.js';
import adminReportsRoutes from './routes/adminReportsRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import realtimeRoutes from './routes/realtimeRoutes.js';
import advancedAnalyticsRoutes from './routes/advancedAnalyticsRoutes.js';
import bulkOperationRoutes from './routes/bulkOperationRoutes.js';
import dataPrivacyRoutes from './routes/dataPrivacyRoutes.js';
import integrationMarketplaceRoutes from './routes/integrationMarketplaceRoutes.js';
import { localeMiddleware } from './middleware/locale.js';

dotenv.config();

// Initialize Redis cache (non-blocking)
cache.connect().catch(err => {
  logger.warn('⚠️ Redis cache initialization failed', { error: err.message });
});

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
  logger.info('🔍 Sentry monitoring initialized');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(httpLogger); // Winston structured logging instead of morgan
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(localeMiddleware);

// Sentry request handler (must be before routes)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'UniOne Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// API Routes - Versioned under /api/v1/
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/professor', professorRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/locale', localeRoutes);
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin/exports', adminExportRoutes);
app.use('/api/v1/admin/import-templates', adminImportTemplateRoutes);
app.use('/api/v1/admin/imports', adminImportRoutes);
app.use('/api/v1/admin/academic-terms', adminAcademicTermRoutes);
app.use('/api/v1/admin/professors', adminProfessorRoutes);
app.use('/api/v1/admin/courses', adminCourseRoutes);
app.use('/api/v1/admin/sections', adminSectionRoutes);
app.use('/api/v1/admin/students', adminStudentRoutes);
app.use('/api/v1/admin/employees', adminEmployeeRoutes);
app.use('/api/v1/admin/enrollments', adminEnrollmentRoutes);
app.use('/api/v1/admin/grades', adminGradeRoutes);
app.use('/api/v1/admin', adminAssignmentRoutes);
app.use('/api/v1/admin', adminReportsRoutes);
app.use('/api/v1/admin/webhooks', adminWebhookRoutes);
app.use('/api/v1/admin/queue', queueRoutes);
app.use('/api/v1/realtime', realtimeRoutes);
app.use('/api/v1/admin/analytics', advancedAnalyticsRoutes);
app.use('/api/v1/admin/bulk', bulkOperationRoutes);
app.use('/api/v1/privacy', dataPrivacyRoutes);
app.use('/api/v1/admin/integrations', integrationMarketplaceRoutes);
app.use('/api/v1/admin/monitoring', monitoringRoutes);
app.use('/api/v1/admin/cache', cacheRoutes);
app.use('/api/v1/users', avatarRoutes);

// Backward compatibility - redirect old /api/* routes to /api/v1/*
app.use('/api/*', (req, res) => {
  const newPath = req.path;
  const versionedUrl = `/api/v1${newPath}`;
  
  return res.status(410).json({
    message: 'API versioning is now required.',
    redirect: versionedUrl,
    documentation: `${process.env.APP_URL || 'http://localhost:3000'}/docs`,
  }).header('X-API-Deprecation', 'Use /api/v1/ instead');
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

let socketIO;

async function startServer() {
  // Initialize Socket.io
  try {
    socketIO = await initializeSocket(server);
    console.log('🔌 Socket.io initialized');
  } catch (error) {
    console.warn('⚠️ Socket.io initialization failed:', error.message);
  }

  return server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════╗
    ║   UniOne Backend - Node.js         ║
    ║   Server running on port ${PORT}      ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}  ║
    ║   Real-time: ${socketIO ? 'Enabled' : 'Disabled'}          ║
    ╚════════════════════════════════════╝
  `);
  });
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && currentFilePath === process.argv[1]) {
  startServer();
}

export default app;
export { server, startServer };
