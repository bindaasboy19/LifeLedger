import '../config/env.js';
import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { auth, db } from '../config/firebase.js';
import { SosHistory } from '../models/SosHistory.js';
import { DonationHistory } from '../models/DonationHistory.js';
import { DonationCertificate } from '../models/DonationCertificate.js';
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

const ngos = [
  {
    uid: 'ngo_1',
    displayName: 'Helping Hands NGO',
    role: 'ngo',
    isVerified: true,
    email: 'ngo1@lifeledger.demo',
    bloodGroup: 'A+',
    location: { city: 'Mumbai', address: 'Dadar Community Hub', lat: 19.018, lng: 72.843 }
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
  ...ngos,
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
    displayName: 'Community Member One',
    role: 'user',
    isVerified: true,
    email: 'user@lifeledger.demo',
    bloodGroup: 'O+',
    availabilityStatus: true,
    location: { city: 'Delhi', lat: 28.62, lng: 77.2, address: 'Demo User Address' }
  }
].map((user) => ({
  ...user,
  availabilityStatus:
    user.availabilityStatus ?? (['user', 'donor', 'hospital'].includes(user.role) ? true : undefined),
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
    name: 'Mumbai Community Donation Drive',
    organizer: 'Helping Hands NGO',
    startAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
    endAt: new Date(now.getTime() + 5.5 * 86400000).toISOString(),
    location: ngos[0].location,
    requiredBloodGroups: ['A-', 'AB+', 'O+'],
    contactDetails: { email: 'camp2@lifeledger.demo', phone: '+922222222222' },
    description: 'NGO-led community donation drive',
    createdBy: ngos[0].uid,
    createdByRole: ngos[0].role
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
    createdBy: hospitals[2].uid,
    createdByRole: hospitals[2].role
  }
].map((camp) => ({
  ...camp,
  createdByRole: camp.createdByRole || 'hospital',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  remindersSent: {}
}));

const campApplications = [
  {
    id: 'camp_app_1',
    campId: 'camp_2',
    campName: 'Mumbai Community Donation Drive',
    applicantUid: 'user_1',
    applicantName: 'Community Member One',
    applicantEmail: 'user@lifeledger.demo',
    bloodGroup: 'O+',
    notes: 'Available to donate during the second half of the camp.',
    status: 'completed',
    organizerUid: 'ngo_1',
    reviewedBy: 'ngo_1',
    reviewedByRole: 'ngo',
    reviewNotes: 'Donation completed and certificate issued.',
    units: 1,
    donationRecordId: 'seed_donation_user_1',
    certificateId: 'seed_certificate_user_1',
    certificateNumber: 'LL-SEED-USER1-0001',
    completedAt: new Date(now.getTime() - 12 * 86400000).toISOString(),
    createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - 12 * 86400000).toISOString()
  },
  {
    id: 'camp_app_2',
    campId: 'camp_2',
    campName: 'Mumbai Community Donation Drive',
    applicantUid: 'donor_3',
    applicantName: 'Demo Donor 3',
    applicantEmail: 'donor3@lifeledger.demo',
    bloodGroup: 'A-',
    notes: 'Can arrive in the morning slot.',
    status: 'approved',
    organizerUid: 'ngo_1',
    reviewedBy: 'ngo_1',
    reviewedByRole: 'ngo',
    reviewNotes: 'Approved for slot allocation.',
    createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - 36 * 3600000).toISOString()
  },
  {
    id: 'camp_app_3',
    campId: 'camp_1',
    campName: 'Save Lives Delhi Camp',
    applicantUid: 'donor_7',
    applicantName: 'Demo Donor 7',
    applicantEmail: 'donor7@lifeledger.demo',
    bloodGroup: 'AB-',
    notes: 'Interested in emergency mobilization.',
    status: 'pending',
    organizerUid: 'hospital_1',
    createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 24 * 3600000).toISOString()
  }
];

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
      clearFirestoreCollection('camp_applications'),
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
    campApplications.map((application) =>
      db
        .collection('camp_applications')
        .doc(application.id)
        .set(application, { merge: true })
    )
  );

  await Promise.all(
    [...donors.slice(0, 4), users.find((user) => user.uid === 'user_1'), ngos[0]].filter(Boolean).map((user, idx) =>
      db
        .collection('notifications')
        .doc(`notification_${idx + 1}`)
        .set({
          userUid: user.uid,
          title: idx === 5 ? 'Camp Applications Incoming' : 'Welcome to LifeLedger',
          message:
            user.uid === 'user_1'
              ? 'Your community profile can now both request blood and apply for donation camps.'
              : user.uid === 'ngo_1'
                ? 'Your NGO dashboard can now manage camps, donor applications, and future demand signals.'
                : 'Your donation readiness dashboard is ready.',
          type: idx === 5 ? 'camp' : 'system',
          referenceId: idx === 5 ? 'camp_2' : null,
          metadata: idx === 5 ? { seeded: true } : {},
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
      DonationCertificate.deleteMany({}),
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

  donationHistory.push({
    donorUid: 'user_1',
    campId: 'camp_2',
    bloodGroup: 'O+',
    units: 1,
    location: ngos[0].location,
    donatedAt: new Date(now.getTime() - 12 * 86400000)
  });

  await DonationHistory.insertMany(donationHistory, { ordered: false }).catch(() => {});

  await DonationCertificate.insertMany(
    [
      {
        certificateNumber: 'LL-SEED-USER1-0001',
        donorUid: 'user_1',
        donorName: 'Community Member One',
        campId: 'camp_2',
        campName: 'Mumbai Community Donation Drive',
        applicationId: 'camp_app_1',
        organizerUid: 'ngo_1',
        organizerName: 'Helping Hands NGO',
        bloodGroup: 'O+',
        units: 1,
        issuedAt: new Date(now.getTime() - 12 * 86400000)
      }
    ],
    { ordered: false }
  ).catch(() => {});

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
