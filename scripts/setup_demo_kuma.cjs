const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const kumaDojoId = new mongoose.Types.ObjectId('6a1142c0075d535604273fe6');
  const dojo = await mongoose.connection.collection('dojos').findOne({ _id: kumaDojoId });
  console.log('Dojo:', dojo?.name, 'Sensei:', dojo?.instructor);

  const students = await mongoose.connection.collection('Students').find({ dojoId: kumaDojoId }).toArray();
  console.log(`Total students for Dojo Kuma: ${students.length}`);
  students.forEach((s, idx) => {
    console.log(`[${idx}] ${s._id} | ${s.name} | Rank: ${s.currentRank} | Ready: ${s.isReadyForExam}`);
  });

  const syllabi = await mongoose.connection.collection('ExamSyllabi').find({}).toArray();
  console.log(`Total ExamSyllabi in DB: ${syllabi.length}`);
  syllabi.forEach(s => console.log(` - Syllabus: ${s.targetRank} (${s.name}) - techniques: ${s.techniques?.length}`));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
