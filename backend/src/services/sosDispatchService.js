import { db } from '../config/firebase.js';
import { canDonateTo } from './bloodCompatibility.js';
import { calculateDistanceKm } from './locationService.js';
import { broadcastNotifications, createNotification, sendEmailBatch } from './notificationService.js';
import { isPolicyEligibleDonor } from './sosEligibilityService.js';
import { isCommunityRole } from '../utils/constants.js';
import { logAudit } from './auditService.js';

const SOS_COLLECTION = 'sos_requests';
const OFFER_COLLECTION = 'sos_dispatch_offers';
const TRACKING_COLLECTION = 'sos_tracking';
const DISPATCH_RADII = [5, 10, 20];
const PHASE_WAIT_MS = 30 * 1000;
const MAX_OFFERS_PER_PHASE = 12;
const SOS_TIMEOUT_MS = 15 * 60 * 1000;

const nowIso = () => new Date().toISOString();

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeSosStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  return normalized === 'created' ? 'open' : normalized;
};

const safeAudit = async (payload) => {
  try {
    await logAudit(payload);
  } catch {
    // ignore audit failures for live-flow stability
  }
};

const buildOfferMessage = (sos) =>
  `Urgent ${sos.bloodGroup} SOS near ${sos.location?.district || sos.location?.city || 'your area'}.`;

const getExcludedIds = (sos) => new Set([...(sos.excludedDonorIds || []), ...(sos.offeredDonorIds || [])]);

const mapUserDoc = (doc) => ({ uid: doc.id, ...doc.data() });

const getNextDispatchMeta = (sos, forceImmediateExpansion = false) => {
  const currentRadius = Number(sos.currentRadiusKm || 0);
  const currentIndex = DISPATCH_RADII.indexOf(currentRadius);

  if (!currentRadius) {
    return { phase: 1, radiusKm: DISPATCH_RADII[0], previousRadiusKm: 0 };
  }

  const phaseExpiry = toDate(sos.phaseExpiresAt);
  const expired = forceImmediateExpansion || (phaseExpiry ? phaseExpiry <= new Date() : true);

  if (!expired) {
    return null;
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= DISPATCH_RADII.length) {
    return { phase: DISPATCH_RADII.length + 1, radiusKm: null, previousRadiusKm: currentRadius };
  }

  return {
    phase: nextIndex + 1,
    radiusKm: DISPATCH_RADII[nextIndex],
    previousRadiusKm: DISPATCH_RADII[nextIndex - 1] || 0
  };
};

export const findEligibleDonorsForSOS = async (sos, { radiusKm, previousRadiusKm = 0 } = {}) => {
  const snapshot = await db.collection('users').get();
  const excludedIds = getExcludedIds(sos);

  return snapshot.docs
    .map(mapUserDoc)
    .filter((user) => user.uid !== sos.requesterUid)
    .filter((user) => isCommunityRole(user.role))
    .filter((user) => !excludedIds.has(user.uid))
    .filter((user) => Boolean(user.bloodGroup) && canDonateTo(user.bloodGroup, sos.bloodGroup))
    .map((user) => ({
      ...user,
      policyCheck: isPolicyEligibleDonor(user)
    }))
    .filter((user) => user.policyCheck.eligible)
    .map((user) => ({
      ...user,
      distanceKm: calculateDistanceKm(
        Number(sos.location?.lat),
        Number(sos.location?.lng),
        Number(user.location?.lat),
        Number(user.location?.lng)
      )
    }))
    .filter((user) => user.distanceKm !== null)
    .filter((user) => user.distanceKm <= radiusKm && user.distanceKm > Number(previousRadiusKm || 0))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_OFFERS_PER_PHASE);
};

export const closePendingOffersForSOS = async ({ sosId, nextStatus = 'locked' }) => {
  const snapshot = await db.collection(OFFER_COLLECTION).where('sosId', '==', sosId).get();
  const batch = db.batch();
  let changed = 0;

  snapshot.docs.forEach((doc) => {
    const offer = doc.data();
    if (offer.offerStatus === 'pending') {
      batch.update(doc.ref, {
        offerStatus: nextStatus,
        updatedAt: nowIso()
      });
      changed += 1;
    }
  });

  if (changed > 0) {
    await batch.commit();
  }
};

