import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError, isApiError } from '../utils/apiError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isApiError(err)) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? undefined,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: 'Invalid identifier',
      details: { path: err.path, value: err.value },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
};
