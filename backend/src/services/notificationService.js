import { db } from '../config/firebase.js';
import { sendEmail } from './emailService.js';

export const createNotification = async ({
  userUid,
  title,
  message,
  type = 'generic',
  referenceId,
  metadata = {}
}) => {
  const docRef = await db.collection('notifications').add({
    userUid,
    title,
    message,
    type,
    referenceId: referenceId || null,
    metadata,
    read: false,
    createdAt: new Date().toISOString()
  });

  return { id: docRef.id };
};

export const broadcastNotifications = async ({ recipients, title, message, type, referenceId, metadata }) => {
  const tasks = recipients.map((user) =>
    createNotification({
      userUid: user.uid,
      title,
      message,
      type,
      referenceId,
      metadata
    })
  );

  await Promise.all(tasks);
};

export const sendEmailBatch = async ({ recipients, subject, html, text }) => {
  const tasks = recipients
    .filter((recipient) => Boolean(recipient.email))
    .map((recipient) =>
      sendEmail({
        to: recipient.email,
        subject,
        html,
        text
      })
    );

  await Promise.allSettled(tasks);
};
