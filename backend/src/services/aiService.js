import axios from 'axios';
import { env } from '../config/env.js';

export const requestPrediction = async (payload) => {
  try {
    const { data } = await axios.post(`${env.aiServiceUrl}/predict`, payload, {
      timeout: 15000
    });
    return data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
    throw new Error(`AI service request failed (${status || 'no-status'}) at ${env.aiServiceUrl}/predict: ${detail}`);
  }
};
