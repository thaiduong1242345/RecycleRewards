import mongoose from 'mongoose';

export async function connectDatabase() {
	const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/recycle_rewards');
	if (!uri) throw new Error('Thiếu MONGODB_URI để kết nối MongoDB.');
	try {
		await mongoose.connect(uri);
	} catch (error) {
		throw new Error(`Không thể kết nối MongoDB: ${error.message}`);
	}
	console.log('MongoDB connected..');
	// Existing deployments created a non-partial unique `{submissionId,type}`
	// index. Migrate it once so many reward-redemption records with no
	// submissionId can coexist. A fresh database lets Mongoose create indexes.
	const hasTransactions = await mongoose.connection.db.listCollections({ name: 'transactions' }).hasNext();
	if (hasTransactions) {
		const transactions = mongoose.connection.collection('transactions');
		const indexes = await transactions.indexes();
		const legacyIndex = indexes.find((index) => index.name === 'submissionId_1_type_1' && !index.partialFilterExpression);
		if (legacyIndex) await transactions.dropIndex(legacyIndex.name);
		// A first deployment may have created `redemptionId_1` as a non-unique
		// sparse index from the field definition. MongoDB cannot replace it with
		// a unique index under the same name, so upgrade it explicitly once.
		const redemptionIndex = indexes.find((index) => index.name === 'redemptionId_1');
		if (redemptionIndex && (!redemptionIndex.unique || !redemptionIndex.sparse)) {
			await transactions.dropIndex(redemptionIndex.name);
		}
		await transactions.createIndex(
			{ submissionId: 1, type: 1 },
			{ unique: true, partialFilterExpression: { submissionId: { $exists: true } }, name: 'submissionId_1_type_1' },
		);
		await transactions.createIndex({ redemptionId: 1 }, { unique: true, sparse: true, name: 'redemptionId_1' });
	}
}

export function databaseState() {
	return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
