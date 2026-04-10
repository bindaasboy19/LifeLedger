import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { calculateDistanceKm } from '../services/locationService.js';
import {
  broadcastNotifications,
  createNotification,
  sendEmailBatch
} from '../services/notificationService.js';
import { DonationHistory } from '../models/DonationHistory.js';
import { DonationCertificate } from '../models/DonationCertificate.js';
import { CAMP_ORGANIZER_ROLES, isCommunityRole, ROLES } from '../utils/constants.js';

const campsCollection = db.collection('donation_camps');
const campApplicationsCollection = db.collection('camp_applications');

const parseCampStatus = (camp) => {
  const now = new Date();
  const start = new Date(camp.startAt);
  const end = new Date(camp.endAt);

  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
};

const listCommunityUsers = async () => {
  const snapshot = await db.collection('users').get();

  return snapshot.docs
    .map((doc) => ({
      uid: doc.id,
      ...doc.data()
    }))
    .filter((user) => isCommunityRole(user.role));
};

const getCampOrThrow = async (campId) => {
  const doc = await campsCollection.doc(campId).get();
  if (!doc.exists) {
    throw new AppError('Camp not found', 404);
  }

  return {
    id: doc.id,
    ...doc.data()
  };
};

const ensureCampManager = (camp, user) => {
  if (user.role === ROLES.ADMIN) {
    return;
  }

  if (!CAMP_ORGANIZER_ROLES.includes(user.role) || camp.createdBy !== user.uid) {
    throw new AppError('Forbidden camp management access', 403);
  }
};

