import dotenv from 'dotenv';

dotenv.config();

const clean = (value) => {
  if (value === undefined || value === null) return value;
  const trimmed = String(value).trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted.trim();
};

const normalizePrivateKey = (value) => {
  const cleaned = clean(value);
  if (!cleaned) return cleaned;

  const withLines = cleaned.replace(/\\n/g, '\n');
  if (withLines.includes('BEGIN PRIVATE KEY')) {
    return withLines;
  }

  return `-----BEGIN PRIVATE KEY-----\n${withLines}\n-----END PRIVATE KEY-----\n`;
};

const required = ['MONGODB_URI'];
required.forEach((key) => {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing optional/required variable: ${key}`);
  }
});

const clientUrls = (clean(process.env.CLIENT_URL || 'http://localhost:5173') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: clientUrls[0] || 'http://localhost:5173',
  clientUrls,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://admin:admin12@cluster0.7qlg6h9.mongodb.net/?appName=Cluster0',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  reminderCron: process.env.REMINDER_CRON || '*/30 * * * *',
  sosRateWindowMs: Number(process.env.SOS_RATE_WINDOW_MS || 60000),
  sosRateMax: Number(process.env.SOS_RATE_MAX || 5),
  firebase: {
    projectId: clean(process.env.FIREBASE_PROJECT_ID),
    clientEmail: clean(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    storageBucket: clean(process.env.FIREBASE_STORAGE_BUCKET),
    databaseURL: clean(process.env.FIREBASE_DATABASE_URL)
  },
  email: {
    host: clean(process.env.EMAIL_HOST),
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
    user: clean(process.env.EMAIL_USER),
    pass: clean(process.env.EMAIL_PASS),
    from: clean(process.env.EMAIL_FROM) || 'LifeLedger <noreply@lifeledger.app>'
  }
};
