import { request } from './api.js';

// Admin CRUD persists in MongoDB instead of browser localStorage.
export const listRewards = () => request('/rewards', { role: 'admin' });
export const createReward = (payload) => request('/rewards', { method: 'POST', body: payload, role: 'admin' });
export const updateReward = (id, payload) => request(`/rewards/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, role: 'admin' });
export const deleteReward = (id) => request(`/rewards/${encodeURIComponent(id)}`, { method: 'DELETE', role: 'admin' });
