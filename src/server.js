import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import authRoutes from './routes/authRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import professorRoutes from './routes/professorRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'UniOne Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (to be added)
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to UniOne Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/professor', professorRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

let server;

export function startServer() {
  if (!server) {
    server = app.listen(PORT, () => {
      console.log(`
    ╔════════════════════════════════════╗
    ║   UniOne Backend - Node.js         ║
    ║   Server running on port ${PORT}      ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}  ║
    ╚════════════════════════════════════╝
  `);
    });
  }

  return server;
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && currentFilePath === process.argv[1]) {
  startServer();
}

export default app;
