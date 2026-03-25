import { Router } from 'express';
import {
  blockUser,
  generatePrototypeSeed,
  getSOSLogs,
  getSystemAnalytics,
  listVerificationQueue,
  verifyOrganization
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { requireMongo } from '../middleware/requireMongo.js';
import { validate } from '../middleware/validate.js';
import { adminBlockSchema, adminVerifySchema } from '../utils/schemas.js';

const router = Router();

router.use(authenticate, authorize('admin'), requireMongo);

router.get('/verification-queue', listVerificationQueue);
router.patch('/verify/:uid', validate(adminVerifySchema), verifyOrganization);
router.patch('/block/:uid', validate(adminBlockSchema), blockUser);
router.get('/sos-logs', getSOSLogs);
router.get('/analytics', getSystemAnalytics);
router.post('/prototype-seed', generatePrototypeSeed);

export default router;
