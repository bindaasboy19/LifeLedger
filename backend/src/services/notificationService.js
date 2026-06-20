import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import { sendEmail } from './emailService.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (handler, { retries = 2, baseDelayMs = 400 } = {}) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await handler();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        // eslint-disable-next-line no-await-in-loop
        await delay(baseDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
};

const logNotificationFailure = async (payload) => {
  try {
    await db.collection('notification_failures').add({
      ...payload,
      createdAt: new Date().toISOString()
    });
  } catch {
    // ignore failure logging issues
  }
};

const queueEmailBatch = async ({ recipients, subject, html, text }) => {
  const emailRecipients = recipients.filter((recipient) => Boolean(recipient.email));

  const results = await Promise.allSettled(
    emailRecipients.map((recipient) =>
      withRetry(() =>
        db.collection('email_jobs').add({
          userUid: recipient.uid || null,
          to: recipient.email,
          subject,
          html,
          text,
          status: 'pending',
          attempts: 0,
          createdAt: new Date().toISOString()
        })
      )
    )
  );

  await Promise.all(
    results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return Promise.resolve();
      }

      const recipient = emailRecipients[index];
      return logNotificationFailure({
        channel: 'email_queue',
        userUid: recipient?.uid,
        email: recipient?.email,
        subject,
        error: result.reason?.message || 'email-queue-failed'
      });
    })
  );
};

export const createNotification = async ({
  userUid,
  title,
  message,
  type = 'generic',
  referenceId,
  metadata = {}
}) => {
  return withRetry(async () => {
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
  });
};

export const broadcastNotifications = async ({ recipients, title, message, type, referenceId, metadata }) => {
  const results = await Promise.allSettled(
    recipients.map((user) =>
      createNotification({
        userUid: user.uid,
        title,
        message,
        type,
        referenceId,
        metadata
      })
    )
  );

  await Promise.all(
    results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return Promise.resolve();
      }

      return logNotificationFailure({
        channel: 'in_app',
        userUid: recipients[index]?.uid,
        referenceId,
        type,
        error: result.reason?.message || 'notification-failed'
      });
    })
  );
};

export const sendEmailBatch = async ({ recipients, subject, html, text }) => {
  if (env.email.deliveryMode === 'queue') {
    await queueEmailBatch({ recipients, subject, html, text });
    return;
  }

  const emailRecipients = recipients.filter((recipient) => Boolean(recipient.email));
  const results = await Promise.allSettled(
    emailRecipients.map((recipient) =>
      withRetry(() =>
        sendEmail({
          to: recipient.email,
          subject,
          html,
          text
        })
      )
    )
  );

  await Promise.all(
    results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return Promise.resolve();
      }

      const recipient = emailRecipients[index];
      return logNotificationFailure({
        channel: 'email',
        userUid: recipient?.uid,
        email: recipient?.email,
        subject,
        error: result.reason?.message || 'email-failed'
      });
    })
  );
};
