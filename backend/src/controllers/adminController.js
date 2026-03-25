import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { SosHistory } from '../models/SosHistory.js';
import { DonationHistory } from '../models/DonationHistory.js';
import { AITrainingData } from '../models/AITrainingData.js';
import { logAudit } from '../services/auditService.js';
import { seedPrototypeActivity } from '../services/prototypeSeedService.js';

export const listVerificationQueue = asyncHandler(async (_req, res) => {
  const snapshot = await db.collection('users').get();

  const queue = snapshot.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((user) => ['hospital', 'blood_bank'].includes(user.role) && !user.isVerified);

  res.json({ success: true, data: queue });
});

export const verifyOrganization = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { isVerified } = req.body;

  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    throw new AppError('User not found', 404);
  }

  await userRef.set(
    {
      isVerified,
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.user.uid
    },
    { merge: true }
  );

  await logAudit({
    actorUid: req.user.uid,
    actorRole: req.user.role,
    action: isVerified ? 'verify_account' : 'unverify_account',
    targetType: 'user',
    targetId: uid,
    metadata: { isVerified }
  });

  const updated = await userRef.get();

  res.json({ success: true, data: updated.data() });
});

export const blockUser = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { isBlocked, reason } = req.body;

  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    throw new AppError('User not found', 404);
  }

  await userRef.set(
    {
      isBlocked,
      blockedReason: reason || null,
      blockedAt: new Date().toISOString(),
      blockedBy: req.user.uid
    },
    { merge: true }
  );

  await logAudit({
    actorUid: req.user.uid,
    actorRole: req.user.role,
    action: isBlocked ? 'block_user' : 'unblock_user',
    targetType: 'user',
    targetId: uid,
    metadata: { reason }
  });

  const updated = await userRef.get();

  res.json({ success: true, data: updated.data() });
});

export const getSOSLogs = asyncHandler(async (_req, res) => {
  const rows = await SosHistory.find({}).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data: rows });
});

export const getSystemAnalytics = asyncHandler(async (_req, res) => {
  const [usersSnapshot, stockSnapshot, campsSnapshot, sosCount, donationsCount, aiRows] = await Promise.all([
    db.collection('users').get(),
    db.collection('blood_stock').get(),
    db.collection('donation_camps').get(),
    SosHistory.countDocuments(),
    DonationHistory.countDocuments(),
    AITrainingData.find({}).sort({ date: -1 }).limit(1000).lean()
  ]);

  const users = usersSnapshot.docs.map((doc) => doc.data());

  const roleDistribution = users.reduce((acc, user) => {
    const role = user.role || 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const stocks = stockSnapshot.docs.map((doc) => doc.data());
  const byBloodGroup = stocks.reduce((acc, stock) => {
    acc[stock.bloodGroup] = (acc[stock.bloodGroup] || 0) + Number(stock.units || 0);
    return acc;
  }, {});

  const recentDemandSignals = aiRows.slice(0, 20).map((row) => ({
    date: row.date,
    region: row.region,
    bloodGroup: row.bloodGroup,
    score: row.sosCount + row.usageUnits - row.campDonationVolume
  }));

  res.json({
    success: true,
    data: {
      totals: {
        users: users.length,
        stockEntries: stockSnapshot.size,
        camps: campsSnapshot.size,
        sosCount,
        donationsCount
      },
      roleDistribution,
      stockByBloodGroup: byBloodGroup,
      recentDemandSignals
    }
  });
});

export const generatePrototypeSeed = asyncHandler(async (req, res) => {
  const result = await seedPrototypeActivity({ actorUid: req.user.uid });

  await logAudit({
    actorUid: req.user.uid,
    actorRole: req.user.role,
    action: 'generate_prototype_seed',
    targetType: 'system',
    targetId: 'prototype_activity',
    metadata: result
  });

  res.json({
    success: true,
    data: result
  });
});