const acquireDispatchLease = async (sosId) => {
  const ref = db.collection(SOS_COLLECTION).doc(sosId);
  const leaseOwner = `dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const leaseUntil = new Date(Date.now() + 20 * 1000).toISOString();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;

    const sos = snap.data();
    if (normalizeSosStatus(sos.status) !== 'open') return null;

    const currentLeaseUntil = toDate(sos.dispatchLeaseUntil);
    if (currentLeaseUntil && currentLeaseUntil > new Date()) {
      return null;
    }

    tx.update(ref, {
      dispatchLeaseOwner: leaseOwner,
      dispatchLeaseUntil: leaseUntil,
      updatedAt: nowIso()
    });

    return {
      ...sos,
      id: sosId,
      dispatchLeaseOwner: leaseOwner,
      dispatchLeaseUntil: leaseUntil,
      status: normalizeSosStatus(sos.status)
    };
  });
};

const releaseDispatchLease = async (sosId, leaseOwner, patch = {}) => {
  const ref = db.collection(SOS_COLLECTION).doc(sosId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const sos = snap.data();
    if (sos.dispatchLeaseOwner !== leaseOwner) return;

    tx.update(ref, {
      dispatchLeaseOwner: null,
      dispatchLeaseUntil: null,
      updatedAt: nowIso(),
      ...patch
    });
  });
};

const markSosUnmatched = async (leased) => {
  await releaseDispatchLease(leased.id, leased.dispatchLeaseOwner, {
    status: 'unmatched',
    timedOutAt: nowIso(),
    nextDispatchAt: null,
    phaseExpiresAt: null
  });

  await safeAudit({
    actorUid: leased.requesterUid,
    actorRole: leased.requesterRole || 'user',
    action: 'sos_unmatched',
    targetType: 'sos',
    targetId: leased.id,
    metadata: { bloodGroup: leased.bloodGroup }
  });

  try {
    await createNotification({
      userUid: leased.requesterUid,
      title: 'SOS Needs Manual Attention',
      message: 'No eligible donor accepted this SOS in time. Please contact a hospital or blood bank.',
      type: 'sos',
      referenceId: leased.id
    });
  } catch {
    // ignore
  }
};

export const dispatchSOSById = async (sosId, { forceImmediateExpansion = false } = {}) => {
  const leased = await acquireDispatchLease(sosId);
  if (!leased) return null;

  try {
    const createdAt = toDate(leased.createdAt) || new Date();
    if (Date.now() - createdAt.getTime() >= SOS_TIMEOUT_MS) {
      await releaseDispatchLease(sosId, leased.dispatchLeaseOwner, {
        status: 'expired',
        timedOutAt: nowIso(),
        nextDispatchAt: null,
        phaseExpiresAt: null
      });
      await closePendingOffersForSOS({ sosId, nextStatus: 'expired' });
      return { sosId, status: 'expired', offersCreated: 0 };
    }

    let nextMeta = getNextDispatchMeta(leased, forceImmediateExpansion);
    if (!nextMeta) {
      return { sosId, skipped: true };
    }

    while (nextMeta && nextMeta.radiusKm) {
      if (Number(leased.currentRadiusKm || 0) > 0) {
        await closePendingOffersForSOS({ sosId, nextStatus: 'expired' });
      }

      const donors = await findEligibleDonorsForSOS(leased, nextMeta);
      if (donors.length === 0) {
        Object.assign(leased, {
          dispatchPhase: nextMeta.phase,
          currentRadiusKm: nextMeta.radiusKm,
          phaseStartedAt: nowIso(),
          phaseExpiresAt: new Date(Date.now() + PHASE_WAIT_MS).toISOString(),
          nextDispatchAt: new Date(Date.now() + PHASE_WAIT_MS).toISOString()
        });

        nextMeta = getNextDispatchMeta(leased, true);
        continue;
      }

      const batch = db.batch();
      const offerIds = [];
      const issuedAt = nowIso();
      const respondBy = new Date(Date.now() + PHASE_WAIT_MS).toISOString();

      donors.forEach((donor) => {
        const offerRef = db.collection(OFFER_COLLECTION).doc();
        offerIds.push(offerRef.id);
        batch.set(offerRef, {
          sosId,
          donorId: donor.uid,
          bloodGroup: leased.bloodGroup,
          radiusKm: nextMeta.radiusKm,
          dispatchPhase: nextMeta.phase,
          offerStatus: 'pending',
          respondBy,
          requestSnapshot: {
            urgencyLevel: leased.urgency,
            locationText:
              leased.location?.address || leased.location?.district || leased.location?.city || 'Emergency zone',
            bloodGroup: leased.bloodGroup,
            requesterName: leased.requesterSnapshot?.displayName || 'LifeLedger user'
          },
          createdAt: issuedAt,
          updatedAt: issuedAt
        });
      });

      await batch.commit();

      try {
        await broadcastNotifications({
          recipients: donors,
          title: 'Emergency Blood Request',
          message: buildOfferMessage(leased),
          type: 'sos_offer',
          referenceId: sosId,
          metadata: {
            dispatchPhase: nextMeta.phase,
            radiusKm: nextMeta.radiusKm,
            urgencyLevel: leased.urgency
          }
        });
      } catch {
        // ignore notification fanout failure
      }

      try {
        await sendEmailBatch({
          recipients: donors,
          subject: `LifeLedger SOS Dispatch - ${leased.bloodGroup}`,
          text: buildOfferMessage(leased),
          html: `<p>${buildOfferMessage(leased)}</p>`
        });
      } catch {
        // ignore email fanout failure
      }

      await releaseDispatchLease(sosId, leased.dispatchLeaseOwner, {
        status: 'open',
        dispatchPhase: nextMeta.phase,
        currentRadiusKm: nextMeta.radiusKm,
        phaseStartedAt: issuedAt,
        phaseExpiresAt: respondBy,
        nextDispatchAt: respondBy,
        offeredDonorIds: [...new Set([...(leased.offeredDonorIds || []), ...donors.map((donor) => donor.uid)])],
        activeOfferIds: offerIds,
        candidateResponderUids: donors.map((donor) => donor.uid),
        candidateDonorUids: donors.map((donor) => donor.uid)
      });

      await safeAudit({
        actorUid: leased.requesterUid,
        actorRole: leased.requesterRole || 'user',
        action: 'sos_dispatched',
        targetType: 'sos',
        targetId: sosId,
        metadata: {
          dispatchPhase: nextMeta.phase,
          radiusKm: nextMeta.radiusKm,
          offersCreated: donors.length
        }
      });

      return {
        sosId,
        status: 'open',
        dispatchPhase: nextMeta.phase,
        radiusKm: nextMeta.radiusKm,
        offersCreated: donors.length
      };
    }

    await markSosUnmatched(leased);
    return { sosId, status: 'unmatched', offersCreated: 0 };
  } catch (error) {
    await releaseDispatchLease(sosId, leased.dispatchLeaseOwner);
    throw error;
  }
};

export const dispatchDueSOSRequests = async () => {
  const snapshot = await db.collection(SOS_COLLECTION).get();

  const dueIds = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((sos) => normalizeSosStatus(sos.status) === 'open')
    .filter((sos) => {
      const nextDispatchAt = toDate(sos.nextDispatchAt);
      const phaseExpiresAt = toDate(sos.phaseExpiresAt);
      return !nextDispatchAt || nextDispatchAt <= new Date() || (phaseExpiresAt && phaseExpiresAt <= new Date());
    })
    .map((sos) => sos.id);

  const results = [];
  for (const sosId of dueIds) {
    // eslint-disable-next-line no-await-in-loop
    const result = await dispatchSOSById(sosId);
    if (result) results.push(result);
  }

  return results;
};

export const resetTrackingForSOS = async (sosId, payload = {}) => {
  const ref = db.collection(TRACKING_COLLECTION).doc(sosId);
  await ref.set(
    {
      sosId,
      ...payload,
      updatedAt: nowIso()
    },
    { merge: true }
  );
};

export const findPendingOfferForDonor = async ({ sosId, donorId }) => {
  const snapshot = await db
    .collection(OFFER_COLLECTION)
    .where('sosId', '==', sosId)
    .where('donorId', '==', donorId)
    .get();

  const rows = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((offer) => offer.offerStatus === 'pending')
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));

  return rows[0] || null;
};
