import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import { mongoSanitize } from './middlewares/mongoSanitize.js';
import { AppError } from './utils/appError.js';
import apiRouter from './routes/index.js';

const app = express();

// CORS configuration (Must be at the top to handle preflight OPTIONS requests)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP (Rate Limiter)
const limiter = rateLimit({
  max: process.env.NODE_ENV === 'development' ? 5000 : 200,
  windowMs: 15 * 60 * 1000, // 15 minutes
  skip: (req) => req.method === 'OPTIONS', // Exclude preflight requests from counting
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize);
app.use(cookieParser());

// Test route (Health check)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend API is running smoothly',
    timestamp: new Date()
  });
});

// Main API routes
app.use('/api', apiRouter);

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

export default app;
