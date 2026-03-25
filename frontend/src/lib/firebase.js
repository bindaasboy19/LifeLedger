import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  initializeAppCheck
} from 'firebase/app-check';

const cleanEnv = (value) => {
  if (!value) return value;
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID)
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(`[firebase-client] Missing Firebase config keys: ${missingKeys.join(', ')}`);
}

const firebaseApp = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

const appCheckSiteKey = cleanEnv(import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY);
const appCheckDebugToken = cleanEnv(import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN);
const appCheckProvider = cleanEnv(import.meta.env.VITE_FIREBASE_APP_CHECK_PROVIDER) || 'v3';

let appCheck = null;

if (appCheckSiteKey) {
  try {
    if (appCheckDebugToken) {
      globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN =
        appCheckDebugToken === 'true' ? true : appCheckDebugToken;
    }

    const provider =
      appCheckProvider === 'enterprise'
        ? new ReCaptchaEnterpriseProvider(appCheckSiteKey)
        : new ReCaptchaV3Provider(appCheckSiteKey);

    appCheck = initializeAppCheck(firebaseApp, {
      provider,
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`[firebase-client] App Check initialization failed: ${error?.message || error}`);
  }
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[firebase-client] VITE_FIREBASE_APP_CHECK_SITE_KEY is missing. If App Check is enforced in Firebase, auth/data requests will fail.'
  );
}

export { appCheck };
