import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import { broadcastNotifications, sendEmailBatch } from '../services/notificationService.js';
import { COMMUNITY_ROLES } from '../utils/constants.js';

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
  const snapshots = await Promise.all(
    COMMUNITY_ROLES.map((role) => db.collection('users').where('role', '==', role).get())
  );
  const recipients = snapshots
    .flatMap((snapshot) => snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })))
    .filter((donor) => camp.requiredBloodGroups?.includes(donor.bloodGroup));

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
