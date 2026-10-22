import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  rewardName: { type: String, required: true, trim: true },
  points: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['requested', 'fulfilled', 'cancelled'], default: 'requested' },
}, {
  timestamps: true,
  toJSON: { transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; } },
});

redemptionSchema.index({ userId: 1, createdAt: -1 });
export const Redemption = mongoose.models.Redemption || mongoose.model('Redemption', redemptionSchema);
