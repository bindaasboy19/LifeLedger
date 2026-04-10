import mongoose from 'mongoose';
import { AppError } from '../utils/http.js';

export const requireMongo = (req, _res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError('This feature is temporarily unavailable right now.', 503));
  }

  return next();
};
