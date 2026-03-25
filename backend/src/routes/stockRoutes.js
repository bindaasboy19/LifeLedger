import { Router } from 'express';
import {
  createStock,
  deleteStock,
  listStockFlow,
  listStock,
  searchStock,
  updateStock
} from '../controllers/stockController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { stockSchema, stockUpdateSchema } from '../utils/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', listStock);
router.get('/flow', listStockFlow);
router.get('/search', searchStock);
router.post(
  '/',
  authorize(['hospital', 'blood_bank', 'admin'], { requireVerified: true }),
  validate(stockSchema),
  createStock
);
router.patch(
  '/:id',
  authorize(['hospital', 'blood_bank', 'admin'], { requireVerified: true }),
  validate(stockUpdateSchema),
  updateStock
);
router.delete('/:id', authorize(['hospital', 'blood_bank', 'admin']), deleteStock);

export default router;
