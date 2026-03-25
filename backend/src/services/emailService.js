import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (env.email.host && env.email.user && env.email.pass) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.pass
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) return null;

  const tx = getTransporter();

  return tx.sendMail({
    from: env.email.from,
    to,
    subject,
    html,
    text
  });
};
