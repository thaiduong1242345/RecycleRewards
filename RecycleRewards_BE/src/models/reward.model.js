import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', trim: true, maxlength: 240 },
  points: { type: Number, required: true, min: 1 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  imageUrl: { type: String, default: '', trim: true, maxlength: 2048 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; } },
});

rewardSchema.index({ status: 1, stock: 1, createdAt: -1 });
export const Reward = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);
