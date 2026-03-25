import { db } from '../config/firebase.js';
import { SosHistory } from '../models/SosHistory.js';
import { AITrainingData } from '../models/AITrainingData.js';
import { DonationHistory } from '../models/DonationHistory.js';

const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const LOCATIONS = [
  { city: 'Delhi', address: 'Emergency Block, Delhi', lat: 28.6139, lng: 77.209 },
  { city: 'Mumbai', address: 'Care Center, Mumbai', lat: 19.076, lng: 72.8777 },
  { city: 'Bengaluru', address: 'Medical Hub, Bengaluru', lat: 12.9716, lng: 77.5946 }
];

const ORGANIZATIONS = [
  { uid: 'hospital_1', sourceType: 'hospital' },
  { uid: 'hospital_2', sourceType: 'hospital' },
  { uid: 'bloodbank_1', sourceType: 'blood_bank' }
];

const pick = (arr, index) => arr[index % arr.length];

const buildStockEntry = (index) => {
  const location = pick(LOCATIONS, index);
  const org = pick(ORGANIZATIONS, index);
  const now = new Date();

  return {
    id: `stock_proto_${Date.now()}_${index}`,
    bloodGroup: pick(BLOOD_GROUPS, index + 2),
    units: 8 + ((index * 7) % 19),
    collectionDate: new Date(now.getTime() - (index + 1) * 2 * 3600000).toISOString(),
    expiryDate: new Date(now.getTime() + (10 + index) * 86400000).toISOString(),
    location,
    sourceType: org.sourceType,
    createdBy: org.uid,
    updatedBy: org.uid,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
};

const buildSOSRequest = (index, donors) => {
  const location = pick(LOCATIONS, index + 1);
  const now = new Date();
  const id = `sos_proto_${Date.now()}_${index}`;
  const status = index % 2 === 0 ? 'created' : 'in_progress';
  const candidateDonorUids = donors.slice(index, index + 4).map((donor) => donor.uid);
  const candidateResponderUids = [...candidateDonorUids];

  return {
    id,
    doc: {
      requesterUid: 'user_1',
      bloodGroup: pick(BLOOD_GROUPS, index + 4),
      urgency: index % 2 === 0 ? 'critical' : 'high',
      location,
      notes: 'Prototype emergency trigger generated for demo flow.',
      status,
      candidateResponderUids,
      candidateDonorUids,
      acceptedResponderUid: status === 'in_progress' ? candidateDonorUids[0] || null : null,
      acceptedDonorUid: status === 'in_progress' ? candidateDonorUids[0] || null : null,
      rejectedResponderUids: [],
      rejectedDonorUids: [],
      timeline: [
        {
          status: 'created',
          changedBy: 'user_1',
          at: now.toISOString()
        },
        ...(status === 'in_progress'
          ? [
              {
                status: 'accepted',
                changedBy: candidateDonorUids[0] || 'donor_1',
                at: new Date(now.getTime() + 180000).toISOString()
              },
              {
                status: 'in_progress',
                changedBy: 'hospital_1',
                at: new Date(now.getTime() + 300000).toISOString()
              }
            ]
          : [])
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  };
};

const buildCamp = () => {
  const now = new Date();
  const start = new Date(now.getTime() + 36 * 3600000);
  const end = new Date(now.getTime() + 42 * 3600000);
  const location = LOCATIONS[Date.now() % LOCATIONS.length];

  return {
    id: `camp_proto_${Date.now()}`,
    doc: {
      name: 'Rapid Response Donation Camp',
      organizer: 'LifeLedger Emergency Network',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      location,
      requiredBloodGroups: ['O-', 'O+', 'A+', 'B+'],
      contactDetails: {
        email: 'support@lifeledger.app',
        phone: '+91 98765 43210'
      },
      description: 'Prototype camp generated to showcase reminder and map workflows.',
      createdBy: 'admin_1',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      remindersSent: {}
    }
  };
};

const seedAITrainingSignals = async () => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const operations = [];
  LOCATIONS.forEach((location, locIdx) => {
    BLOOD_GROUPS.forEach((bloodGroup, bgIdx) => {
      const sosCount = 6 + ((bgIdx + locIdx) % 5);
      const usageUnits = 11 + ((bgIdx * 2 + locIdx) % 8);
      const campDonationVolume = 3 + ((bgIdx + locIdx * 2) % 6);

      operations.push({
        updateOne: {
          filter: { date, region: location.city, bloodGroup },
          update: {
            $set: {
              date,
              region: location.city,
              bloodGroup,
              sosCount,
              usageUnits,
              campDonationVolume
            }
          },
          upsert: true
        }
      });
    });
  });

  if (operations.length > 0) {
    await AITrainingData.bulkWrite(operations, { ordered: false });
  }
};

export const seedPrototypeActivity = async ({ actorUid = 'admin_1' } = {}) => {
  const donorSnapshot = await db.collection('users').where('role', '==', 'donor').get();
  const donors = donorSnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

  const stocks = Array.from({ length: 6 }).map((_, idx) => buildStockEntry(idx));
  await Promise.all(
    stocks.map((stock) => db.collection('blood_stock').doc(stock.id).set(stock, { merge: true }))
  );
  await Promise.all(
    stocks.map((stock) =>
      db.collection('stock_flow').add({
        stockId: stock.id,
        action: 'created',
        bloodGroup: stock.bloodGroup,
        unitsBefore: 0,
        unitsAfter: stock.units,
        deltaUnits: stock.units,
        sourceType: stock.sourceType,
        location: stock.location,
        actorUid: stock.createdBy,
        actorRole: stock.sourceType,
        at: new Date().toISOString()
      })
    )
  );

  const sosRequests = Array.from({ length: 3 }).map((_, idx) => buildSOSRequest(idx, donors));
  await Promise.all(
    sosRequests.map(({ id, doc }) => db.collection('sos_requests').doc(id).set(doc, { merge: true }))
  );

  await SosHistory.insertMany(
    sosRequests.map(({ id, doc }) => ({
      firestoreId: id,
      requesterUid: doc.requesterUid,
      assignedDonorUid: doc.acceptedDonorUid,
      bloodGroup: doc.bloodGroup,
      urgency: doc.urgency,
      location: doc.location,
      status: doc.status,
      timeline: doc.timeline
    })),
    { ordered: false }
  ).catch(() => {});

  const camp = buildCamp();
  await db.collection('donation_camps').doc(camp.id).set(camp.doc, { merge: true });

  await DonationHistory.insertMany(
    donors.slice(0, 4).map((donor, idx) => ({
      donorUid: donor.uid,
      campId: camp.id,
      bloodGroup: donor.bloodGroup || pick(BLOOD_GROUPS, idx),
      units: 1 + (idx % 2),
      location: donor.location || pick(LOCATIONS, idx),
      donatedAt: new Date(Date.now() - (95 + idx) * 86400000)
    })),
    { ordered: false }
  ).catch(() => {});

  await Promise.all(
    donors.slice(0, 6).map((donor, idx) =>
      db.collection('notifications').add({
        userUid: donor.uid,
        title: idx % 2 === 0 ? 'New SOS Triggered' : 'New Donation Camp Available',
        message:
          idx % 2 === 0
            ? 'Prototype SOS request created near your location. Check dashboard now.'
            : `Prototype camp "${camp.doc.name}" added.`,
        type: idx % 2 === 0 ? 'sos' : 'camp',
        referenceId: idx % 2 === 0 ? sosRequests[0].id : camp.id,
        metadata: {
          generatedBy: actorUid,
          prototype: true
        },
        read: false,
        createdAt: new Date().toISOString()
      })
    )
  );

  await seedAITrainingSignals();

  return {
    stocksCreated: stocks.length,
    sosCreated: sosRequests.length,
    campsCreated: 1,
    notificationsCreated: Math.min(6, donors.length),
    aiSignalsUpserted: LOCATIONS.length * BLOOD_GROUPS.length
  };
};
