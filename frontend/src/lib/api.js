import axios from 'axios';
import { firebaseAuth } from './firebase.js';

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

const normalizeApiBaseUrl = (value) => {
  const cleaned = cleanEnv(value);
  if (!cleaned) return 'http://localhost:5000/api';

  const withScheme = /^https?:\/\//i.test(cleaned)
    ? cleaned
    : cleaned.includes('localhost') || cleaned.includes('127.0.0.1')
      ? `http://${cleaned}`
      : `https://${cleaned}`;

  try {
    const url = new URL(withScheme);
    const pathname = url.pathname.replace(/\/+$/, '');
    url.pathname = pathname.endsWith('/api') ? pathname : `${pathname || ''}/api`;
    return url.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:5000/api';
  }
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('lifeledger_token');

  if (firebaseAuth.currentUser) {
    token = await firebaseAuth.currentUser.getIdToken();
    localStorage.setItem('lifeledger_token', token);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === 'ERR_NETWORK') {
      error.message =
        'Network error: backend API is unreachable. Check backend server, port, and VITE_API_BASE_URL.';
    }
    return Promise.reject(error);
  }
);
