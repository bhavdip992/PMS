import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({ status: err.status, error: err, message: err.message, stack: err.stack });
  } else {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    if (error.isOperational) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
    } else {
      console.error('ERROR', err);
      res.status(500).json({ status: 'error', message: 'Something went wrong!' });
    }
  }
};

const handleCastErrorDB = (err: any): AppError => new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg?.match(/([\"'])(\\?.)*?\1/)?.[0] || '';
  return new AppError(`Duplicate field value: ${value}. Please use another value!`, 400);
};
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors || {}).map((el: any) => el.message);
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};
const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = (): AppError => new AppError('Your token has expired! Please log in again.', 401);
