import { Router } from 'express';
import authRoutes from './authRoutes.js';
import stockRoutes from './stockRoutes.js';
import sosRoutes from './sosRoutes.js';
import donorRoutes from './donorRoutes.js';
import campRoutes from './campRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import aiRoutes from './aiRoutes.js';
import { firebaseState } from '../config/firebase.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'backend',
    mongo: req.app.locals.mongoReady ? 'up' : 'down',
    firebase: firebaseState.initializedWith,
    firebaseWarning: firebaseState.warning
  });
});

router.use('/auth', authRoutes);
router.use('/stock', stockRoutes);
router.use('/sos', sosRoutes);
router.use('/donor', donorRoutes);
router.use('/camps', campRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

export default router;
