import { Reward } from '../models/reward.model.js';
import { Redemption } from '../models/redemption.model.js';
import { Transaction } from '../models/transaction.model.js';
import { User } from '../models/user.model.js';
import { runDatabaseWork } from '../services/database-transaction.service.js';

function rewardPayload(body = {}) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const imageUrl = String(body.imageUrl || '').trim();
  const points = Number(body.points);
  const stock = Number(body.stock);
  const status = body.status || 'active';
  if (!name || name.length > 80) throw Object.assign(new Error('Tên quà là bắt buộc và tối đa 80 ký tự.'), { status: 400 });
  if (!Number.isInteger(points) || points < 1) throw Object.assign(new Error('Điểm đổi phải là số nguyên dương.'), { status: 400 });
  if (!Number.isInteger(stock) || stock < 0) throw Object.assign(new Error('Tồn kho phải là số nguyên không âm.'), { status: 400 });
  if (!['active', 'inactive'].includes(status)) throw Object.assign(new Error('Trạng thái quà không hợp lệ.'), { status: 400 });
  return { name, description, imageUrl, points, stock, status };
}

export async function listRewards(req, res) {
  const filter = req.user.role === 'admin' ? {} : { status: 'active', stock: { $gt: 0 } };
  const rewards = await Reward.find(filter).sort({ createdAt: -1 });
  res.json(rewards.map((reward) => reward.toJSON()));
}

export async function createReward(req, res) {
  const reward = await Reward.create({ ...rewardPayload(req.body), createdBy: req.user._id });
  res.status(201).json(reward.toJSON());
}

export async function updateReward(req, res) {
  const reward = await Reward.findByIdAndUpdate(req.params.id, { $set: rewardPayload(req.body) }, { new: true, runValidators: true });
  if (!reward) return res.status(404).json({ message: 'Không tìm thấy quà.' });
  res.json(reward.toJSON());
}

export async function deleteReward(req, res) {
  const reward = await Reward.findByIdAndDelete(req.params.id);
  if (!reward) return res.status(404).json({ message: 'Không tìm thấy quà.' });
  res.status(204).end();
}

export async function redeemReward(req, res) {
  let redemption;
  await runDatabaseWork(async (session) => {
    const queryOptions = session ? { new: true, session } : { new: true };
    const reward = await Reward.findOneAndUpdate(
      { _id: req.params.id, status: 'active', stock: { $gt: 0 } },
      { $inc: { stock: -1 } },
      queryOptions,
    );
    if (!reward) throw Object.assign(new Error('Quà không còn khả dụng hoặc đã hết hàng.'), { status: 409 });

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, pointsBalance: { $gte: reward.points } },
      { $inc: { pointsBalance: -reward.points } },
      queryOptions,
    );
    if (!user) {
      // Required when MongoDB is standalone and cannot roll the stock back.
      await Reward.updateOne({ _id: reward._id }, { $inc: { stock: 1 } }, session ? { session } : undefined);
      throw Object.assign(new Error('Bạn không đủ điểm để đổi quà này.'), { status: 409 });
    }

    redemption = await Redemption.create([{
      userId: user._id, rewardId: reward._id, rewardName: reward.name, points: reward.points,
    }], session ? { session } : undefined).then(([item]) => item);
    await Transaction.create([{
      userId: user._id,
      redemptionId: redemption._id,
      type: 'reward_redemption',
      points: -reward.points,
      description: `Đổi quà: ${reward.name}`,
      createdBy: user._id,
    }], session ? { session } : undefined);
  });
  res.status(201).json({ redemption: redemption.toJSON(), pointsBalance: req.user.pointsBalance - redemption.points });
}

export async function listMyRedemptions(req, res) {
  const items = await Redemption.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(items.map((item) => item.toJSON()));
}
