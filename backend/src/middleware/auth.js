import { auth as firebaseAuth, db } from '../config/firebase.js';
import { AppError } from '../utils/http.js';

const getToken = (header) => {
  if (!header) return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.replace('Bearer ', '').trim();
};

export const authenticate = async (req, _res, next) => {
  try {
    const token = getToken(req.headers.authorization);
    if (!token) {
      return next(new AppError('Missing auth token', 401));
    }

    const decoded = await firebaseAuth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    if (userData?.isBlocked) {
      return next(new AppError('Account blocked by admin', 403));
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: userData?.role || decoded.role || 'user',
      isVerified: Boolean(userData?.isVerified),
      profile: userData
    };

    return next();
  } catch (error) {
    if (error?.code === 'app/invalid-credential') {
      return next(
        new AppError('Firebase server credentials are invalid. Fix FIREBASE_* environment variables.', 503)
      );
    }

    if (error?.code === 'auth/id-token-expired') {
      return next(new AppError('Session expired. Please login again.', 401));
    }

    if (error?.code === 'auth/argument-error') {
      return next(new AppError('Malformed auth token. Please login again.', 401));
    }

    if (error?.code?.startsWith('auth/')) {
      return next(new AppError('Invalid auth token', 401));
    }

    return next(new AppError('Authentication failed', 401));
  }
};
