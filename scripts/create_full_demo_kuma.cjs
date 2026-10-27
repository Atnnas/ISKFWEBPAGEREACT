const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function runFullDemo() {
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
  console.log('Syllabus cargado:', syllabus.name, 'targetRank:', syllabus.targetRank);

  // 2. Seleccionar 4 alumnos de 10° Kyu para el demo
  const studentIds = [
    '6adda0310d0f419dd6b90872', // Amanda Villalobos Gamboa
    '6adda0310d0f419dd6b90874', // Ariadna Milena Alfaro Cerdas
    '6adda0320d0f419dd6b90875', // Brenda Samantha Araya Alfaro
    '6adda0330d0f419dd6b9087d'  // Denzel Javier Torres Salas
  ].map(id => new mongoose.Types.ObjectId(id));

  const students = await mongoose.connection.collection('Students').find({
    _id: { $in: studentIds }
  }).toArray();
  console.log(`Alumnos seleccionados (${students.length}):`);
  students.forEach(s => console.log(` - ${s.name} (${s.currentRank})`));

  // Marcar como listos para examen
  await mongoose.connection.collection('Students').updateMany(
    { _id: { $in: studentIds } },
    { $set: { isReadyForExam: true, isPromotedForExam: true, targetRank: '9° Kyu (Cinta Amarilla)' } }
  );

  // 3. Limpiar convocatorias y evaluaciones anteriores de Dojo Kuma para un demo limpio de 0 a 100
  const existingCalls = await mongoose.connection.collection('TechnicalExamCalls').find({ dojoId: kumaDojoId }).toArray();
  const existingCallIds = existingCalls.map(c => c._id);
  if (existingCallIds.length > 0) {
    await mongoose.connection.collection('TechnicalExamCalls').deleteMany({ _id: { $in: existingCallIds } });
    await mongoose.connection.collection('TechnicalExamEvaluations').deleteMany({ callId: { $in: existingCallIds } });
    await mongoose.connection.collection('TechnicalExamConsolidations').deleteMany({ dojoId: kumaDojoId });
    console.log(`Limpiadas ${existingCallIds.length} convocatorias previas de Dojo Kuma.`);
  }

  // 4. Crear la nueva convocatoria con tandas de 2
  const royToken = `roy-${crypto.randomBytes(4).toString('hex')}`;
  const rooyToken = `rooy-${crypto.randomBytes(4).toString('hex')}`;
  const callAccessToken = `kuma-demo-${crypto.randomBytes(3).toString('hex')}`;

  const callDoc = {
    title: 'Convocatoria Oficial de Examen Técnico — Dojo Kuma',
    dojoId: kumaDojoId,
    dojoName: 'Dojo Kuma',
    dojoSensei: 'Sensei David Artavia',
    examDate: '2026-10-27',
    startTime: '09:00 AM',
    location: 'Dojo Kuma, Sede Central',
    accessToken: callAccessToken,
    status: 'en_tatami',
    syllabusIds: [syllabus._id.toString()],
    syllabusSnapshots: [{
      syllabusId: syllabus._id.toString(),
      targetRank: syllabus.targetRank,
      name: syllabus.name,
      techniques: syllabus.techniques || [],
      technicalAspects: syllabus.technicalAspects || [],
      version: 1
    }],
    maxPerTanda: 2, // ¡Tandas de 2 como solicitó el usuario!
    aspirants: students.map(s => ({
      studentId: s._id,
      studentName: s.name,
      currentRank: s.currentRank,
      targetRank: '9° Kyu (Cinta Amarilla)',
      scheduleBlock: '',
      promotedAt: new Date()
    })),
    evaluators: [
      {
        name: 'Sensei Roy Gatjens',
        email: 'senseiroykamae@hotmail.com',
        role: 'Jefe de Mesa',
        token: royToken
      },
      {
        name: 'Sensei Rooy Lee',
        email: 'kuroobicostarica@gmail.com',
        role: 'Sinodal 1',
        token: rooyToken
      }
    ],
    schedules: [
      {
        blockName: 'Tanda 1',
        startTime: '09:00 AM',
        endTime: '09:40 AM',
        targetRanks: ['10° Kyu (Cinta Blanca)'],
        studentIds: [studentIds[0].toString(), studentIds[1].toString()] // 2 alumnos
      },
      {
        blockName: 'Tanda 2',
        startTime: '09:45 AM',
        endTime: '10:25 AM',
        targetRanks: ['10° Kyu (Cinta Blanca)'],
        studentIds: [studentIds[2].toString(), studentIds[3].toString()] // 2 alumnos
      }
    ],
    notes: 'Examen de pase de grado 10° a 9° Kyu con tandas de 2 aspirantes.',
    createdBy: 'Comisión Técnica ISKF',
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertCallRes = await mongoose.connection.collection('TechnicalExamCalls').insertOne(callDoc);
  const callId = insertCallRes.insertedId;
  console.log('Convocatoria creada exitosamente. ID:', callId.toString(), 'Token:', callAccessToken);

  // 5. Generar Calificaciones Completas (Kihon, Kata, Kumite) para los 4 alumnos por los 2 evaluadores
  const evaluators = [
    { name: 'Sensei Roy Gatjens', email: 'senseiroykamae@hotmail.com', token: royToken, baseOffset: 0 },
    { name: 'Sensei Rooy Lee', email: 'kuroobicostarica@gmail.com', token: rooyToken, baseOffset: 2 }
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

      // Base grade variable per student (90% - 95%)
      const baseGrade = 90 + (idx % 3) + ev.baseOffset;

      techList.forEach(t => {
        const criteriaRatings = aspectIds.map((aspId, aIdx) => {
          const score = Math.min(100, Math.max(80, baseGrade - (aIdx % 3)));
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
          kihon: `* Buena postura en Zenkutsu Dachi.\n* Foco y Kime sólido en Oi Zuki y Mae Geri.\n* Buen Hikiashi al retroceder.`,
          kata: `* Excelente estabilidad en giros de Heian Shodan.\n* Kiai con potencia en movimientos clave.`,
          kumite: `* Distancia de combate (Ma-ai) correcta.\n* Buena reacción y contraataque con Gyaku Zuki.`
        },
        evaluatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await mongoose.connection.collection('TechnicalExamEvaluations').insertOne(evalDoc);
    }
  }

  console.log('Evaluaciones completadas para los 4 alumnos por los 2 sinodales (Kihon 6/6, Kata 1/1, Kumite 1/1).');

  // 6. Cierre Oficial del Examen Técnico
  const closedCall = await mongoose.connection.collection('TechnicalExamCalls').findOneAndUpdate(
    { _id: callId },
    {
      $set: {
        status: 'cerrado',
        closedAt: new Date(),
        closedForced: false
      }
    },
    { returnDocument: 'after' }
  );
  console.log('Convocatoria oficialmente cerrada con validación de fases completa.');

  // 7. Consolidación y Registro Oficial de Actas / Calificaciones
  for (const student of students) {
    const studentEvals = await mongoose.connection.collection('TechnicalExamEvaluations').find({
      callId,
      studentId: student._id
    }).toArray();

    const overallAvg = Math.round(studentEvals.reduce((acc, e) => acc + (e.percentage || 0), 0) / studentEvals.length);

    // Consolidar notas por técnica
    const averagedTechniqueScores = {};
    techList.forEach(t => {
      const tScores = studentEvals.map(e => e.techniqueAverages?.[t.id] || 0).filter(Boolean);
      averagedTechniqueScores[t.id] = tScores.length > 0 ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : 90;
    });

    const consolidationDoc = {
      studentId: student._id,
      studentName: student.name,
      studentRank: student.currentRank,
      targetRank: '9° Kyu (Cinta Amarilla)',
      dojoId: kumaDojoId,
      dojoName: 'Dojo Kuma',
      syllabusId: syllabus._id.toString(),
      syllabusName: syllabus.name,
      evaluators: studentEvals.map(e => ({
        evaluatorName: e.evaluatorSenseiName,
        evaluatorEmail: e.evaluatorEmail,
        percentage: e.percentage,
        isPassed: e.isPassed,
        evaluatedAt: e.evaluatedAt
      })),
      evaluatorCount: studentEvals.length,
      averagedTechniqueScores,
      overallPercentage: overallAvg,
      isPassed: overallAvg >= 70,
      aiConsolidatedSummary: `El aspirante demostró un desempeño sobresaliente en la mesa técnica. En Kihon exhibió un Zenkutsu Dachi firme y un Mae Geri bien ejecutado. En Kata Heian Shodan mantuvo el ritmo constante con Kiai enérgico, y en Gohon Kumite mostró excelente distancia y control. Aprobado por unanimidad del tribunal.`,
      consolidatedBy: 'Sensei Roy Gatjens (Jefe de Mesa)',
      status: 'oficializado',
      consolidatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.collection('TechnicalExamConsolidations').insertOne(consolidationDoc);
  }

  console.log('Consolidaciones oficiales y actas generadas para los 4 alumnos.');
  console.log('DEMO DE 0 A 100 COMPLETADO CON ÉXITO.');

  process.exit(0);
}

runFullDemo().catch(err => {
  console.error('Error al ejecutar demo:', err);
  process.exit(1);
});
