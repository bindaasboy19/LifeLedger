import { Router } from 'express';
import { createSOS, listSOS, updateSOSStatus } from '../controllers/sosController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sosCreateSchema, sosStatusUpdateSchema } from '../utils/schemas.js';
import { sosRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);
router.get('/', listSOS);
router.post('/', sosRateLimiter, validate(sosCreateSchema), createSOS);
router.patch('/:id/status', validate(sosStatusUpdateSchema), updateSOSStatus);

export default router;
