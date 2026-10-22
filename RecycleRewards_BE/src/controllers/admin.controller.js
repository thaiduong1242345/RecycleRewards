import { Submission } from '../models/submission.model.js';
import { Transaction } from '../models/transaction.model.js';
import { User } from '../models/user.model.js';
import { runDatabaseWork } from '../services/database-transaction.service.js';

export async function getStatistics(_req, res) {
  const [totalUsers, [summary = {}]] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Submission.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalWasteKg: { $sum: '$weightKg' }, totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  res.json({ totalUsers, totalWasteKg: summary.totalWasteKg || 0, totalPoints: summary.totalPoints || 0 });
}

export async function listSubmissions(req, res) {
  const { status } = req.query;
  const items = await Submission.find(status ? { status } : {}).sort({ submittedAt: -1 });
  res.json(items.map((item) => item.toJSON()));
}

export async function reviewSubmission(req, res) {
  const { status, feedback } = req.body;
  const points = Number(req.body?.points);
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Trạng thái duyệt không hợp lệ.' });
  if (status === 'rejected' && !String(feedback || '').trim()) return res.status(400).json({ message: 'Cần nhập lý do từ chối.' });
  if (status === 'approved' && (!Number.isInteger(points) || points < 0)) return res.status(400).json({ message: 'Điểm thưởng phải là số nguyên không âm.' });

  let reviewed;
  await runDatabaseWork(async (session) => {
    const item = await Submission.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status, feedback: status === 'rejected' ? String(feedback).trim() : '', points: status === 'approved' ? points : 0, reviewedAt: new Date(), reviewedBy: req.user._id } },
      session ? { new: true, session } : { new: true },
    );
    if (!item) throw Object.assign(new Error('Không tìm thấy bài nộp hoặc bài đã được xử lý.'), { status: 404 });

    if (status === 'approved') {
      await Transaction.create([{ userId: item.userId, submissionId: item._id, type: 'submission_reward', points, description: 'Điểm thưởng vật phẩm tái chế', createdBy: req.user._id }], session ? { session } : undefined);
      await User.findByIdAndUpdate(item.userId, { $inc: { pointsBalance: points } }, session ? { session } : undefined);
    }
    reviewed = item;
  });
  res.json(reviewed.toJSON());
}

export async function revokeSubmission(req, res) {
  let revoked;
  await runDatabaseWork(async (session) => {
    const submissionQuery = Submission.findOne({ _id: req.params.id, status: 'approved' });
    if (session) submissionQuery.session(session);
    const item = await submissionQuery;
    if (!item) throw Object.assign(new Error('Chỉ có thể thu hồi bài đã được duyệt.'), { status: 404 });
    if (!item.userId) throw Object.assign(new Error('Bài nộp không liên kết với tài khoản người dùng.'), { status: 409 });

    const rewardQuery = Transaction.findOne({ submissionId: item._id, type: 'submission_reward' });
    if (session) rewardQuery.session(session);
    const reward = await rewardQuery;
    const points = Number(reward?.points ?? item.points ?? 0);
    if (!Number.isInteger(points) || points < 0) throw Object.assign(new Error('Số điểm của bài nộp không hợp lệ.'), { status: 409 });

    const reversal = {
      userId: item.userId,
      submissionId: item._id,
      type: 'reversal',
      points: -points,
      description: 'Thu hồi điểm thưởng vật phẩm tái chế',
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const reversalResult = await Transaction.collection.findOneAndUpdate(
      { submissionId: item._id, type: 'reversal' },
      { $setOnInsert: reversal },
      { upsert: true, returnDocument: 'after', includeResultMetadata: true, ...(session ? { session } : {}) },
    );
    if (reversalResult.lastErrorObject?.upserted) {
      const balanceUpdate = await User.updateOne(
        { _id: item.userId, pointsBalance: { $gte: points } },
        { $inc: { pointsBalance: -points } },
        session ? { session } : undefined,
      );
      if (balanceUpdate.modifiedCount === 0) {
        await User.findByIdAndUpdate(item.userId, { $set: { pointsBalance: 0 } }, session ? { session } : undefined);
      }
    }
    item.status = 'rejected';
    item.points = 0;
    item.feedback = 'Đã thu hồi lượt duyệt và điểm thưởng.';
    item.reviewedAt = new Date();
    item.reviewedBy = req.user._id;
    await item.save(session ? { session } : undefined);
    revoked = item;
  });
  res.json(revoked.toJSON());
}
