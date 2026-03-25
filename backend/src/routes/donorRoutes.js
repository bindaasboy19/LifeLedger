import { Router } from 'express';
import {
  addDonationRecord,
  getDonorHistory,
  updateDonorProfile
} from '../controllers/donorController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { requireMongo } from '../middleware/requireMongo.js';
import { validate } from '../middleware/validate.js';
import { donorDonationSchema, donorProfileSchema } from '../utils/schemas.js';

const router = Router();

router.use(authenticate);
router.patch('/profile', authorize(['donor', 'admin']), validate(donorProfileSchema), updateDonorProfile);
router.get('/history/:uid?', requireMongo, authorize(['donor', 'admin']), getDonorHistory);
router.post(
  '/history/:uid?',
  requireMongo,
  authorize(['donor', 'hospital', 'blood_bank', 'admin']),
  validate(donorDonationSchema),
  addDonationRecord
);

export default router;
