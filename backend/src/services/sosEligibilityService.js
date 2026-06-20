import { AppError } from '../utils/http.js';

const RATE_LIMIT_COLLECTION = 'sos_rate_limits';
const ABUSE_REVIEW_SCORE = 4;

const startOfDayKey = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysBetween = (from, to = new Date()) => {
  const fromDate = toDate(from);
  if (!fromDate) return null;
  return Math.floor((to.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const deriveSOSVerificationStatus = (authUser = {}, profile = {}) => {
  if (profile.documentVerified || profile.phoneVerified || authUser.emailVerified) {
    return 'verified';
  }

  if (profile.manualReviewRequired) {
    return 'manual_review';
  }

  return 'unverified';
};

export const getDonationCooldownDays = (profile = {}) => {
  const gender = String(profile.gender || '').trim().toLowerCase();
  return gender === 'female' ? 120 : 90;
};

export const isPolicyEligibleDonor = (profile = {}, now = new Date()) => {
  if (profile.isBlocked) {
    return { eligible: false, reasons: ['blocked'] };
  }

  if (profile.availabilityStatus === false) {
    return { eligible: false, reasons: ['unavailable'] };
  }

  if (profile.eligibility?.isEligible === false) {
    return { eligible: false, reasons: ['eligibility-flagged'] };
  }

  const reasons = [];

  if (profile.age !== undefined && (Number(profile.age) < 18 || Number(profile.age) > 65)) {
    reasons.push('age');
  }

  if (profile.weightKg !== undefined && Number(profile.weightKg) < 45) {
    reasons.push('weight');
  }

  if (profile.hemoglobin !== undefined && Number(profile.hemoglobin) < 12.5) {
    reasons.push('hemoglobin');
  }

  const nextEligibleAt = toDate(profile.nextEligibleAt);
  if (nextEligibleAt && nextEligibleAt > now) {
    reasons.push('cooldown');
  } else {
    const minDays = getDonationCooldownDays(profile);
    const daysSinceDonation = daysBetween(profile.lastDonationDate, now);
    if (daysSinceDonation !== null && daysSinceDonation < minDays) {
      reasons.push('cooldown');
    }
  }

  const healthFlags = Array.isArray(profile.healthFlags) ? profile.healthFlags : [];
  if (healthFlags.some((flag) => ['deferred', 'fever', 'infection', 'high-risk'].includes(flag))) {
    reasons.push('health');
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
};

export const enforceDailySOSRateLimit = async ({ db, userId, maxRequests = 3 }) => {
  const key = `${userId}_${startOfDayKey()}`;
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(key);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = new Date().toISOString();

    if (!snap.exists) {
      tx.set(ref, {
        userId,
        dateKey: startOfDayKey(),
        count: 1,
        createdAt: now,
        updatedAt: now
      });
      return;
    }

    const nextCount = Number(snap.data().count || 0) + 1;
    if (nextCount > maxRequests) {
      throw new AppError('SOS request limit reached for today.', 429);
    }

    tx.update(ref, {
      count: nextCount,
      updatedAt: now
    });
  });
};

export const buildSOSAbuseSignals = async ({ db, requesterId, location, bloodGroup }) => {
  const now = Date.now();
  const snapshot = await db
    .collection('sos_requests')
    .where('requesterUid', '==', requesterId)
    .get();

  const recentRows = snapshot.docs
    .map((doc) => doc.data())
    .filter((row) => {
      const createdAt = toDate(row.createdAt);
      return createdAt && now - createdAt.getTime() <= 24 * 60 * 60 * 1000;
    });

  let score = 0;
  const reasons = [];

  if (recentRows.length >= 2) {
    score += 2;
    reasons.push('high-frequency');
  }

  const repeatedLocation = recentRows.some((row) => {
    const lat = Number(row.location?.lat);
    const lng = Number(row.location?.lng);
    return (
      Math.abs(lat - Number(location?.lat)) < 0.0008 &&
      Math.abs(lng - Number(location?.lng)) < 0.0008 &&
      row.bloodGroup === bloodGroup
    );
  });

  if (repeatedLocation) {
    score += 1;
    reasons.push('repeat-location');
  }

  const suspiciousCancels = recentRows.filter((row) => ['cancelled', 'expired'].includes(String(row.status))).length;
  if (suspiciousCancels >= 2) {
    score += 2;
    reasons.push('repeat-cancel');
  }

  return {
    score,
    reasons,
    requiresReview: score >= ABUSE_REVIEW_SCORE
  };
};
