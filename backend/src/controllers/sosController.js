import mongoose from 'mongoose';
import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { createNotification } from '../services/notificationService.js';
import { SosHistory } from '../models/SosHistory.js';
import {
  buildSOSAbuseSignals,
  deriveSOSVerificationStatus,
  enforceDailySOSRateLimit
} from '../services/sosEligibilityService.js';
import {
  closePendingOffersForSOS,
  dispatchDueSOSRequests,
  dispatchSOSById,
  findPendingOfferForDonor,
  normalizeSosStatus,
  resetTrackingForSOS
} from '../services/sosDispatchService.js';
import { ROLES } from '../utils/constants.js';
import { logAudit } from '../services/auditService.js';

const SOS_COLLECTION = 'sos_requests';
const OFFER_COLLECTION = 'sos_dispatch_offers';
const TRACKING_COLLECTION = 'sos_tracking';
const VALID_STATUSES = ['open', 'accepted', 'in_progress', 'completed', 'cancelled', 'unmatched', 'pending_review', 'expired', 'rejected'];

const nowIso = () => new Date().toISOString();

const appendTimeline = (timeline = [], status, changedBy, extra = {}) => [
  ...timeline,
  {
    status,
    changedBy,
    at: nowIso(),
    ...extra
  }
];

const safeSideEffect = async (handler) => {
  try {
    return await handler();
  } catch {
    return null;
  }
};

const syncSosHistory = async (payload) => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  return SosHistory.findOneAndUpdate(
    { firestoreId: payload.firestoreId },
    { $set: payload },
    { upsert: true, new: true, strict: false }
  );
};

const getSosRef = (id) => db.collection(SOS_COLLECTION).doc(id);
const getOfferCollection = () => db.collection(OFFER_COLLECTION);

const isCoordinator = (role) => [ROLES.ADMIN, ROLES.HOSPITAL, ROLES.BLOOD_BANK].includes(role);

const loadProfile = async (uid) => {
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? { uid: doc.id, ...doc.data() } : null;
};

const getPendingOfferCount = async (sosId) => {
  const snapshot = await getOfferCollection()
    .where('sosId', '==', sosId)
    .get();

  return snapshot.docs.filter((doc) => doc.data().offerStatus === 'pending').length;
};

const markAcceptedOfferAndTracking = async ({ sosId, donorId, requesterId }) => {
  await closePendingOffersForSOS({ sosId, nextStatus: 'locked' });
  await resetTrackingForSOS(sosId, {
    donorId,
    requesterId,
    trackingStatus: 'active',
    lastLocation: null,
    lastHeartbeatAt: null
  });
};

export const createSOS = asyncHandler(async (req, res) => {
  const payload = req.body;
  const requesterProfile = await loadProfile(req.user.uid);

  if (!requesterProfile) {
    throw new AppError('Profile not found for SOS creation.', 404);
  }

  await enforceDailySOSRateLimit({
    db,
    userId: req.user.uid,
    maxRequests: 3
  });

  const abuse = await buildSOSAbuseSignals({
    db,
    requesterId: req.user.uid,
    location: payload.location,
    bloodGroup: payload.bloodGroup
  });

  const verifiedStatus = deriveSOSVerificationStatus(req.user, requesterProfile);
  const initialStatus = abuse.requiresReview ? 'pending_review' : 'open';
  const createdAt = nowIso();
  const timeline = appendTimeline([], initialStatus, req.user.uid, {
    verification: verifiedStatus,
    abuseScore: abuse.score
  });

  const docRef = db.collection(SOS_COLLECTION).doc();
  await docRef.set({
    requesterUid: req.user.uid,
    requesterRole: requesterProfile.role || req.user.role,
    requesterSnapshot: {
      displayName: requesterProfile.displayName || req.user.email || 'LifeLedger user',
      phone: requesterProfile.phone || null
    },
    bloodGroup: payload.bloodGroup,
    location: payload.location,
    urgency: payload.urgency || 'high',
    notes: payload.notes || null,
    status: initialStatus,
    verifiedStatus,
    abuseScore: abuse.score,
    abuseReasons: abuse.reasons,
    dispatchPhase: 0,
    currentRadiusKm: 0,
    phaseStartedAt: null,
    phaseExpiresAt: null,
    nextDispatchAt: initialStatus === 'open' ? createdAt : null,
    offeredDonorIds: [],
    excludedDonorIds: [],
    candidateResponderUids: [],
    candidateDonorUids: [],
    acceptedDonorId: null,
    acceptedResponderUid: null,
    acceptedDonorUid: null,
    acceptedOfferId: null,
    activeOfferIds: [],
    timeline,
    createdAt,
    updatedAt: createdAt
  });

  await safeSideEffect(() =>
    syncSosHistory({
      firestoreId: docRef.id,
      requesterUid: req.user.uid,
      bloodGroup: payload.bloodGroup,
      urgency: payload.urgency || 'high',
      location: payload.location,
      status: initialStatus,
      verifiedStatus,
      abuseScore: abuse.score,
      abuseReasons: abuse.reasons,
      timeline
    })
  );

  await safeSideEffect(() =>
    logAudit({
      actorUid: req.user.uid,
      actorRole: req.user.role,
      action: 'sos_created',
      targetType: 'sos',
      targetId: docRef.id,
      metadata: {
        bloodGroup: payload.bloodGroup,
        urgency: payload.urgency,
        verifiedStatus,
        abuseScore: abuse.score
      }
    })
  );

  if (initialStatus === 'open') {
    await dispatchSOSById(docRef.id);
  } else {
    await safeSideEffect(() =>
      createNotification({
        userUid: req.user.uid,
        title: 'SOS Under Review',
        message: 'Your SOS request was flagged for manual review before donor dispatch.',
        type: 'sos',
        referenceId: docRef.id
      })
    );
  }

  res.status(201).json({
    success: true,
    data: {
      id: docRef.id,
      status: initialStatus,
      verifiedStatus,
      abuseScore: abuse.score
    }
  });
});

