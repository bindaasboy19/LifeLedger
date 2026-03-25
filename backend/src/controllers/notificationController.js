import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const snapshot = await db
    .collection('notifications')
    .where('userUid', '==', req.user.uid)
    .orderBy('createdAt', 'desc')
    .get();

  const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ success: true, data: rows });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = db.collection('notifications').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError('Notification not found', 404);
  }

  const payload = doc.data();
  if (payload.userUid !== req.user.uid && req.user.role !== 'admin') {
    throw new AppError('Forbidden notification update', 403);
  }

  await docRef.set({ read: true, readAt: new Date().toISOString() }, { merge: true });

  res.json({ success: true, message: 'Notification marked as read' });
});