const getApplicationSnapshotByCamp = async (campId) => {
  const snapshot = await campApplicationsCollection.where('campId', '==', campId).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

const generateCertificateNumber = (donorUid) => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `LL-${stamp}-${donorUid.slice(-4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
};

export const listCamps = asyncHandler(async (req, res) => {
  const { filter = 'all', lat, lng, radiusKm = 100 } = req.query;

  const snapshot = await campsCollection.orderBy('startAt', 'asc').get();
  let camps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  camps = camps.map((camp) => ({
    ...camp,
    status: parseCampStatus(camp),
    distanceKm:
      lat && lng
        ? calculateDistanceKm(Number(lat), Number(lng), camp.location?.lat, camp.location?.lng)
        : null
  }));

  if (filter !== 'all') {
    camps = camps.filter((camp) => camp.status === filter);
  }

  if (lat && lng) {
    camps = camps.filter((camp) => camp.distanceKm !== null && camp.distanceKm <= Number(radiusKm));
  }

  camps.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  res.json({ success: true, data: camps });
});

export const createCamp = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    notificationRadiusKm: Number(req.body.notificationRadiusKm || 25)
  };
  const docRef = await campsCollection.add({
    ...payload,
    createdBy: req.user.uid,
    createdByRole: req.user.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const communityUsers = await listCommunityUsers();
  const recipients = communityUsers.filter(
    (member) =>
      member.availabilityStatus !== false &&
      payload.requiredBloodGroups.includes(member.bloodGroup) &&
      (() => {
        const distance = calculateDistanceKm(
          payload.location?.lat,
          payload.location?.lng,
          member.location?.lat,
          member.location?.lng
        );
        return distance !== null && distance <= payload.notificationRadiusKm;
      })()
  );

  const msg = `${payload.name} donation camp on ${new Date(payload.startAt).toLocaleString()}`;

  await broadcastNotifications({
    recipients,
    title: 'New Donation Camp',
    message: msg,
    type: 'camp',
    referenceId: docRef.id
  });

  await sendEmailBatch({
    recipients,
    subject: 'LifeLedger Donation Camp Alert',
    text: msg,
    html: `<p>${msg}</p>`
  });

  const created = await docRef.get();

  res.status(201).json({ success: true, data: { id: created.id, ...created.data() } });
});

export const updateCamp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const camp = await getCampOrThrow(id);
  ensureCampManager(camp, req.user);

  await campsCollection.doc(id).set(
    {
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid
    },
    { merge: true }
  );

  const updated = await campsCollection.doc(id).get();
  res.json({ success: true, data: { id: updated.id, ...updated.data() } });
});

export const deleteCamp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const camp = await getCampOrThrow(id);
  ensureCampManager(camp, req.user);

  await campsCollection.doc(id).delete();
  res.json({ success: true, message: 'Camp removed' });
});

export const applyForCamp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const camp = await getCampOrThrow(id);
  const campStatus = parseCampStatus(camp);

  if (!isCommunityRole(req.user.role)) {
    throw new AppError('Only community members can apply for donation camps', 403);
  }

  if (campStatus === 'completed') {
    throw new AppError('This camp has already completed', 400);
  }

  const existingApplications = await getApplicationSnapshotByCamp(id);
  const duplicate = existingApplications.find(
    (application) =>
      application.applicantUid === req.user.uid &&
      ['pending', 'approved', 'completed'].includes(application.status)
  );

  if (duplicate) {
    throw new AppError('You have already applied for this camp', 409);
  }

  const profileDoc = await db.collection('users').doc(req.user.uid).get();
  const profile = profileDoc.exists ? profileDoc.data() : {};

  const applicationRef = await campApplicationsCollection.add({
    campId: id,
    campName: camp.name,
    applicantUid: req.user.uid,
    applicantName: profile.displayName || req.user.email || req.user.uid,
    applicantEmail: req.user.email || null,
    bloodGroup: profile.bloodGroup || null,
    notes: req.body.notes || null,
    status: 'pending',
    organizerUid: camp.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await createNotification({
    userUid: camp.createdBy,
    title: 'New Camp Application',
    message: `${profile.displayName || 'A community member'} applied to ${camp.name}.`,
    type: 'camp',
    referenceId: id,
    metadata: {
      applicationId: applicationRef.id
    }
  });

  const created = await applicationRef.get();
  res.status(201).json({ success: true, data: { id: created.id, ...created.data() } });
});

export const listCampApplications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const camp = await getCampOrThrow(id);
  ensureCampManager(camp, req.user);

  const applications = await getApplicationSnapshotByCamp(id);
  applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: applications });
});

export const listMyCampApplications = asyncHandler(async (req, res) => {
  const snapshot = await campApplicationsCollection.get();
  const applications = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((application) => application.applicantUid === req.user.uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: applications });
});

export const updateCampApplication = asyncHandler(async (req, res) => {
  const { id, applicationId } = req.params;
  const { status, notes, units } = req.body;
  const camp = await getCampOrThrow(id);
  ensureCampManager(camp, req.user);

  const applicationRef = campApplicationsCollection.doc(applicationId);
  const applicationDoc = await applicationRef.get();

  if (!applicationDoc.exists) {
    throw new AppError('Camp application not found', 404);
  }

  const application = { id: applicationDoc.id, ...applicationDoc.data() };
  if (application.campId !== id) {
    throw new AppError('Camp application does not belong to this camp', 400);
  }

  const nextPayload = {
    status,
    reviewedBy: req.user.uid,
    reviewedByRole: req.user.role,
    reviewNotes: notes || null,
    updatedAt: new Date().toISOString()
  };

  if (status === 'completed') {
    if (application.status === 'completed') {
      throw new AppError('Donation is already completed for this application', 409);
    }

    const donorProfileDoc = await db.collection('users').doc(application.applicantUid).get();
    const donorProfile = donorProfileDoc.exists ? donorProfileDoc.data() : {};
    const donatedAt = new Date();

    const donation = await DonationHistory.create({
      donorUid: application.applicantUid,
      campId: id,
      bloodGroup: application.bloodGroup || donorProfile.bloodGroup,
      units,
      location: camp.location,
      donatedAt
    });

    const organizerProfileDoc = await db.collection('users').doc(req.user.uid).get();
    const organizerProfile = organizerProfileDoc.exists ? organizerProfileDoc.data() : {};

    const certificate = await DonationCertificate.create({
      certificateNumber: generateCertificateNumber(application.applicantUid),
      donorUid: application.applicantUid,
      donorName: application.applicantName,
      campId: id,
      campName: camp.name,
      applicationId,
      organizerUid: req.user.uid,
      organizerName: organizerProfile.displayName || req.user.email || req.user.uid,
      bloodGroup: application.bloodGroup || donorProfile.bloodGroup,
      units,
      issuedAt: donatedAt
    });

    await db.collection('users').doc(application.applicantUid).set(
      {
        lastDonationDate: donatedAt.toISOString(),
        availabilityStatus: false,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    Object.assign(nextPayload, {
      completedAt: donatedAt.toISOString(),
      units,
      donationRecordId: donation._id.toString(),
      certificateId: certificate._id.toString(),
      certificateNumber: certificate.certificateNumber
    });
  }

  await applicationRef.set(nextPayload, { merge: true });

  await createNotification({
    userUid: application.applicantUid,
    title: 'Camp Application Updated',
    message:
      status === 'completed'
        ? `Your donation for ${camp.name} was completed and certificate ${nextPayload.certificateNumber} is ready.`
        : `Your camp application for ${camp.name} is now ${status}.`,
    type: 'camp',
    referenceId: id,
    metadata: {
      applicationId,
      status,
      certificateNumber: nextPayload.certificateNumber || null
    }
  });

  const updated = await applicationRef.get();
  res.json({ success: true, data: { id: updated.id, ...updated.data() } });
});
