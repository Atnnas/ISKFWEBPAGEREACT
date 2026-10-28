const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const calls = await db.collection('TechnicalExamCalls').find({}).toArray();
  const call = calls[calls.length - 1];
  console.log('Call ID:', call._id.toString());
  console.log('Call title:', call.title);
  console.log('Status:', call.status);
  console.log('Evaluators count:', call.evaluators?.length);
  
  const consolidations = await db.collection('TechnicalExamConsolidations').find({ callId: call._id }).toArray();
  for (const c of consolidations) {
    const student = await db.collection('Students').findOne({ _id: c.studentId });
    console.log('\n=========================================');
    console.log('ALUMNO:', student ? student.name : c.studentId);
    console.log('Nota Final / Porcentaje:', (c.overallPercentage || c.finalGrade) + '%', '| Aprobado:', c.isPassed, '| Veredicto:', c.officialVerdict);
    console.log('Rango Promovido:', c.promotedRank || c.targetRank);
    console.log('Evaluadores en acta:', c.evaluators?.map(e => `${e.name}: ${e.percentage}%`).join(', '));
    console.log('\nDictamen Colegiado (Consenso Oficial del Tribunal):');
    console.log(c.aiConsolidatedSummary);
  }

  const evals = await db.collection('TechnicalExamEvaluations').find({ callId: call._id }).toArray();
  console.log('\nTotal Evaluaciones registradas (5 evaluadores x 2 alumnos):', evals.length);
  
  console.log('\n--- EVALUACIONES Y COMENTARIOS PERSONALES POR SENSEI ---');
  evals.forEach(ev => {
    console.log(`\n• [${ev.evaluatorName}] (${ev.evaluatorRole || 'Sinodal'}) -> ${ev.studentName} | Calificación: ${ev.percentage}%`);
    console.log(`   - Kihon: "${ev.phaseNotes?.kihon}"`);
    console.log(`   - Kata:  "${ev.phaseNotes?.kata}"`);
    console.log(`   - Kumite:"${ev.phaseNotes?.kumite}"`);
  });

  process.exit(0);
}
verify();
