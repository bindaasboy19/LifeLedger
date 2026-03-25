import { AppError } from '../utils/http.js';

export const authorize = (roles = [], { requireVerified = false } = {}) => {
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (normalizedRoles.length > 0 && !normalizedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient role', 403));
    }

    if (requireVerified && !req.user.isVerified) {
      return next(new AppError('Account is not verified by admin', 403));
    }

    return next();
  };
};