export const listSOS = asyncHandler(async (_req, res) => {
  await safeSideEffect(() => dispatchDueSOSRequests());

  const snapshot = await db.collection(SOS_COLLECTION).orderBy('createdAt', 'desc').get();
  const rows = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    status: normalizeSosStatus(doc.data().status)
  }));

  res.json({ success: true, data: rows });
});

export const updateSOSStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requestedStatus = normalizeSosStatus(req.body.status);
  const liveLocation = req.body.liveLocation || null;
  const reason = req.body.reason || null;
  const sosRef = getSosRef(id);
  const sosDoc = await sosRef.get();

  if (!sosDoc.exists) {
    throw new AppError('SOS request not found', 404);
  }

  const sos = { id: sosDoc.id, ...sosDoc.data(), status: normalizeSosStatus(sosDoc.data().status) };

  if (liveLocation) {
    if (sos.acceptedDonorId !== req.user.uid) {
      throw new AppError('Only the accepted donor can publish live location.', 403);
    }

    await db.collection(TRACKING_COLLECTION).doc(id).set(
      {
        sosId: id,
        donorId: req.user.uid,
        requesterId: sos.requesterUid,
        lastLocation: liveLocation,
        lastHeartbeatAt: nowIso(),
        trackingStatus: ['completed', 'cancelled', 'expired'].includes(sos.status) ? 'ended' : 'active',
        updatedAt: nowIso()
      },
      { merge: true }
    );

    res.json({ success: true, data: { id, liveLocation } });
    return;
  }

  if (!VALID_STATUSES.includes(requestedStatus)) {
    throw new AppError('Unsupported SOS status transition.', 400);
  }

  if (requestedStatus === 'accepted') {
    const offer = await findPendingOfferForDonor({ sosId: id, donorId: req.user.uid });
    if (!offer) {
      throw new AppError('No pending SOS offer found for this user.', 403);
    }

    const offerRef = getOfferCollection().doc(offer.id);

    await db.runTransaction(async (tx) => {
      const sosSnap = await tx.get(sosRef);
      const offerSnap = await tx.get(offerRef);

      if (!sosSnap.exists || !offerSnap.exists) {
        throw new AppError('SOS offer no longer exists.', 404);
      }

      const freshSOS = { ...sosSnap.data(), status: normalizeSosStatus(sosSnap.data().status) };
      const freshOffer = offerSnap.data();
      const respondBy = new Date(freshOffer.respondBy);

      if (freshSOS.status !== 'open') {
        throw new AppError('This SOS request has already been locked.', 409);
      }

      if (freshOffer.offerStatus !== 'pending' || freshOffer.donorId !== req.user.uid) {
        throw new AppError('This SOS offer is no longer actionable.', 409);
      }

      if (!Number.isNaN(respondBy.getTime()) && respondBy < new Date()) {
        throw new AppError('This SOS offer has expired.', 409);
      }

      const timeline = appendTimeline(freshSOS.timeline, 'accepted', req.user.uid);

      tx.update(sosRef, {
        status: 'accepted',
        acceptedDonorId: req.user.uid,
        acceptedResponderUid: req.user.uid,
        acceptedDonorUid: req.user.uid,
        acceptedOfferId: offer.id,
        updatedAt: nowIso(),
        timeline
      });

      tx.update(offerRef, {
        offerStatus: 'accepted',
        acceptedAt: nowIso(),
        updatedAt: nowIso()
      });
    });

    await markAcceptedOfferAndTracking({
      sosId: id,
      donorId: req.user.uid,
      requesterId: sos.requesterUid
    });

    await safeSideEffect(() =>
      syncSosHistory({
        firestoreId: id,
        requesterUid: sos.requesterUid,
        assignedDonorUid: req.user.uid,
        bloodGroup: sos.bloodGroup,
        urgency: sos.urgency,
        location: sos.location,
        status: 'accepted',
        timeline: appendTimeline(sos.timeline, 'accepted', req.user.uid)
      })
    );

    await safeSideEffect(() =>
      createNotification({
        userUid: sos.requesterUid,
        title: 'SOS Accepted',
        message: 'A compatible donor accepted your SOS request.',
        type: 'sos',
        referenceId: id
      })
    );

    await safeSideEffect(() =>
      logAudit({
        actorUid: req.user.uid,
        actorRole: req.user.role,
        action: 'sos_accepted',
        targetType: 'sos',
        targetId: id,
        metadata: { offerId: offer.id }
      })
    );

    res.json({ success: true, data: { id, status: 'accepted', acceptedDonorId: req.user.uid } });
    return;
  }

  if (requestedStatus === 'rejected') {
    const offer = await findPendingOfferForDonor({ sosId: id, donorId: req.user.uid });
    if (!offer) {
      throw new AppError('No pending SOS offer found for this user.', 403);
    }

    const offerRef = getOfferCollection().doc(offer.id);

    await db.runTransaction(async (tx) => {
      const sosSnap = await tx.get(sosRef);
      const offerSnap = await tx.get(offerRef);

      if (!sosSnap.exists || !offerSnap.exists) {
        throw new AppError('SOS offer no longer exists.', 404);
      }

      const freshSOS = { ...sosSnap.data(), status: normalizeSosStatus(sosSnap.data().status) };
      const freshOffer = offerSnap.data();

      if (freshSOS.status !== 'open' || freshOffer.offerStatus !== 'pending') {
        throw new AppError('This SOS offer is no longer actionable.', 409);
      }

      tx.update(offerRef, {
        offerStatus: 'rejected',
        rejectedAt: nowIso(),
        updatedAt: nowIso()
      });

      tx.update(sosRef, {
        excludedDonorIds: [...new Set([...(freshSOS.excludedDonorIds || []), req.user.uid])],
        updatedAt: nowIso(),
        timeline: appendTimeline(freshSOS.timeline, 'rejected', req.user.uid, { reason })
      });
    });

    const pendingCount = await getPendingOfferCount(id);
    if (pendingCount === 0) {
      await sosRef.set(
        {
          nextDispatchAt: nowIso(),
          updatedAt: nowIso()
        },
        { merge: true }
      );
      await dispatchSOSById(id, { forceImmediateExpansion: true });
    }

    await safeSideEffect(() =>
      logAudit({
        actorUid: req.user.uid,
        actorRole: req.user.role,
        action: 'sos_offer_rejected',
        targetType: 'sos',
        targetId: id,
        metadata: { offerId: offer.id }
      })
    );

    res.json({ success: true, data: { id, status: 'open', rejectedBy: req.user.uid } });
    return;
  }

  if (requestedStatus === 'cancelled') {
    const requesterCancel = sos.requesterUid === req.user.uid;
    const donorCancel = sos.acceptedDonorId === req.user.uid;
    const coordinatorCancel = isCoordinator(req.user.role);

    if (!requesterCancel && !donorCancel && !coordinatorCancel) {
      throw new AppError('You are not allowed to cancel this SOS.', 403);
    }

    if (donorCancel && sos.status === 'accepted') {
      const reopenedTimeline = appendTimeline(sos.timeline, 'open', req.user.uid, {
        reason: reason || 'accepted-donor-cancelled'
      });

      await sosRef.set(
        {
          status: 'open',
          acceptedDonorId: null,
          acceptedResponderUid: null,
          acceptedDonorUid: null,
          acceptedOfferId: null,
          excludedDonorIds: [...new Set([...(sos.excludedDonorIds || []), req.user.uid])],
          nextDispatchAt: nowIso(),
          updatedAt: nowIso(),
          timeline: reopenedTimeline
        },
        { merge: true }
      );

      await closePendingOffersForSOS({ sosId: id, nextStatus: 'cancelled' });
      if (sos.acceptedOfferId) {
        await getOfferCollection().doc(sos.acceptedOfferId).set(
          {
            offerStatus: 'cancelled',
            updatedAt: nowIso()
          },
          { merge: true }
        );
      }
      await resetTrackingForSOS(id, {
        trackingStatus: 'restarting'
      });

      await safeSideEffect(() =>
        syncSosHistory({
          firestoreId: id,
          requesterUid: sos.requesterUid,
          bloodGroup: sos.bloodGroup,
          urgency: sos.urgency,
          location: sos.location,
          status: 'open',
          timeline: reopenedTimeline
        })
      );

      await dispatchSOSById(id, { forceImmediateExpansion: true });

      res.json({ success: true, data: { id, status: 'open', requeued: true } });
      return;
    }

    const cancelledTimeline = appendTimeline(sos.timeline, 'cancelled', req.user.uid, { reason });
    await sosRef.set(
      {
        status: 'cancelled',
        updatedAt: nowIso(),
        nextDispatchAt: null,
        phaseExpiresAt: null,
        timeline: cancelledTimeline
      },
      { merge: true }
    );

    await closePendingOffersForSOS({ sosId: id, nextStatus: 'cancelled' });
    if (sos.acceptedOfferId) {
      await getOfferCollection().doc(sos.acceptedOfferId).set(
        {
          offerStatus: 'cancelled',
          updatedAt: nowIso()
        },
        { merge: true }
      );
    }
    await resetTrackingForSOS(id, {
      trackingStatus: 'ended'
    });

    await safeSideEffect(() =>
      syncSosHistory({
        firestoreId: id,
        requesterUid: sos.requesterUid,
        bloodGroup: sos.bloodGroup,
        urgency: sos.urgency,
        location: sos.location,
        status: 'cancelled',
        timeline: cancelledTimeline
      })
    );

    res.json({ success: true, data: { id, status: 'cancelled' } });
    return;
  }

  if (requestedStatus === 'in_progress' || requestedStatus === 'completed') {
    if (!isCoordinator(req.user.role)) {
      throw new AppError('Only an organisation coordinator can update this SOS.', 403);
    }

    const nextTimeline = appendTimeline(sos.timeline, requestedStatus, req.user.uid);
    await sosRef.set(
      {
        status: requestedStatus,
        updatedAt: nowIso(),
        timeline: nextTimeline
      },
      { merge: true }
    );

    if (requestedStatus === 'completed') {
      await closePendingOffersForSOS({ sosId: id, nextStatus: 'locked' });
      await resetTrackingForSOS(id, {
        trackingStatus: 'ended'
      });
    }

    await safeSideEffect(() =>
      syncSosHistory({
        firestoreId: id,
        requesterUid: sos.requesterUid,
        assignedDonorUid: sos.acceptedDonorId || null,
        bloodGroup: sos.bloodGroup,
        urgency: sos.urgency,
        location: sos.location,
        status: requestedStatus,
        timeline: nextTimeline
      })
    );

    if (sos.requesterUid !== req.user.uid) {
      await safeSideEffect(() =>
        createNotification({
          userUid: sos.requesterUid,
          title: 'SOS Status Updated',
          message: `Your SOS request is now ${requestedStatus.replace('_', ' ')}.`,
          type: 'sos',
          referenceId: id
        })
      );
    }

    res.json({ success: true, data: { id, status: requestedStatus } });
    return;
  }

  if (requestedStatus === 'open') {
    if (!isCoordinator(req.user.role)) {
      throw new AppError('Only an organisation coordinator can reopen an SOS.', 403);
    }

    await sosRef.set(
      {
        status: 'open',
        nextDispatchAt: nowIso(),
        updatedAt: nowIso(),
        timeline: appendTimeline(sos.timeline, 'open', req.user.uid, { reason })
      },
      { merge: true }
    );
    await dispatchSOSById(id, { forceImmediateExpansion: true });
    res.json({ success: true, data: { id, status: 'open' } });
    return;
  }

  if (requestedStatus === 'pending_review' || requestedStatus === 'unmatched' || requestedStatus === 'expired') {
    if (!isCoordinator(req.user.role) && req.user.role !== ROLES.ADMIN) {
      throw new AppError('Only privileged roles can set this SOS state.', 403);
    }

    await sosRef.set(
      {
        status: requestedStatus,
        updatedAt: nowIso(),
        timeline: appendTimeline(sos.timeline, requestedStatus, req.user.uid, { reason })
      },
      { merge: true }
    );

    res.json({ success: true, data: { id, status: requestedStatus } });
  }
});
