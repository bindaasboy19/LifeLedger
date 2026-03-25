import admin from 'firebase-admin';
import { env } from './env.js';

let app;
const firebaseState = {
  initializedWith: 'unknown',
  warning: null
};

const canInitWithEnv =
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey;

const initWithServiceAccount = () => {
  try {
    firebaseState.initializedWith = 'service_account';
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey
      }),
      storageBucket: env.firebase.storageBucket,
      databaseURL: env.firebase.databaseURL
    });
  } catch (error) {
    firebaseState.warning = error.message;
    // eslint-disable-next-line no-console
    console.warn(
      `[firebase] Invalid service account values in environment, falling back to default credentials. ${error.message}`
    );
    return null;
  }
};

if (!admin.apps.length) {
  if (canInitWithEnv) {
    app = initWithServiceAccount();
  }

  if (!app) {
    firebaseState.initializedWith = 'application_default';
    app = admin.initializeApp();
  }
} else {
  firebaseState.initializedWith = 'existing_app';
  app = admin.app();
}


export const auth = admin.auth(app);
export const db = admin.firestore(app);
export { firebaseState };
export default app;
