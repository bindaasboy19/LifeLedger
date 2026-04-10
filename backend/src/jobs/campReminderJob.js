import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import { broadcastNotifications, sendEmailBatch } from '../services/notificationService.js';
import { calculateDistanceKm } from '../services/locationService.js';
import { isCommunityRole } from '../utils/constants.js';

const shouldSendDayBefore = (startAt) => {
  const now = new Date();
  const start = new Date(startAt);
  const hours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hours <= 30 && hours >= 18;
};

const shouldSendDayOf = (startAt) => {
  const now = new Date();
  const start = new Date(startAt);
  return now.toDateString() === start.toDateString();
};

const notifyCamp = async (camp, label) => {
  const radiusKm = Number(camp.notificationRadiusKm || 25);
  const snapshot = await db.collection('users').get();
  const recipients = snapshot.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((user) => isCommunityRole(user.role))
    .filter((user) => user.availabilityStatus !== false)
    .filter((user) => camp.requiredBloodGroups?.includes(user.bloodGroup))
    .filter((user) => {
      const distance = calculateDistanceKm(
        camp.location?.lat,
        camp.location?.lng,
        user.location?.lat,
        user.location?.lng
      );
      return distance !== null && distance <= radiusKm;
    });

  if (recipients.length === 0) return;

  const message = `${label}: ${camp.name} at ${camp.location?.city} on ${new Date(camp.startAt).toLocaleString()}`;

  await broadcastNotifications({
    recipients,
    title: 'Camp Reminder',
    message,
    type: 'camp',
    referenceId: camp.id,
    metadata: { reminderType: label }
  });

  await sendEmailBatch({
    recipients,
    subject: `LifeLedger Camp Reminder (${label})`,
    text: message,
    html: `<p>${message}</p>`
  });
};

export const runCampReminderCycle = async () => {
  const snapshot = await db.collection('donation_camps').get();

  for (const doc of snapshot.docs) {
    const camp = { id: doc.id, ...doc.data() };
    const reminders = camp.remindersSent || {};

    if (!reminders.dayBefore && shouldSendDayBefore(camp.startAt)) {
      await notifyCamp(camp, '1 day before');
      reminders.dayBefore = new Date().toISOString();
    }

    if (!reminders.dayOf && shouldSendDayOf(camp.startAt)) {
      await notifyCamp(camp, 'Same day');
      reminders.dayOf = new Date().toISOString();
    }

    await db.collection('donation_camps').doc(camp.id).set(
      {
        remindersSent: reminders,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }
};

export const startCampReminderJob = () => {
  if (!cron.validate(env.reminderCron)) {
    // eslint-disable-next-line no-console
    console.warn(`[campReminderJob] invalid cron expression: ${env.reminderCron}`);
    return null;
  }

  const task = cron.schedule(env.reminderCron, async () => {
    try {
      await runCampReminderCycle();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[campReminderJob] run failed', error);
    }
  });

  return task;
};
