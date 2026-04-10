import axios from 'axios';
import { env } from '../config/env.js';

const normalizeServiceUrl = (value) => {
  const cleaned = String(value || '').trim().replace(/\/+$/, '');
  if (!cleaned) return 'http://localhost:8000';
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) return `http://${cleaned}`;
  return `https://${cleaned}`;
};

const AI_BASE_URL = normalizeServiceUrl(env.aiServiceUrl);

export const checkPredictionServiceHealth = async () => {
  try {
    const { data } = await axios.get(`${AI_BASE_URL}/health`, {
      timeout: 5000
    });

    return {
      available: true,
      source: AI_BASE_URL,
      data
    };
  } catch {
    return {
      available: false,
      source: AI_BASE_URL
    };
  }
};

export const requestPrediction = async (payload) => {
  try {
    const { data } = await axios.post(`${AI_BASE_URL}/predict`, payload, {
      timeout: 15000
    });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.response?.data?.message || 'prediction-request-failed');
  }
};
