const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function createTwoStudentsKumaDemo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const kumaDojoId = new mongoose.Types.ObjectId('6a1142c0075d535604273fe6');
  const dojo = await mongoose.connection.collection('dojos').findOne({ _id: kumaDojoId });
  console.log('Dojo:', dojo?.name);

  // 1. Obtener temario oficial de Cinta Blanca
  const syllabus = await mongoose.connection.collection('ExamSyllabi').findOne({});
  if (!syllabus) {
    throw new Error('No se encontró temario en ExamSyllabi');
  }
  console.log('Syllabus:', syllabus.name, '->', syllabus.targetRank);

  // 2. Seleccionar exactamente 2 alumnos de Dojo Kuma
  const studentIds = [
    '6adda0310d0f419dd6b90872', // Amanda Villalobos Gamboa
    '6adda0310d0f419dd6b90874'  // Ariadna Milena Alfaro Cerdas
  ].map(id => new mongoose.Types.ObjectId(id));

  const students = await mongoose.connection.collection('Students').find({
    _id: { $in: studentIds }
  }).toArray();
  console.log(`2 Alumnos seleccionados:`);
  students.forEach(s => console.log(` - ${s.name} (${s.currentRank})`));

  // Actualizar banderas en Students
  await mongoose.connection.collection('Students').updateMany(
    { _id: { $in: studentIds } },
    { $set: { isReadyForExam: true, isPromotedForExam: true, targetRank: '9° Kyu (Cinta Amarilla)' } }
  );

  // 3. Tokens únicos para la nueva convocatoria
  const royToken = `roy-${crypto.randomBytes(4).toString('hex')}`;
  const rooyToken = `rooy-${crypto.randomBytes(4).toString('hex')}`;
  const callAccessToken = `kuma-2k-${crypto.randomBytes(3).toString('hex')}`;

  const callDoc = {
    title: 'Examen de Grado ISKF — Dojo Kuma (2 Aspirantes)',
    dojoId: kumaDojoId,
    dojoName: 'Dojo Kuma',
    dojoSensei: 'Sensei David Artavia',
    examDate: '2026-10-27',
    startTime: '10:00 AM',
    location: 'Dojo Kuma - Tatami Principal',
    accessToken: callAccessToken,
    status: 'cerrado', // Completado para ver todo de 0 a 100 hasta el final
    syllabusIds: [syllabus._id.toString()],
    syllabusSnapshots: [{
      syllabusId: syllabus._id.toString(),
      targetRank: syllabus.targetRank,
      name: syllabus.name,
      techniques: syllabus.techniques || [],
      technicalAspects: syllabus.technicalAspects || [],
      version: 1
    }],
    maxPerTanda: 2,
    aspirants: students.map(s => ({
      studentId: s._id,
      studentName: s.name,
      currentRank: s.currentRank,
      targetRank: '9° Kyu (Cinta Amarilla)',
      scheduleBlock: 'Tanda 1',
      promotedAt: new Date()
    })),
    evaluators: [
      {
        senseiName: 'Sensei Roy Gatjens',
        name: 'Sensei Roy Gatjens',
        email: 'senseiroykamae@hotmail.com',
        role: 'Jefe de Mesa',
        token: royToken
      },
      {
        senseiName: 'Sensei Rooy Lee',
        name: 'Sensei Rooy Lee',
        email: 'kuroobicostarica@gmail.com',
        role: 'Sinodal 1',
        token: rooyToken
      }
    ],
    schedules: [
      {
        blockName: 'Tanda 1',
        startTime: '10:00 AM',
        endTime: '10:45 AM',
        targetRanks: ['10° Kyu (Cinta Blanca)'],
        studentIds: [studentIds[0].toString(), studentIds[1].toString()]
      }
    ],
    notes: 'Convocatoria oficial con 2 karatecas de Dojo Kuma. Evaluación completa de Kihon, Kata y Kumite.',
    createdBy: 'Comisión Técnica ISKF',
    closedAt: new Date(),
    closedForced: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertCallRes = await mongoose.connection.collection('TechnicalExamCalls').insertOne(callDoc);
  const callId = insertCallRes.insertedId;
  console.log('\n=============================================');
  console.log('NUEVA CONVOCATORIA CREADA:');
  console.log('ID:', callId.toString());
  console.log('Token de Convocatoria:', callAccessToken);
  console.log('URL Convocatoria:', `http://localhost:3000/convocatoria/${callAccessToken}`);
  console.log('URL Sensei Roy Gatjens:', `http://localhost:3000/evaluar/${callAccessToken}/${royToken}`);
  console.log('URL Sensei Rooy Lee:', `http://localhost:3000/evaluar/${callAccessToken}/${rooyToken}`);
  console.log('=============================================\n');

  // 4. Calificaciones por los dos sinodales para los 2 alumnos
  const evaluators = [
    { name: 'Sensei Roy Gatjens', email: 'senseiroykamae@hotmail.com', token: royToken, baseOffset: 0 },
    { name: 'Sensei Rooy Lee', email: 'kuroobicostarica@gmail.com', token: rooyToken, baseOffset: 3 }
  ];

  const aspectIds = (syllabus.technicalAspects || []).map(a => a.id);
  const techList = syllabus.techniques || [];

  for (const ev of evaluators) {
    for (let idx = 0; idx < students.length; idx++) {
      const student = students[idx];
      const grades = [];
      const scores = {};
      const techniqueAverages = {};
      let totalSum = 0;
      let totalCriteriaCount = 0;

      const baseGrade = 91 + (idx * 2) + ev.baseOffset;

      techList.forEach(t => {
        const criteriaRatings = aspectIds.map((aspId, aIdx) => {
          const score = Math.min(100, Math.max(82, baseGrade - (aIdx % 3)));
          scores[`${t.id}_${aspId}`] = score;
          totalSum += score;
          totalCriteriaCount++;
          return {
            aspectId: aspId,
            score,
            weight: 1
          };
        });

        const techAvg = Math.round(criteriaRatings.reduce((acc, c) => acc + c.score, 0) / criteriaRatings.length);
        techniqueAverages[t.id] = techAvg;

        grades.push({
          techniqueId: t.id,
          techniqueName: t.name,
          phase: t.group || t.phase || 'kihon',
          techniqueGroup: t.group || t.phase || 'kihon',
          average: techAvg,
          criteriaRatings,
          evaluatedAt: new Date()
        });
      });

      const overallPercentage = Math.round(totalSum / totalCriteriaCount);

      const evalDoc = {
        callId: callId,
        dojoId: kumaDojoId,
        dojoName: 'Dojo Kuma',
        studentId: student._id,
        studentName: student.name,
        evaluatorName: ev.name,
        evaluatorSenseiName: ev.name,
        evaluatorEmail: ev.email,
        evaluatorToken: ev.token,
        syllabusId: syllabus._id.toString(),
        targetRank: '9° Kyu (Cinta Amarilla)',
        grades,
        scores,
        techniqueAverages,
        percentage: overallPercentage,
        isPassed: overallPercentage >= 70,
        phaseNotes: {
          kihon: `* Postura en Zenkutsu Dachi correcta y firme.\n* Kime y velocidad notables en Oi Zuki.\n* Centro de gravedad bajo y estable.`,
          kata: `* Giros fluidos y precisos en Heian Shodan.\n* Kiai con determinación en el décimo movimiento.`,
          kumite: `* Buen manejo de la distancia de combate (Ma-ai).\n* Anticipación adecuada y bloqueo seguro.`
        },
        evaluatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await mongoose.connection.collection('TechnicalExamEvaluations').insertOne(evalDoc);
      console.log(`Evaluación guardada: ${student.name} evaluado por ${ev.name} (${overallPercentage}%)`);
    }
  }

  // 5. Consolidaciones oficiales de veredicto para los 2 alumnos
  for (let idx = 0; idx < students.length; idx++) {
    const student = students[idx];
    const finalGrade = idx === 0 ? 94 : 96;

    const consDoc = {
      callId: callId,
      studentId: student._id,
      dojoId: kumaDojoId,
      finalScore: finalGrade,
      finalGrade: finalGrade,
      status: 'passed',
      officialVerdict: 'Aprobado con Distinción',
      isPassed: true,
      promotedRank: '9° Kyu (Cinta Amarilla)',
      observations: `Desempeño técnico sobresaliente en la tanda de 2 alumnos. Ambos evaluadores concuerdan en excelente actitud, disciplina y solidez técnica.`,
      aiAnalysis: `El aspirante demostró un control excepcional en Kihon con técnicas limpias y fluidas. En Kata Heian Shodan mantuvo un ritmo impecable con kime evidente en las transiciones. En Kumite evidenció madurez táctica y respeto riguroso al dojo kun. Recomendación: Aprobado para 9° Kyu con honores.`,
      evaluatorsCount: 2,
      certificateIssued: false,
      consolidatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.collection('TechnicalExamConsolidations').insertOne(consDoc);
    console.log(`Consolidación final registrada para: ${student.name} con nota ${finalGrade}%`);
  }

  console.log('\nTODO EL PROCESO DE 0 A 100 HA SIDO COMPLETADO CON ÉXITO.');
  process.exit(0);
}

createTwoStudentsKumaDemo().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
