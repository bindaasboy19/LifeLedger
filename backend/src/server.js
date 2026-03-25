import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './config/mongo.js';
import { startCampReminderJob } from './jobs/campReminderJob.js';
import mongoose from 'mongoose';

const boot = async () => {
  const app = createApp();
  app.locals.mongoReady = false;
  const server = app.listen(env.port, env.host, () => {
    // eslint-disable-next-line no-console
    console.log(`LifeLedger backend running on ${env.host}:${env.port} | mongo: connecting`);
  });

  server.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('[server] listen failed', error.message);
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
  });

  mongoose.connection.on('connected', () => {
    app.locals.mongoReady = true;
    // eslint-disable-next-line no-console
    console.log('[server] MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    app.locals.mongoReady = false;
    // eslint-disable-next-line no-console
    console.warn('[server] MongoDB disconnected');
  });

  connectMongo().catch((error) => {
    app.locals.mongoReady = false;
    // eslint-disable-next-line no-console
    console.error('[server] MongoDB connection failed', error.message);
    if (/bad auth/i.test(error.message)) {
      // eslint-disable-next-line no-console
      console.error(
        '[server] Mongo auth failed: verify MONGODB_URI username/password, URL-encode special characters, and confirm Atlas DB user permissions.'
      );
    }
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
  });

  startCampReminderJob();
};

boot().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[server] boot failed', error);
  process.exit(1);
});
