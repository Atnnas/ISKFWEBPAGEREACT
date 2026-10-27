const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function runGrade8Demo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const kumaDojoId = new mongoose.Types.ObjectId('6a1142c0075d535604273fe6');
  const dojo = await mongoose.connection.collection('dojos').findOne({ _id: kumaDojoId });
  console.log('Dojo:', dojo?.name);

  // 1. Obtener temario oficial de Cinta Blanca
  const syllabus = await mongoose.connection.collection('ExamSyllabi').findOne({});
  if (!syllabus) {
    throw new Error('No se encontró temario en ExamSyllabi');
  }
  console.log('Syllabus cargado:', syllabus.name, 'targetRank:', syllabus.targetRank);

  // 2. Seleccionar 2 estudiantes de cinta blanca
  const studentIds = [
    '6adda0320d0f419dd6b90878', // Gabriel Rodriguez Sanchez
    '6adda0320d0f419dd6b90876'  // Sara Elizabeth Alfaro Cerdas
  ].map(id => new mongoose.Types.ObjectId(id));

  const students = await mongoose.connection.collection('Students').find({
    _id: { $in: studentIds }
  }).toArray();
  console.log(`Alumnos seleccionados (${students.length}):`);
  students.forEach(s => console.log(` - ${s.name} (${s.currentRank})`));

  await mongoose.connection.collection('Students').updateMany(
    { _id: { $in: studentIds } },
    { $set: { isReadyForExam: true, isPromotedForExam: true, targetRank: '9° Kyu (Cinta Amarilla)' } }
  );

  // 3. Limpiar convocatorias anteriores de Dojo Kuma para un escenario limpio
  const existingCalls = await mongoose.connection.collection('TechnicalExamCalls').find({ dojoId: kumaDojoId }).toArray();
  const existingCallIds = existingCalls.map(c => c._id);
  if (existingCallIds.length > 0) {
    await mongoose.connection.collection('TechnicalExamCalls').deleteMany({ _id: { $in: existingCallIds } });
    await mongoose.connection.collection('TechnicalExamEvaluations').deleteMany({ callId: { $in: existingCallIds } });
    await mongoose.connection.collection('TechnicalExamConsolidations').deleteMany({ dojoId: kumaDojoId });
    console.log(`Limpiadas ${existingCallIds.length} convocatorias previas de Dojo Kuma.`);
  }

  // 4. Configurar el Tribunal de 5 Senseis Evaluadores
  const evaluators = [
    {
      name: 'Sensei Roy Gatjens',
      email: 'senseiroykamae@hotmail.com',
      role: 'Jefe de Mesa (6° Dan ISKF)',
      token: `roy-${crypto.randomBytes(4).toString('hex')}`,
      hasWrittenNotes: true,
      gradeOffset: 0 // 80%
    },
    {
      name: 'Sensei Rooy Lee',
      email: 'kuroobicostarica@gmail.com',
      role: 'Sinodal 1',
      token: `rooy-${crypto.randomBytes(4).toString('hex')}`,
      hasWrittenNotes: false,
      gradeOffset: -1 // 79%
    },
    {
      name: 'Sensei David Artavia',
      email: 'artaviadavid@hotmail.com',
      role: 'Sinodal 2',
      token: `david-${crypto.randomBytes(4).toString('hex')}`,
      hasWrittenNotes: false,
      gradeOffset: 1 // 81%
    },
    {
      name: 'Sensei Eric Morales',
      email: 'ericmoralesiskf@gmail.com',
      role: 'Sinodal 3',
      token: `eric-${crypto.randomBytes(4).toString('hex')}`,
      hasWrittenNotes: false,
      gradeOffset: 0 // 80%
    },
    {
      name: 'Sensei Gerardo Pérez',
      email: 'gerardopereziskf@gmail.com',
      role: 'Sinodal 4',
      token: `gerardo-${crypto.randomBytes(4).toString('hex')}`,
      hasWrittenNotes: false,
      gradeOffset: 0 // 80%
    }
  ];

  // 5. Crear la nueva convocatoria oficial
  const callAccessToken = `kuma-5senseis-${crypto.randomBytes(3).toString('hex')}`;
  const callDoc = {
    title: 'Convocatoria Oficial de Examen Técnico — Tribunal 5 Sinodales ISKF',
    dojoId: kumaDojoId,
    dojoName: 'Dojo Kuma',
    dojoSensei: 'Sensei David Artavia',
    examDate: '2026-10-27',
    startTime: '09:00 AM',
    location: 'Dojo Kuma, Sede Central',
    accessToken: callAccessToken,
    status: 'cerrado', // Completado y oficializado
    closedAt: new Date(),
    closedForced: false,
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
    evaluators: evaluators.map(e => ({
      name: e.name,
      email: e.email,
      role: e.role,
      token: e.token
    })),
    schedules: [
      {
        blockName: 'Tanda 1',
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        targetRanks: ['10° Kyu (Cinta Blanca)'],
        studentIds: studentIds.map(id => id.toString())
      }
    ],
    notes: 'Examen oficial de pase de grado con tribunal colegiado de 5 sinodales. Alumnos aprobados con nota 80% (8.0 sobre 10).',
    createdBy: 'Comisión Técnica ISKF',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertCallRes = await mongoose.connection.collection('TechnicalExamCalls').insertOne(callDoc);
  const callId = insertCallRes.insertedId;
  console.log('Convocatoria creada ID:', callId.toString(), 'con 5 Senseis evaluadores.');

  // 6. Generar Calificaciones de los 5 Senseis para los 2 Alumnos (Promedio 80% exacto)
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

      // Base: exactamente 80% + offset del evaluador
      const basePercentage = 80 + ev.gradeOffset; // 80, 79, 81, 80, 80

      techList.forEach((t, tIdx) => {
        // Variación ligera por técnica (+1, -1, 0) manteniendo promedio
        const techVariation = (tIdx % 3 === 0 ? 0 : (tIdx % 3 === 1 ? -1 : 1));
        const techTarget = basePercentage + techVariation;

        const criteriaRatings = aspectIds.map((aspId, aIdx) => {
          const critScore = Math.min(100, Math.max(70, techTarget + (aIdx % 2 === 0 ? 1 : -1)));
          scores[`${t.id}_${aspId}`] = critScore;
          totalSum += critScore;
          totalCriteriaCount++;
          return {
            aspectId: aspId,
            score: critScore,
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

      const phaseNotes = ev.hasWrittenNotes
        ? {
            kihon: `* Corrección en postura básica (Zenkutsu Dachi): Estirar por completo la pierna trasera apoyando todo el talón en el suelo y flexionar bien la rodilla del frente.\n* Mano a la cintura (Hikite): Jalar con fuerza y rapidez la mano que no golpea hasta pegarla firmemente a la cintura sobre el cinturón.`,
            kata: `* Corrección en Kata (Heian Shodan): Mantener la mirada fija al frente tras cada giro, bajar bien las posiciones y evitar tocarse o acomodarse el uniforme durante la ejecución.`,
            kumite: `* Corrección en Combate (Gohon Kumite): Mantener la distancia de seguridad con el compañero y no bajar las manos de defensa tras bloquear.`
          }
        : {
            kihon: '',
            kata: '',
            kumite: ''
          };

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
        phaseNotes,
        evaluatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await mongoose.connection.collection('TechnicalExamEvaluations').insertOne(evalDoc);
    }
  }

  console.log('Evaluaciones guardadas por los 5 evaluadores para los 2 aspirantes.');

  // 7. Consolidar Dictamen Oficial Colegiado para ambos alumnos con nota 80%
  for (const student of students) {
    const aiSummary = [
      `* Corrección en Kata (Heian Shodan): Mantener la mirada fija al frente tras cada giro, bajar bien las posiciones y evitar tocarse o acomodarse el uniforme durante la ejecución.`,
      `* Corrección de postura básica (Zenkutsu Dachi): Estirar por completo la pierna trasera apoyando todo el talón en el suelo y flexionar bien la rodilla del frente.`,
      `* Mano a la cintura (Hikite): Jalar con fuerza y rapidez la mano que no golpea hasta pegarla firmemente a la cintura sobre el cinturón.`,
      `* Corrección en Combate (Gohon Kumite): Mantener la distancia de seguridad con el compañero y no bajar las manos de defensa tras bloquear.`,
      `* ¿Qué faltó para alcanzar la nota máxima (10 de 10)?: Con una nota de 80%, para sacar un 10 perfecto faltó: bajar más el centro del cuerpo y asentar los pies, fijar firmemente la mano a la cintura, poner más fuerza y concentración en el golpe final (Kime).`,
      `* Aspectos aprobados demostrados: muy buen saludo, respeto y disciplina dentro del tatami.`
    ].join('\n');

    const consolidationDoc = {
      callId: callId,
      dojoId: kumaDojoId,
      dojoName: 'Dojo Kuma',
      studentId: student._id,
      studentName: student.name,
      studentRank: '10° Kyu (Cinta Blanca)',
      targetRank: '9° Kyu (Cinta Amarilla)',
      promotedRank: '9° Kyu (Cinta Amarilla)',
      syllabusId: syllabus._id.toString(),
      syllabusName: syllabus.name,
      finalGrade: 80,
      overallPercentage: 80,
      isPassed: true,
      officialVerdict: 'Aprobado',
      evaluators: evaluators.map(e => ({
        name: e.name,
        role: e.role,
        percentage: 80 + e.gradeOffset,
        isPassed: true
      })),
      evaluatorCount: 5,
      aiConsolidatedSummary: aiSummary,
      aiAnalysis: aiSummary,
      observations: 'Aprobado raspando con nota 80 (8 de 10). Aplicar de inmediato las correcciones técnicas señaladas en el dojo.',
      status: 'oficializado',
      certificateIssued: true,
      consolidatedBy: 'Comisión Técnica ISKF',
      consolidatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.collection('TechnicalExamConsolidations').insertOne(consolidationDoc);
    console.log(`Consolidación oficializada para ${student.name} con nota 80%.`);
  }

  console.log('¡Demo completada con éxito!');
  await mongoose.disconnect();
}

runGrade8Demo().catch(console.error);
