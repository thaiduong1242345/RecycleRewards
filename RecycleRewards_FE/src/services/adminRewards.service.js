const STORAGE_KEY = 'rr-admin-rewards';

const mockRewards = [
  { id: 'reward-1', name: 'Bình nước inox', description: 'Bình giữ nhiệt 500 ml, dùng nhiều lần thay chai nhựa.', points: 120, stock: 18, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=160&q=80', createdAt: '2025-04-18T08:40:00.000Z' },
  { id: 'reward-2', name: 'Túi vải Mầm Xanh', description: 'Túi vải canvas tiện dụng, in hình chương trình.', points: 80, stock: 32, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=160&q=80', createdAt: '2025-04-16T10:15:00.000Z' },
  { id: 'reward-3', name: 'Bộ bút chì tái chế', description: 'Bộ 6 bút chì làm từ giấy tái chế.', points: 55, stock: 24, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=160&q=80', createdAt: '2025-04-12T07:30:00.000Z' },
  { id: 'reward-4', name: 'Sổ tay giấy kraft', description: 'Sổ 80 trang giấy thân thiện môi trường.', points: 65, stock: 0, status: 'inactive', imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=160&q=80', createdAt: '2025-04-10T12:00:00.000Z' },
  { id: 'reward-5', name: 'Hộp cơm tiện lợi', description: 'Hộp đựng thức ăn có thể tái sử dụng, dung tích 700 ml.', points: 150, stock: 9, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=160&q=80', createdAt: '2025-04-08T09:25:00.000Z' },
  { id: 'reward-6', name: 'Cây sen đá mini', description: 'Chậu cây nhỏ trang trí bàn học.', points: 100, stock: 14, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=160&q=80', createdAt: '2025-04-04T06:50:00.000Z' },
];

function readRewards() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockRewards));
    return [...mockRewards];
  }
  const rewards = JSON.parse(stored);
  if (!Array.isArray(rewards)) throw new Error('Dữ liệu quà lưu trên thiết bị không hợp lệ.');
  return rewards;
}

function writeRewards(rewards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
}

export async function listRewards() {
  return readRewards();
}

export async function createReward(payload) {
  const rewards = readRewards();
  const reward = { ...payload, id: `reward-${Date.now()}`, createdAt: new Date().toISOString() };
  writeRewards([reward, ...rewards]);
  return reward;
}

export async function updateReward(id, payload) {
  const rewards = readRewards();
  const index = rewards.findIndex((reward) => reward.id === id);
  if (index === -1) throw new Error('Không tìm thấy quà cần cập nhật.');
  const updated = { ...rewards[index], ...payload, id };
  rewards[index] = updated;
  writeRewards(rewards);
  return updated;
}

export async function deleteReward(id) {
  const rewards = readRewards();
  if (!rewards.some((reward) => reward.id === id)) throw new Error('Không tìm thấy quà cần xóa.');
  writeRewards(rewards.filter((reward) => reward.id !== id));
}