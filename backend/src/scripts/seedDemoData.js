import '../config/env.js';
import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { auth, db } from '../config/firebase.js';
import { SosHistory } from '../models/SosHistory.js';
import { DonationHistory } from '../models/DonationHistory.js';
import { AuditLog } from '../models/AuditLog.js';
import { AITrainingData } from '../models/AITrainingData.js';

const now = new Date();

const cityMeta = {
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 }
};

const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const hospitals = [
  {
    uid: 'hospital_1',
    displayName: 'CityCare Hospital',
    role: 'hospital',
    isVerified: true,
    email: 'hospital1@lifeledger.demo',
    bloodGroup: 'O+',
    location: { city: 'Delhi', address: 'Connaught Place', lat: 28.6328, lng: 77.2197 }
  },
  {
    uid: 'hospital_2',
    displayName: 'Metro Heart Institute',
    role: 'hospital',
    isVerified: true,
    email: 'hospital2@lifeledger.demo',
    bloodGroup: 'A+',
    location: { city: 'Mumbai', address: 'Bandra West', lat: 19.0607, lng: 72.8365 }
  },
  {
    uid: 'hospital_3',
    displayName: 'Unity Medical Center',
    role: 'hospital',
    isVerified: true,
    email: 'hospital3@lifeledger.demo',
    bloodGroup: 'B+',
    location: { city: 'Bengaluru', address: 'Indiranagar', lat: 12.9719, lng: 77.6412 }
  }
];

const bloodBanks = [
  {
    uid: 'bloodbank_1',
    displayName: 'RedDrop Central Bank',
    role: 'blood_bank',
    isVerified: true,
    email: 'bloodbank1@lifeledger.demo',
    bloodGroup: 'AB+',
    location: { city: 'Delhi', address: 'Karol Bagh', lat: 28.6519, lng: 77.1909 }
  },
  {
    uid: 'bloodbank_2',
    displayName: 'Pulse Blood Repository',
    role: 'blood_bank',
    isVerified: true,
    email: 'bloodbank2@lifeledger.demo',
    bloodGroup: 'O-',
    location: { city: 'Mumbai', address: 'Andheri East', lat: 19.1136, lng: 72.8697 }
  }
];

const donors = Array.from({ length: 10 }).map((_, index) => {
  const groups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'A+', 'O+'];
  const cities = ['Delhi', 'Delhi', 'Mumbai', 'Mumbai', 'Bengaluru', 'Bengaluru', 'Delhi', 'Mumbai', 'Bengaluru', 'Delhi'];
  const city = cities[index];
  const base = cityMeta[city];

  return {
    uid: `donor_${index + 1}`,
    displayName: `Demo Donor ${index + 1}`,
    role: 'donor',
    isVerified: true,
    email: `donor${index + 1}@lifeledger.demo`,
    bloodGroup: groups[index],
    availabilityStatus: true,
    lastDonationDate: new Date(now.getTime() - (100 + index) * 86400000).toISOString(),
    location: {
      city,
      address: `${city} Sector ${index + 1}`,
      lat: base.lat + (index % 3) * 0.01,
      lng: base.lng + (index % 3) * 0.01
    }
  };
});

