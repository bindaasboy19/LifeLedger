import { api } from '../../lib/api.js';

export const listCamps = async (params = {}) => {
  const { data } = await api.get('/camps', { params });
  return data.data;
};

export const createCamp = async (payload) => {
  const { data } = await api.post('/camps', payload);
  return data.data;
};

export const applyForCamp = async (campId, payload = {}) => {
  const { data } = await api.post(`/camps/${campId}/applications`, payload);
  return data.data;
};

export const listMyCampApplications = async () => {
  const { data } = await api.get('/camps/applications/me');
  return data.data;
};

export const listCampApplications = async (campId) => {
  const { data } = await api.get(`/camps/${campId}/applications`);
  return data.data;
};

export const updateCampApplication = async (campId, applicationId, payload) => {
  const { data } = await api.patch(`/camps/${campId}/applications/${applicationId}`, payload);
  return data.data;
};

export const listDonorRegistry = async (params = {}) => {
  const { data } = await api.get('/donor/registry', { params });
  return data.data;
};

export const listDonationCertificates = async (uid) => {
  const { data } = await api.get(uid ? `/donor/certificates/${uid}` : '/donor/certificates');
  return data.data;
};
