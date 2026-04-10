import { Router } from 'express';
import { getPrediction, getPredictionHealth } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize(['admin', 'hospital', 'blood_bank', 'ngo']));
router.get('/health', getPredictionHealth);
router.post('/predict', getPrediction);

export default router;
