import { api } from '../../lib/api.js';

export const listCamps = async (params = {}) => {
  const { data } = await api.get('/camps', { params });
  return data.data;
};

export const createCamp = async (payload) => {
  const { data } = await api.post('/camps', payload);
  return data.data;
};
