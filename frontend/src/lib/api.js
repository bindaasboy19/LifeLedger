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

const API_BASE_URL = cleanEnv(import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000/api';

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
