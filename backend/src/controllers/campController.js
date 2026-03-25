import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { calculateDistanceKm } from '../services/locationService.js';
import { broadcastNotifications, sendEmailBatch } from '../services/notificationService.js';

const campsCollection = db.collection('donation_camps');

const parseCampStatus = (camp) => {
  const now = new Date();
  const start = new Date(camp.startAt);
  const end = new Date(camp.endAt);

  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
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
  const payload = req.body;
  const docRef = await campsCollection.add({
    ...payload,
    createdBy: req.user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const donorSnapshot = await db.collection('users').where('role', '==', 'donor').get();
  const donors = donorSnapshot.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((donor) => payload.requiredBloodGroups.includes(donor.bloodGroup));

  const msg = `${payload.name} donation camp on ${new Date(payload.startAt).toLocaleString()}`;

  await broadcastNotifications({
    recipients: donors,
    title: 'New Donation Camp',
    message: msg,
    type: 'camp',
    referenceId: docRef.id
  });

  await sendEmailBatch({
    recipients: donors,
    subject: 'LifeLedger Donation Camp Alert',
    text: msg,
    html: `<p>${msg}</p>`
  });

  const created = await docRef.get();

  res.status(201).json({ success: true, data: { id: created.id, ...created.data() } });
});

export const updateCamp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = campsCollection.doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new AppError('Camp not found', 404);
  }

  await docRef.set(
    {
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid
    },
    { merge: true }
  );

  const updated = await docRef.get();
  res.json({ success: true, data: { id: updated.id, ...updated.data() } });
});

export const deleteCamp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = campsCollection.doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new AppError('Camp not found', 404);
  }

  await docRef.delete();
  res.json({ success: true, message: 'Camp removed' });
});
