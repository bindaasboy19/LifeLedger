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
  if (!cleaned) return 'http://localhost:5001/api';

  const tokens = cleaned.split(',').map((t) => t.trim()).filter(Boolean);
  let target = tokens[0] || '';
  if (import.meta.env.DEV && tokens.length > 1) {
    const localToken = tokens.find((t) => t.includes('localhost') || t.includes('127.0.0.1'));
    if (localToken) target = localToken;
  }

  const withScheme = /^https?:\/\//i.test(target)
    ? target
    : target.includes('localhost') || target.includes('127.0.0.1')
      ? `http://${target}`
      : `https://${target}`;

  try {
    const url = new URL(withScheme);
    const pathname = url.pathname.replace(/\/+$/, '');
    url.pathname = pathname.endsWith('/api') ? pathname : `${pathname || ''}/api`;
    return url.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:5001/api';
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
      error.message = 'Service is temporarily unavailable. Please try again shortly.';
    }
    return Promise.reject(error);
  }
);
