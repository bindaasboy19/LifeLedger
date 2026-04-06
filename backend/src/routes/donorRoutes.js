import { Router } from 'express';
import {
  addDonationRecord,
  getDonationCertificates,
  getDonorHistory,
  listDonorRegistry,
  updateDonorProfile
} from '../controllers/donorController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { requireMongo } from '../middleware/requireMongo.js';
import { validate } from '../middleware/validate.js';
import { donorDonationSchema, donorProfileSchema } from '../utils/schemas.js';

const router = Router();

router.use(authenticate);
router.patch('/profile', authorize(['user', 'donor', 'admin']), validate(donorProfileSchema), updateDonorProfile);
router.get('/registry', authorize(['ngo', 'hospital', 'blood_bank', 'admin']), listDonorRegistry);
router.get('/certificates/:uid?', requireMongo, authorize(['user', 'donor', 'ngo', 'hospital', 'blood_bank', 'admin']), getDonationCertificates);
router.get('/history/:uid?', requireMongo, authorize(['user', 'donor', 'ngo', 'hospital', 'blood_bank', 'admin']), getDonorHistory);
router.post(
  '/history/:uid?',
  requireMongo,
  authorize(['user', 'donor', 'ngo', 'hospital', 'blood_bank', 'admin']),
  validate(donorDonationSchema),
  addDonationRecord
);

export default router;
