import mongoose from 'mongoose';

// Standalone MongoDB (common in small EC2 deployments) has no transactions.
// Callers must still perform compensating updates in that case.
export async function runDatabaseWork(work) {
  const topologyType = mongoose.connection.getClient().topology?.description?.type;
  if (topologyType === 'Single') return work(null);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } finally {
    await session.endSession();
  }
}
