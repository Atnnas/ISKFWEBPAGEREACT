import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import TechnicalExamEvaluation from '../src/models/TechnicalExamEvaluation.js';

async function listAllEvals() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await TechnicalExamEvaluation.countDocuments({});
  console.log('Total documents in TechnicalExamEvaluation collection:', count);

  const all = await TechnicalExamEvaluation.find({}).lean();
  all.forEach((e, i) => {
    console.log(`[${i + 1}] Evaluator: ${e.evaluatorName} (${e.evaluatorEmail}) | Student: ${e.studentName} | CallId: ${e.callId} | Updated: ${e.updatedAt} | Scores: ${Object.keys(e.scores || {}).length} | Pct: ${e.percentage}%`);
  });

  await mongoose.disconnect();
}

listAllEvals().catch(console.error);
