import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
	// The unique sparse index is declared below. Do not set `sparse` here as
	// well: Mongoose would generate a second, non-unique index with the same
	// key/name and the application would fail while starting.
	redemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Redemption' },
	type: { type: String, enum: ['submission_reward', 'adjustment', 'reversal', 'reward_redemption'], required: true },
	points: { type: Number, required: true },
	description: { type: String, default: '' },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Only submission rewards/reversals participate in this unique constraint.
// Redemption transactions have no submissionId and must not collide on null.
transactionSchema.index(
	{ submissionId: 1, type: 1 },
	{ unique: true, partialFilterExpression: { submissionId: { $exists: true } } },
);
transactionSchema.index({ redemptionId: 1 }, { unique: true, sparse: true });
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
