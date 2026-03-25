import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const sosRateLimiter = rateLimit({
  windowMs: env.sosRateWindowMs,
  max: env.sosRateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many SOS requests. Please wait and try again.'
  }
});