const users = [
  ...hospitals,
  ...bloodBanks,
  ...donors,
  {
    uid: 'admin_1',
    displayName: 'Platform Admin',
    role: 'admin',
    isVerified: true,
    email: 'admin@lifeledger.demo',
    bloodGroup: 'AB+',
    location: { city: 'Delhi', lat: 28.61, lng: 77.21, address: 'HQ' }
  },
  {
    uid: 'user_1',
    displayName: 'Patient User',
    role: 'user',
    isVerified: true,
    email: 'user@lifeledger.demo',
    bloodGroup: 'O+',
    location: { city: 'Delhi', lat: 28.62, lng: 77.2, address: 'Demo User Address' }
  }
].map((user) => ({
  ...user,
  phone: '+910000000000',
  isBlocked: false,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));

const DEMO_PASSWORD = 'Demo@12345';

const stockEntries = [
  {
    id: 'stock_1',
    bloodGroup: 'A+',
    units: 18,
    collectionDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
    expiryDate: new Date(now.getTime() + 25 * 86400000).toISOString(),
    location: hospitals[0].location,
    sourceType: 'hospital',
    createdBy: hospitals[0].uid
  },
  {
    id: 'stock_2',
    bloodGroup: 'O-',
    units: 6,
    collectionDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
    expiryDate: new Date(now.getTime() + 8 * 86400000).toISOString(),
    location: hospitals[1].location,
    sourceType: 'hospital',
    createdBy: hospitals[1].uid
  },
  {
    id: 'stock_3',
    bloodGroup: 'B+',
    units: 22,
    collectionDate: new Date(now.getTime() - 4 * 86400000).toISOString(),
    expiryDate: new Date(now.getTime() + 28 * 86400000).toISOString(),
    location: bloodBanks[0].location,
    sourceType: 'blood_bank',
    createdBy: bloodBanks[0].uid
  },
  {
    id: 'stock_4',
    bloodGroup: 'AB+',
    units: 4,
    collectionDate: new Date(now.getTime() - 6 * 86400000).toISOString(),
    expiryDate: new Date(now.getTime() + 6 * 86400000).toISOString(),
    location: bloodBanks[1].location,
    sourceType: 'blood_bank',
    createdBy: bloodBanks[1].uid
  },
  {
    id: 'stock_5',
    bloodGroup: 'O+',
    units: 30,
    collectionDate: new Date(now.getTime() - 3 * 86400000).toISOString(),
    expiryDate: new Date(now.getTime() + 30 * 86400000).toISOString(),
    location: hospitals[2].location,
    sourceType: 'hospital',
    createdBy: hospitals[2].uid
  }
].map((entry) => ({
  ...entry,
  updatedBy: entry.createdBy,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));

const sosRecords = [
  {
    id: 'sos_1',
    requesterUid: 'user_1',
    bloodGroup: 'O-',
    urgency: 'critical',
    location: hospitals[0].location,
    status: 'completed',
    candidateDonorUids: ['donor_1', 'donor_2', 'donor_10'],
    acceptedDonorUid: 'donor_1'
  },
  {
    id: 'sos_2',
    requesterUid: 'user_1',
    bloodGroup: 'A+',
    urgency: 'high',
    location: hospitals[1].location,
    status: 'in_progress',
    candidateDonorUids: ['donor_3', 'donor_4'],
    acceptedDonorUid: 'donor_4'
  },
  {
    id: 'sos_3',
    requesterUid: 'user_1',
    bloodGroup: 'B+',
    urgency: 'medium',
    location: hospitals[2].location,
    status: 'accepted',
    candidateDonorUids: ['donor_5', 'donor_6', 'donor_9'],
    acceptedDonorUid: 'donor_5'
  },
  {
    id: 'sos_4',
    requesterUid: 'user_1',
    bloodGroup: 'AB+',
    urgency: 'low',
    location: bloodBanks[1].location,
    status: 'cancelled',
    candidateDonorUids: ['donor_8', 'donor_3'],
    acceptedDonorUid: null
  },
  {
    id: 'sos_5',
    requesterUid: 'user_1',
    bloodGroup: 'O+',
    urgency: 'high',
    location: bloodBanks[0].location,
    status: 'completed',
    candidateDonorUids: ['donor_2', 'donor_10'],
    acceptedDonorUid: 'donor_2'
  }
].map((record, index) => ({
  ...record,
  candidateResponderUids: record.candidateDonorUids,
  acceptedResponderUid: record.acceptedDonorUid,
  rejectedResponderUids: [],
  createdAt: new Date(now.getTime() - (index + 1) * 86400000).toISOString(),
  updatedAt: new Date(now.getTime() - index * 86400000).toISOString(),
  timeline: [
    {
      status: 'created',
      changedBy: record.requesterUid,
      at: new Date(now.getTime() - (index + 1) * 86400000).toISOString()
    },
    {
      status: record.status,
      changedBy: record.acceptedDonorUid || record.requesterUid,
      at: new Date(now.getTime() - index * 86400000).toISOString()
    }
  ],
  rejectedDonorUids: []
}));

const camps = [
  {
    id: 'camp_1',
    name: 'Save Lives Delhi Camp',
    organizer: 'CityCare Hospital',
    startAt: new Date(now.getTime() + 2 * 86400000).toISOString(),
    endAt: new Date(now.getTime() + 2.5 * 86400000).toISOString(),
    location: hospitals[0].location,
    requiredBloodGroups: ['O-', 'A+', 'B+'],
    contactDetails: { email: 'camp1@lifeledger.demo', phone: '+911111111111' },
    description: 'Corporate donation drive',
    createdBy: hospitals[0].uid
  },
  {
    id: 'camp_2',
    name: 'Mumbai Donor Rally',
    organizer: 'Metro Heart Institute',
    startAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
    endAt: new Date(now.getTime() + 5.5 * 86400000).toISOString(),
    location: hospitals[1].location,
    requiredBloodGroups: ['A-', 'AB+', 'O+'],
    contactDetails: { email: 'camp2@lifeledger.demo', phone: '+922222222222' },
    description: 'Community donor rally',
    createdBy: hospitals[1].uid
  },
  {
    id: 'camp_3',
    name: 'Bengaluru Weekend Camp',
    organizer: 'Unity Medical Center',
    startAt: new Date(now.getTime() + 1 * 86400000).toISOString(),
    endAt: new Date(now.getTime() + 1.5 * 86400000).toISOString(),
    location: hospitals[2].location,
    requiredBloodGroups: ['B-', 'AB-', 'O-'],
    contactDetails: { email: 'camp3@lifeledger.demo', phone: '+933333333333' },
    description: 'Weekend emergency stock-up camp',
    createdBy: hospitals[2].uid
  }
].map((camp) => ({
  ...camp,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  remindersSent: {}
}));

const clearFirestoreCollection = async (name) => {
  const snapshot = await db.collection(name).get();
  const chunk = snapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(chunk);
};

const seedFirestore = async (reset) => {
  if (reset) {
    await Promise.all([
      clearFirestoreCollection('users'),
      clearFirestoreCollection('blood_stock'),
      clearFirestoreCollection('stock_flow'),
      clearFirestoreCollection('sos_requests'),
      clearFirestoreCollection('donation_camps'),
      clearFirestoreCollection('notifications')
    ]);
  }

  await Promise.all(
    users.map((user) =>
      db
        .collection('users')
        .doc(user.uid)
        .set(user, { merge: true })
    )
  );

  await Promise.all(
    stockEntries.map((entry) =>
      db
        .collection('blood_stock')
        .doc(entry.id)
        .set(entry, { merge: true })
    )
  );

  await Promise.all(
    stockEntries.map((entry, index) =>
      db
        .collection('stock_flow')
        .doc(`stock_flow_${index + 1}`)
        .set({
          stockId: entry.id,
          action: 'seeded',
          bloodGroup: entry.bloodGroup,
          unitsBefore: 0,
          unitsAfter: entry.units,
          deltaUnits: entry.units,
          sourceType: entry.sourceType,
          location: entry.location,
          actorUid: entry.createdBy,
          actorRole: entry.sourceType,
          at: now.toISOString()
        })
    )
  );

  await Promise.all(
    sosRecords.map((entry) =>
      db
        .collection('sos_requests')
        .doc(entry.id)
        .set(entry, { merge: true })
    )
  );

  await Promise.all(
    camps.map((camp) =>
      db
        .collection('donation_camps')
        .doc(camp.id)
        .set(camp, { merge: true })
    )
  );

  await Promise.all(
    donors.slice(0, 5).map((donor, idx) =>
      db
        .collection('notifications')
        .doc(`notification_${idx + 1}`)
        .set({
          userUid: donor.uid,
          title: 'Welcome to LifeLedger',
          message: 'Your donor dashboard is ready.',
          type: 'system',
          referenceId: null,
          metadata: {},
          read: false,
          createdAt: now.toISOString()
        })
    )
  );
};

const seedFirebaseAuth = async () => {
  for (const user of users) {
    try {
      await auth.getUser(user.uid);
      await auth.updateUser(user.uid, {
        email: user.email,
        password: DEMO_PASSWORD,
        displayName: user.displayName
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await auth.createUser({
          uid: user.uid,
          email: user.email,
          password: DEMO_PASSWORD,
          displayName: user.displayName
        });
      } else {
        throw error;
      }
    }
  }
};

const seedMongo = async (reset) => {
  if (reset) {
    await Promise.all([
      SosHistory.deleteMany({}),
      DonationHistory.deleteMany({}),
      AuditLog.deleteMany({}),
      AITrainingData.deleteMany({})
    ]);
  }

  await SosHistory.insertMany(
    sosRecords.map((entry) => ({
      firestoreId: entry.id,
      requesterUid: entry.requesterUid,
      assignedDonorUid: entry.acceptedDonorUid,
      bloodGroup: entry.bloodGroup,
      urgency: entry.urgency,
      location: entry.location,
      status: entry.status,
      timeline: entry.timeline,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    })),
    { ordered: false }
  ).catch(() => {});

  const donationHistory = donors.map((donor, idx) => ({
    donorUid: donor.uid,
    campId: camps[idx % camps.length].id,
    bloodGroup: donor.bloodGroup,
    units: 1 + (idx % 2),
    location: donor.location,
    donatedAt: new Date(now.getTime() - (100 + idx) * 86400000)
  }));

  await DonationHistory.insertMany(donationHistory, { ordered: false }).catch(() => {});

  const aiRows = [];
  for (let day = 120; day >= 1; day -= 1) {
    const date = new Date(now.getTime() - day * 86400000);
    for (const region of Object.keys(cityMeta)) {
      for (const group of bloodGroups) {
        const base = 5 + ((day + group.charCodeAt(0)) % 7);
        aiRows.push({
          date,
          region,
          bloodGroup: group,
          sosCount: base + (region === 'Delhi' ? 2 : 0),
          usageUnits: base + 8,
          campDonationVolume: Math.max(1, base - 2)
        });
      }
    }
  }

  await AITrainingData.insertMany(aiRows, { ordered: false }).catch(() => {});
};

const run = async () => {
  const reset = process.argv.includes('--reset');

  await connectMongo();
  await seedFirebaseAuth();
  await seedFirestore(reset);
  await seedMongo(reset);

  // eslint-disable-next-line no-console
  console.log('Seed complete. Demo data is ready.');
};

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
