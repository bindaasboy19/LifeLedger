import { Router } from 'express';
import { getPrediction } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { requireMongo } from '../middleware/requireMongo.js';

const router = Router();

router.use(authenticate, authorize(['admin', 'hospital', 'blood_bank', 'ngo']), requireMongo);
router.post('/predict', getPrediction);

export default router;
