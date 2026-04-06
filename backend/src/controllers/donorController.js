import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { DonationHistory } from '../models/DonationHistory.js';
import { DonationCertificate } from '../models/DonationCertificate.js';
import { CAMP_ORGANIZER_ROLES, COMMUNITY_ROLES, ROLES } from '../utils/constants.js';

const DONATION_COOLDOWN_DAYS = 90;

const daysBetween = (d1, d2) => Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
const canManageDonorRecords = (role) => [...CAMP_ORGANIZER_ROLES, ROLES.ADMIN].includes(role);

export const updateDonorProfile = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const payload = req.body;

  if (payload.lastDonationDate) {
    const elapsed = daysBetween(new Date(payload.lastDonationDate), new Date());
    if (elapsed < DONATION_COOLDOWN_DAYS) {
      payload.availabilityStatus = false;
    }
  }

  await db.collection('users').doc(uid).set(
    {
      ...payload,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  const updated = await db.collection('users').doc(uid).get();

  res.json({ success: true, data: updated.data() });
});

export const getDonorHistory = asyncHandler(async (req, res) => {
  const donorUid = req.params.uid || req.user.uid;

  if (req.user.uid !== donorUid && !canManageDonorRecords(req.user.role)) {
    throw new AppError('Forbidden donor history access', 403);
  }

  const records = await DonationHistory.find({ donorUid }).sort({ donatedAt: -1 }).lean();

  res.json({ success: true, data: records });
});

export const addDonationRecord = asyncHandler(async (req, res) => {
  const donorUid = req.params.uid || req.user.uid;
  const donatedAt = new Date(req.body.donatedAt);

  const lastRecord = await DonationHistory.findOne({ donorUid }).sort({ donatedAt: -1 });

  if (lastRecord) {
    const elapsed = daysBetween(new Date(lastRecord.donatedAt), donatedAt);
    if (elapsed < DONATION_COOLDOWN_DAYS) {
      throw new AppError(`Donor is in cooldown. ${DONATION_COOLDOWN_DAYS - elapsed} days remaining.`, 400);
    }
  }

  const created = await DonationHistory.create({
    ...req.body,
    donorUid,
    donatedAt
  });

  await db.collection('users').doc(donorUid).set(
    {
      lastDonationDate: donatedAt.toISOString(),
      availabilityStatus: false,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  res.status(201).json({ success: true, data: created });
});

export const listDonorRegistry = asyncHandler(async (req, res) => {
  const { bloodGroup, city, availableOnly = 'false' } = req.query;
  const snapshot = await db.collection('users').get();

  let rows = snapshot.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((user) => COMMUNITY_ROLES.includes(user.role));

  if (bloodGroup) {
    rows = rows.filter((row) => row.bloodGroup === String(bloodGroup).toUpperCase());
  }

  if (city) {
    rows = rows.filter((row) => row.location?.city?.toLowerCase() === String(city).toLowerCase());
  }

  if (String(availableOnly) === 'true') {
    rows = rows.filter((row) => row.availabilityStatus !== false);
  }

  rows.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

  res.json({ success: true, data: rows });
});

export const getDonationCertificates = asyncHandler(async (req, res) => {
  const targetUid = req.params.uid || req.user.uid;

  if (targetUid !== req.user.uid && !canManageDonorRecords(req.user.role)) {
    throw new AppError('Forbidden certificate access', 403);
  }

  const certificates = await DonationCertificate.find({ donorUid: targetUid })
    .sort({ issuedAt: -1 })
    .lean();

  res.json({ success: true, data: certificates });
});
