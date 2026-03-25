import { api } from '../../lib/api.js';

export const createSOSRequest = async (payload) => {
  const { data } = await api.post('/sos', payload);
  return data.data;
};

export const updateSOSStatus = async (id, payload) => {
  const { data } = await api.patch(`/sos/${id}/status`, payload);
  return data.data;
};

export const listSOSRequests = async () => {
  const { data } = await api.get('/sos');
  return data.data;
};
