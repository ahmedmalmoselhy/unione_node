import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

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

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════╗
    ║   UniOne Backend - Node.js         ║
    ║   Server running on port ${PORT}      ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}  ║
    ╚════════════════════════════════════╝
  `);
});

export default app;
