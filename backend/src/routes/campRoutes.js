import { Router } from 'express';
import {
  createCamp,
  deleteCamp,
  listCamps,
  updateCamp
} from '../controllers/campController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { campSchema, campUpdateSchema } from '../utils/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', listCamps);
router.post('/', authorize(['hospital', 'admin', 'blood_bank'], { requireVerified: true }), validate(campSchema), createCamp);
router.patch('/:id', authorize(['hospital', 'admin', 'blood_bank']), validate(campUpdateSchema), updateCamp);
router.delete('/:id', authorize(['hospital', 'admin', 'blood_bank']), deleteCamp);

export default router;
