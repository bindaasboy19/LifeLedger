import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { canDonateTo } from '../services/bloodCompatibility.js';
import { calculateDistanceKm } from '../services/locationService.js';
import { broadcastNotifications, createNotification, sendEmailBatch } from '../services/notificationService.js';
import { SosHistory } from '../models/SosHistory.js';
import { isCommunityRole, normalizeCommunityRole, ROLES } from '../utils/constants.js';

const SOS_RADIUS_KM = 50;

const getDaysSince = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getResponderCandidates = (sos) => sos.candidateResponderUids || sos.candidateDonorUids || [];

const getRejectedCandidates = (sos) => sos.rejectedResponderUids || sos.rejectedDonorUids || [];

const isBloodGroupMatch = ({ responderBloodGroup, requiredBloodGroup }) => {
  if (!responderBloodGroup) return false;
  return canDonateTo(responderBloodGroup, requiredBloodGroup);
};

const findEligibleResponders = async ({ bloodGroup, location, requesterUid }) => {
  const snapshot = await db.collection('users').get();
  const allCandidates = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

  return allCandidates
    .filter((candidate) => {
      if (candidate.uid === requesterUid) return false;
      if (candidate.isBlocked) return false;
      if (!isCommunityRole(candidate.role)) return false;
      if (candidate.availabilityStatus === false) return false;
      if (!isBloodGroupMatch({
        responderBloodGroup: candidate.bloodGroup,
        requiredBloodGroup: bloodGroup
      })) {
        return false;
      }

      const daysSinceDonation = getDaysSince(candidate.lastDonationDate);
      if (daysSinceDonation !== null && daysSinceDonation < 90) return false;

      const distance = calculateDistanceKm(
        location.lat,
        location.lng,
        candidate.location?.lat,
        candidate.location?.lng
      );
      if (distance === null || distance > SOS_RADIUS_KM) return false;

      return true;
    })
    .map((candidate) => ({
      ...candidate,
      role: normalizeCommunityRole(candidate.role),
      distanceKm: calculateDistanceKm(
        location.lat,
        location.lng,
        candidate.location?.lat,
        candidate.location?.lng
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

const syncSosHistory = async (payload) => {
  await SosHistory.findOneAndUpdate(
    { firestoreId: payload.firestoreId },
    { $set: payload },
    { upsert: true, new: true }
  );
};

const validateStatusTransition = ({ reqUser, sos, status }) => {
  const isRequester = sos.requesterUid === reqUser.uid;
  const isCoordinator = [ROLES.ADMIN, ROLES.HOSPITAL, ROLES.BLOOD_BANK].includes(reqUser.role);
  const responderCandidates = getResponderCandidates(sos);
  const isResponder = responderCandidates.includes(reqUser.uid);

  if (['accepted', 'rejected'].includes(status) && !isResponder) {
    throw new AppError('Only matched responders can accept or reject this SOS', 403);
  }

  if (status === 'cancelled' && !isRequester && !isCoordinator) {
    throw new AppError('Only requester or coordinator can cancel this SOS', 403);
  }

  if (['in_progress', 'completed'].includes(status) && !isCoordinator) {
    throw new AppError('Only hospital, blood bank, or admin can set this status', 403);
  }

  if (status === 'accepted' && sos.acceptedResponderUid && sos.acceptedResponderUid !== reqUser.uid) {
    throw new AppError('This SOS is already accepted by another responder', 409);
  }
};

export const createSOS = asyncHandler(async (req, res) => {
  const payload = req.body;
  const eligibleResponders = await findEligibleResponders({
    bloodGroup: payload.bloodGroup,
    location: payload.location,
    requesterUid: req.user.uid
  });

  const candidateResponderUids = eligibleResponders.map((candidate) => candidate.uid);
  const candidateDonorUids = [...candidateResponderUids];

  const initialTimeline = [
    {
      status: 'created',
      changedBy: req.user.uid,
      at: new Date().toISOString()
    }
  ];

  const docRef = await db.collection('sos_requests').add({
    ...payload,
    requesterUid: req.user.uid,
    status: 'created',
    candidateResponderUids,
    candidateDonorUids,
    acceptedResponderUid: null,
    acceptedDonorUid: null,
    rejectedResponderUids: [],
    rejectedDonorUids: [],
    timeline: initialTimeline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await syncSosHistory({
    firestoreId: docRef.id,
    requesterUid: req.user.uid,
    bloodGroup: payload.bloodGroup,
    urgency: payload.urgency,
    location: payload.location,
    status: 'created',
    timeline: initialTimeline
  });

  const alertMessage = `Emergency ${payload.bloodGroup} request near ${payload.location.city}. Urgency: ${payload.urgency}.`;

  await broadcastNotifications({
    recipients: eligibleResponders,
    title: 'SOS Blood Request',
    message: alertMessage,
    type: 'sos',
    referenceId: docRef.id,
    metadata: {
      urgency: payload.urgency,
      bloodGroup: payload.bloodGroup
    }
  });

  await sendEmailBatch({
    recipients: eligibleResponders,
    subject: 'LifeLedger SOS Blood Request',
    text: alertMessage,
    html: `<p>${alertMessage}</p>`
  });

  res.status(201).json({
    success: true,
    data: {
      id: docRef.id,
      matchedResponders: eligibleResponders.length,
      matchedDonors: candidateDonorUids.length
    }
  });
});

export const listSOS = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('sos_requests').orderBy('createdAt', 'desc').get();
  const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.json({ success: true, data: rows });
});

export const updateSOSStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const docRef = db.collection('sos_requests').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError('SOS request not found', 404);
  }

  const sos = doc.data();
  validateStatusTransition({ reqUser: req.user, sos, status });

  let acceptedResponderUid = sos.acceptedResponderUid || sos.acceptedDonorUid || null;
  let acceptedDonorUid = sos.acceptedDonorUid || null;
  const rejectedResponderUids = [...getRejectedCandidates(sos)];
  const rejectedDonorUids = [...(sos.rejectedDonorUids || [])];

  if (status === 'accepted') {
    acceptedResponderUid = req.user.uid;
    if (req.user.role === ROLES.USER) {
      acceptedDonorUid = req.user.uid;
    }
  }

  if (status === 'rejected') {
    if (!rejectedResponderUids.includes(req.user.uid)) {
      rejectedResponderUids.push(req.user.uid);
    }
    if (req.user.role === ROLES.USER && !rejectedDonorUids.includes(req.user.uid)) {
      rejectedDonorUids.push(req.user.uid);
    }
  }

  const timeline = [
    ...(sos.timeline || []),
    {
      status,
      changedBy: req.user.uid,
      reason: reason || null,
      at: new Date().toISOString()
    }
  ];

  const updatePayload = {
    status,
    acceptedResponderUid,
    acceptedDonorUid,
    rejectedResponderUids,
    rejectedDonorUids,
    timeline,
    updatedAt: new Date().toISOString()
  };

  await docRef.set(updatePayload, { merge: true });

  await syncSosHistory({
    firestoreId: id,
    requesterUid: sos.requesterUid,
    assignedDonorUid: acceptedDonorUid,
    bloodGroup: sos.bloodGroup,
    urgency: sos.urgency,
    location: sos.location,
    status,
    timeline
  });

  if (sos.requesterUid !== req.user.uid) {
    await createNotification({
      userUid: sos.requesterUid,
      title: 'SOS Status Updated',
      message: `Your SOS request is now ${status}.`,
      type: 'sos',
      referenceId: id
    });
  }

  if (acceptedResponderUid) {
    await createNotification({
      userUid: acceptedResponderUid,
      title: 'SOS Assignment Confirmed',
      message: `You are assigned to SOS request ${id}.`,
      type: 'sos',
      referenceId: id
    });
  }

  res.json({ success: true, data: { id, ...updatePayload } });
});
