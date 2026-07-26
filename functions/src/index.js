import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import nodemailer from 'nodemailer';

initializeApp();

const db = getFirestore();
let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
};

const logFailure = async (payload) => {
  try {
    await db.collection('notification_failures').add({
      ...payload,
      createdAt: new Date().toISOString(),
      source: 'cloud_function'
    });
  } catch {
    // ignore secondary logging failures
  }
};

export const processEmailJob = onDocumentCreated(
  {
    document: 'email_jobs/{jobId}',
    region: process.env.DEPLOYMENT_REGION || process.env.LOCATION_ID || 'asia-south1',
    retry: false
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const job = snapshot.data();
    if (!job || job.status && job.status !== 'pending') {
      return;
    }

    try {
      await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || 'LifeLedger <noreply@lifeledger.app>',
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text
      });

      await snapshot.ref.set(
        {
          status: 'sent',
          attempts: FieldValue.increment(1),
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          error: FieldValue.delete()
        },
        { merge: true }
      );
    } catch (error) {
      await snapshot.ref.set(
        {
          status: 'failed',
          attempts: FieldValue.increment(1),
          failedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          error: error.message || 'email-send-failed'
        },
        { merge: true }
      );

      await logFailure({
        channel: 'email',
        email: job.to,
        userUid: job.userUid || null,
        subject: job.subject,
        error: error.message || 'email-send-failed',
        referenceId: snapshot.id
      });
    }
  }
);
