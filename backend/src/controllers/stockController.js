import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { calculateDistanceKm } from '../services/locationService.js';
import { ROLES } from '../utils/constants.js';

const collection = db.collection('blood_stock');
const stockFlowCollection = db.collection('stock_flow');

const buildSourceKey = (record) => {
  if (record.createdBy) {
    return record.createdBy;
  }

  return `${record.sourceType || 'unknown'}:${record.location?.city || 'na'}:${record.location?.address || 'na'}`;
};

const mergeStockBySource = (rows, origin, radiusKm) => {
  const groups = new Map();

  rows.forEach((row) => {
    const computed = withComputedFields(row, origin);

    if (origin && (computed.distanceKm === null || computed.distanceKm > Number(radiusKm))) {
      return;
    }

    const key = `${computed.bloodGroup}|${buildSourceKey(computed)}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        ...computed,
        id: key,
        sourceUid: computed.createdBy || null,
        sourceLabel: computed.createdBy || computed.location?.address || computed.location?.city || 'Unknown source',
        mergedEntries: 1,
        stockIds: [computed.id]
      });
      return;
    }

    existing.units = Number(existing.units || 0) + Number(computed.units || 0);
    existing.mergedEntries += 1;
    existing.stockIds.push(computed.id);

    if (new Date(computed.expiryDate).getTime() < new Date(existing.expiryDate).getTime()) {
      existing.expiryDate = computed.expiryDate;
    }

    if (origin) {
      if (
        computed.distanceKm !== null &&
        (existing.distanceKm === null || computed.distanceKm < existing.distanceKm)
      ) {
        existing.distanceKm = computed.distanceKm;
        existing.location = computed.location;
      }
    }
  });

  return [...groups.values()].map((item) => ({
    ...item,
    ...withComputedFields(item, origin)
  }));
};

const attachSourceNames = async (rows) => {
  const sourceUids = [...new Set(rows.map((row) => row.sourceUid).filter(Boolean))];
  if (sourceUids.length === 0) {
    return rows;
  }

  const refs = sourceUids.map((uid) => db.collection('users').doc(uid));
  const docs = await db.getAll(...refs);

  const sourceNameByUid = docs.reduce((acc, doc) => {
    if (!doc.exists) return acc;

    const user = doc.data();
    acc[doc.id] = user.displayName || user.email || doc.id;
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    sourceName: row.sourceUid ? sourceNameByUid[row.sourceUid] || row.sourceLabel : row.sourceLabel
  }));
};

const withComputedFields = (record, origin) => {
  const expiryDate = new Date(record.expiryDate);
  const now = new Date();
  const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const distanceKm = origin
    ? calculateDistanceKm(origin.lat, origin.lng, record.location?.lat, record.location?.lng)
    : null;

  return {
    ...record,
    expiryWarning: daysToExpiry <= 5,
    daysToExpiry,
    distanceKm
  };
};

const logStockFlow = async ({ stockId, action, beforeRecord, afterRecord, actor }) => {
  const beforeUnits = Number(beforeRecord?.units || 0);
  const afterUnits = Number(afterRecord?.units || 0);
  const payload = {
    stockId,
    action,
    bloodGroup: afterRecord?.bloodGroup || beforeRecord?.bloodGroup || null,
    unitsBefore: beforeUnits,
    unitsAfter: afterUnits,
    deltaUnits: afterUnits - beforeUnits,
    sourceType: afterRecord?.sourceType || beforeRecord?.sourceType || null,
    sourceUid: afterRecord?.createdBy || beforeRecord?.createdBy || actor.uid,
    location: afterRecord?.location || beforeRecord?.location || null,
    actorUid: actor.uid,
    actorRole: actor.role,
    at: new Date().toISOString()
  };

  await stockFlowCollection.add(payload);
};

export const listStock = asyncHandler(async (req, res) => {
  const snapshot = await collection.get();
  let rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if ([ROLES.HOSPITAL, ROLES.BLOOD_BANK].includes(req.user.role)) {
    rows = rows.filter((row) => row.createdBy === req.user.uid);
  }

  res.json({ success: true, data: rows });
});

export const listStockFlow = asyncHandler(async (req, res) => {
  const snapshot = await stockFlowCollection.orderBy('at', 'desc').limit(500).get();
  let rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (req.user.role !== ROLES.ADMIN) {
    rows = rows.filter((row) => row.sourceUid === req.user.uid || row.actorUid === req.user.uid);
  }

  res.json({ success: true, data: rows });
});

const ensureStockOwner = (record, actor) => {
  if (actor.role === ROLES.ADMIN) {
    return;
  }

  if (record.createdBy !== actor.uid) {
    throw new AppError('Stock record access is restricted.', 403);
  }
};

export const createStock = asyncHandler(async (req, res) => {
  const payload = req.body;

  const docRef = await collection.add({
    ...payload,
    createdBy: req.user.uid,
    updatedBy: req.user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const doc = await docRef.get();
  const created = { id: doc.id, ...doc.data() };

  await logStockFlow({
    stockId: doc.id,
    action: 'created',
    beforeRecord: null,
    afterRecord: created,
    actor: req.user
  });

  res.status(201).json({ success: true, data: created });
});

export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = collection.doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError('Stock item not found', 404);
  }

  const existing = { id: doc.id, ...doc.data() };
  ensureStockOwner(existing, req.user);

  await docRef.set(
    {
      ...req.body,
      updatedBy: req.user.uid,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  const updated = await docRef.get();
  const updatedRecord = { id: updated.id, ...updated.data() };

  await logStockFlow({
    stockId: id,
    action: 'updated',
    beforeRecord: existing,
    afterRecord: updatedRecord,
    actor: req.user
  });

  res.json({ success: true, data: updatedRecord });
});

export const deleteStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = collection.doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError('Stock item not found', 404);
  }

  const existing = { id: doc.id, ...doc.data() };
  ensureStockOwner(existing, req.user);
  await docRef.delete();

  await logStockFlow({
    stockId: id,
    action: 'deleted',
    beforeRecord: existing,
    afterRecord: null,
    actor: req.user
  });

  res.json({ success: true, message: 'Stock deleted' });
});

export const searchStock = asyncHandler(async (req, res) => {
  const { bloodGroup, city, lat, lng, radiusKm = 100, sortBy = 'distance' } = req.query;

  const origin =
    lat && lng
      ? {
          lat: Number(lat),
          lng: Number(lng)
        }
      : null;

  const snapshot = await collection.get();

  let rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (bloodGroup) {
    rows = rows.filter((item) => item.bloodGroup === String(bloodGroup).toUpperCase());
  }

  if (city) {
    const target = String(city).trim().toLowerCase();
    rows = rows.filter((item) => item.location?.city?.toLowerCase() === target);
  }

  rows = mergeStockBySource(rows, origin, radiusKm);
  rows = await attachSourceNames(rows);

  if (sortBy === 'availability') {
    rows.sort((a, b) => b.units - a.units);
  } else {
    rows.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  res.json({ success: true, data: rows });
});
