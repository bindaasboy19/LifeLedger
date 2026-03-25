import { Router } from 'express';
import { getMyProfile, updateMyProfile, upsertProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileUpdateSchema, upsertProfileSchema } from '../utils/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/me', getMyProfile);
router.post('/profile', validate(upsertProfileSchema), upsertProfile);
router.patch('/profile', validate(profileUpdateSchema), updateMyProfile);

export default router;
