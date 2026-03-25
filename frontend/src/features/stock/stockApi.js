import { api } from '../../lib/api.js';

export const listStockItems = async () => {
  const { data } = await api.get('/stock');
  return data.data;
};

export const createStockItem = async (payload) => {
  const { data } = await api.post('/stock', payload);
  return data.data;
};

export const updateStockItem = async (id, payload) => {
  const { data } = await api.patch(`/stock/${id}`, payload);
  return data.data;
};

export const deleteStockItem = async (id) => {
  const { data } = await api.delete(`/stock/${id}`);
  return data;
};

export const searchStock = async (params) => {
  const { data } = await api.get('/stock/search', { params });
  return data.data;
};

export const listStockFlowEvents = async () => {
  const { data } = await api.get('/stock/flow');
  return data.data;
};
