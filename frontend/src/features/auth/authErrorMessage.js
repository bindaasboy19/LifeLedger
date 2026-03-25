const firebaseMessages = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/firebase-app-check-token-is-invalid':
    'Firebase App Check token is invalid. Configure App Check site key/debug token or disable enforcement.',
  'auth/invalid-app-credential':
    'Invalid app credential. Check Firebase App Check or reCAPTCHA configuration.'
};

export const getAuthErrorMessage = (error, fallback = 'Authentication failed.') => {
  if (!error) return fallback;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('firebase-app-check-token-is-invalid')
  ) {
    return 'Firebase App Check rejected this request. Set VITE_FIREBASE_APP_CHECK_SITE_KEY (and provider), or disable App Check enforcement in Firebase Console for local demo.';
  }

  if (error.code && firebaseMessages[error.code]) {
    return firebaseMessages[error.code];
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
};
