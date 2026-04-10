import { Router } from 'express';
import {
  applyForCamp,
  createCamp,
  deleteCamp,
  listCampApplications,
  listCamps,
  listMyCampApplications,
  updateCampApplication,
  updateCamp
} from '../controllers/campController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { requireMongo } from '../middleware/requireMongo.js';
import { validate } from '../middleware/validate.js';
import {
  campApplicationCreateSchema,
  campApplicationUpdateSchema,
  campSchema,
  campUpdateSchema
} from '../utils/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', listCamps);
router.get('/applications/me', listMyCampApplications);
router.post('/', authorize(['hospital', 'admin', 'blood_bank', 'ngo'], { requireVerified: true }), validate(campSchema), createCamp);
router.post('/:id/applications', authorize(['user']), validate(campApplicationCreateSchema), applyForCamp);
router.get('/:id/applications', authorize(['hospital', 'admin', 'blood_bank', 'ngo']), listCampApplications);
router.patch('/:id/applications/:applicationId', requireMongo, authorize(['hospital', 'admin', 'blood_bank', 'ngo']), validate(campApplicationUpdateSchema), updateCampApplication);
router.patch('/:id', authorize(['hospital', 'admin', 'blood_bank', 'ngo']), validate(campUpdateSchema), updateCamp);
router.delete('/:id', authorize(['hospital', 'admin', 'blood_bank', 'ngo']), deleteCamp);

export default router;
