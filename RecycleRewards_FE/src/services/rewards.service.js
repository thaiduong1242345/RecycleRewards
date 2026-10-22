import { request } from './api.js';

export const rewardsService = {
  list: () => request('/rewards', { role: 'student' }),
  redeem: (id) => request(`/rewards/${encodeURIComponent(id)}/redeem`, { method: 'POST', role: 'student' }),
  mine: () => request('/rewards/redemptions/mine', { role: 'student' }),
};
