const firebaseMessages = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Unable to connect right now. Please try again shortly.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/firebase-app-check-token-is-invalid':
    'Session verification failed. Refresh and try again.',
  'auth/invalid-app-credential':
    'Authentication could not be completed. Please try again.'
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
    return 'Session verification failed. Refresh and try again.';
  }

  if (error.code && firebaseMessages[error.code]) {
    return firebaseMessages[error.code];
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
};
