const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function createFiveSenseisKumaDemo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const kumaDojoId = new mongoose.Types.ObjectId('6a1142c0075d535604273fe6');
  const dojo = await mongoose.connection.collection('dojos').findOne({ _id: kumaDojoId });
  console.log('Dojo:', dojo?.name);

  // 1. Temario oficial
  const syllabus = await mongoose.connection.collection('ExamSyllabi').findOne({});
  if (!syllabus) throw new Error('No syllabus found');

  // 2. Alumnos de Dojo Kuma (Amanda y Ariadna)
  const studentIds = [
    '6adda0310d0f419dd6b90872', // Amanda Villalobos Gamboa
    '6adda0310d0f419dd6b90874'  // Ariadna Milena Alfaro Cerdas
  ].map(id => new mongoose.Types.ObjectId(id));

  const students = await mongoose.connection.collection('Students').find({
    _id: { $in: studentIds }
  }).toArray();
  console.log(`2 Alumnos seleccionados:`, students.map(s => s.name));

  await mongoose.connection.collection('Students').updateMany(
    { _id: { $in: studentIds } },
    { $set: { isReadyForExam: true, isPromotedForExam: true, targetRank: '9° Kyu (Cinta Amarilla)' } }
  );

  // 3. Crear los 5 Senseis Evaluadores
  const evaluators = [
    {
      name: 'Sensei Roy Gatjens',
      email: 'senseiroykamae@hotmail.com',
      role: 'Jefe de Mesa (7° Dan)',
      token: `roy-${crypto.randomBytes(4).toString('hex')}`,
      kihonNotes: `* Postura en Zenkutsu Dachi firme, pero debe profundizar la flexión de la rodilla adelantada.\n* Buen foco y Kime en el impacto de Oi Zuki.\n* Cuidar la altura de la cadera en los giros y no elevar el talón posterior.`,
      kataNotes: `* Heian Shodan con excelente ritmo y Kiai vigoroso en el décimo movimiento.\n* Mantener la mirada al frente antes de iniciar la rotación de cabeza.`,
      kumiteNotes: `* Distancia de combate (Ma-ai) adecuada y respetuosa.\n* Buena reacción y velocidad en el bloqueo con Age Uke.`
    },
    {
      name: 'Sensei Rooy Lee',
      email: 'kuroobicostarica@gmail.com',
      role: 'Sinodal 1 (5° Dan)',
      token: `rooy-${crypto.randomBytes(4).toString('hex')}`,
      kihonNotes: `* Gran velocidad en las técnicas de pierna (Mae Geri).\n* En Oi Zuki falta rotar completamente la cadera (Gyaku Hanmi) al finalizar el paso.\n* Postura Zenkutsu Dachi sólida y bien enraizada.`,
      kataNotes: `* Buen ritmo marcial en Heian Shodan.\n* Extender totalmente la pierna posterior en Zenkutsu Dachi durante el segundo Kiai.`,
      kumiteNotes: `* Excelente control de la distancia y buen timing en contraataque con Gyaku Zuki.`
    },
    {
      name: 'Sensei Andrea Abarca',
      email: 'andrea.abarca@iskf.cr',
      role: 'Sinodal 2 (4° Dan)',
      token: `andrea-${crypto.randomBytes(4).toString('hex')}`,
      kihonNotes: `* Postura baja y estable en Zenkutsu Dachi.\n* Excelente acción de Hikite hacia la cresta ilíaca sin soltar los codos.\n* Faltó mayor tensión en el abdomen (Kime) al culminar cada golpe.`,
      kataNotes: `* Muy buena postura y elegancia técnica en las transiciones de Heian Shodan.\n* Sostener un instante más la posición final antes del Yame.`,
      kumiteNotes: `* Actitud valiente y atenta en el Ma-ai.\n* Mantener la guardia cerrada sin descuidar el puño delantero.`
    },
    {
      name: 'Sensei Gerardo Montero',
      email: 'gerardo.montero@iskf.cr',
      role: 'Sinodal 3 (4° Dan)',
      token: `gerardo-${crypto.randomBytes(4).toString('hex')}`,
      kihonNotes: `* Zenkutsu Dachi correcto, cuidar no elevar el talón posterior en el desplazamiento.\n* Fuerte Kime en los bloqueos Age Uke y Soto Uke.\n* Muy buen Hikite cerrado a la cadera.`,
      kataNotes: `* Kata Heian Shodan con Kime nítido en cada Gedan Barai.\n* Coordinar la respiración con la llegada del pie en el giro.`,
      kumiteNotes: `* Gran espíritu marcial y firmeza en la respuesta defensiva.\n* Manejo limpio de la distancia sin perder el equilibrio.`
    },
    {
      name: 'Sensei David Artavia',
      email: 'david.artavia@iskf.cr',
      role: 'Sinodal 4 (3° Dan)',
      token: `david-${crypto.randomBytes(4).toString('hex')}`,
      kihonNotes: `* Desplazamiento fluido y postura Zenkutsu Dachi firme.\n* Buena sincronía entre cadera y puño en Oi Zuki.\n* Reforzar el Kime en la pierna trasera al frenar la técnica.`,
      kataNotes: `* Gran concentración y Kiai vigoroso.\n* Los giros en Heian Shodan fueron limpios y sobre su propio eje.`,
      kumiteNotes: `* Respeto estricto a las normas de tatami y excelente lectura del ataque oponente.`
    }
  ];

  // 4. Token y Documento de Convocatoria
  const callAccessToken = `kuma-5s-${crypto.randomBytes(3).toString('hex')}`;

  const callDoc = {
    title: 'Convocatoria Oficial ISKF — Tribunal de 5 Sinodales (Dojo Kuma)',
    dojoId: kumaDojoId,
    dojoName: 'Dojo Kuma',
    dojoSensei: 'Sensei David Artavia',
    examDate: '2026-10-27',
    startTime: '10:30 AM',
    location: 'Dojo Kuma - Tatami de Examen Oficial',
    accessToken: callAccessToken,
    status: 'cerrado', // Cerrada para poder ver la condensación completa de 0 a 100
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
    evaluators: evaluators.map(ev => ({
      senseiName: ev.name,
      name: ev.name,
      email: ev.email,
      role: ev.role,
      token: ev.token
    })),
    schedules: [
      {
        blockName: 'Tanda 1',
        startTime: '10:30 AM',
        endTime: '11:15 AM',
        targetRanks: ['10° Kyu (Cinta Blanca)'],
        studentIds: [studentIds[0].toString(), studentIds[1].toString()]
      }
    ],
    notes: 'Examen oficial evaluado por un Tribunal de 5 Sinodales. Con observaciones técnicas completas y análisis de consenso.',
    createdBy: 'Comisión Técnica ISKF',
    closedAt: new Date(),
    closedForced: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertCallRes = await mongoose.connection.collection('TechnicalExamCalls').insertOne(callDoc);
  const callId = insertCallRes.insertedId;
  console.log('\n======================================================');
  console.log('NUEVA CONVOCATORIA CON 5 SENSEIS CREADA CON ÉXITO:');
  console.log('ID:', callId.toString());
  console.log('Token de Convocatoria:', callAccessToken);
  console.log('URL Convocatoria:', `http://localhost:3000/convocatoria/${callAccessToken}`);
  evaluators.forEach(ev => {
    console.log(`URL ${ev.name} (${ev.role}): http://localhost:3000/evaluar/${callAccessToken}/${ev.token}`);
  });
  console.log('======================================================\n');

  // 5. Calificaciones y Observaciones por los 5 Sinodales
  const aspectIds = (syllabus.technicalAspects || []).map(a => a.id);
  const techList = syllabus.techniques || [];

  for (let eIdx = 0; eIdx < evaluators.length; eIdx++) {
    const ev = evaluators[eIdx];

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const student = students[sIdx];
      const grades = [];
      const scores = {};
      const techniqueAverages = {};
      const observations = {};
      let totalSum = 0;
      let totalCriteriaCount = 0;

      // Base grade slightly differentiated per evaluator (90% - 96%)
      const baseGrade = 91 + (sIdx * 2) + ((eIdx % 3) * 2);

      techList.forEach(t => {
        const criteriaRatings = aspectIds.map((aspId, aIdx) => {
          const score = Math.min(100, Math.max(82, baseGrade - (aIdx % 3)));
          scores[`${t.id}_${aspId}`] = score;
          totalSum += score;
          totalCriteriaCount++;
          return { aspectId: aspId, score, weight: 1 };
        });

        const techAvg = Math.round(criteriaRatings.reduce((acc, c) => acc + c.score, 0) / criteriaRatings.length);
        techniqueAverages[t.id] = techAvg;

        // Observación específica técnica
        let techObs = '';
        const grp = (t.group || t.phase || 'kihon').toLowerCase();
        if (grp === 'kihon') {
          techObs = eIdx === 0
            ? 'Buena aceleración en Oi Zuki pero cuidar no flexionar el torso.'
            : eIdx === 1
            ? 'Rotar cadera completa en Zenkutsu Dachi y afinar el Hikite.'
            : eIdx === 2
            ? 'Excelente eje vertical. Cuidar Kime en el talón trasero.'
            : eIdx === 3
            ? 'Bloqueo Age Uke fuerte y enérgico, mantener hombro relajado.'
            : 'Sincronía limpia de cadera y técnica.';
        } else if (grp === 'kata') {
          techObs = eIdx === 0
            ? 'Heian Shodan ejecutado con gran ritmo marcial y kiai oportuno.'
            : eIdx === 1
            ? 'Profundizar las posturas Zenkutsu Dachi en los giros finales.'
            : eIdx === 2
            ? 'Transiciones muy estables y mirada enfocada al objetivo.'
            : eIdx === 3
            ? 'Kime claro y respiración sincronizada.'
            : 'Giros sobre el talón impecables.';
        } else {
          techObs = eIdx === 0
            ? 'Buen Ma-ai (distancia de combate) y respeto marcial.'
            : eIdx === 1
            ? 'Contraataque veloz con Gyaku Zuki tras el bloqueo.'
            : eIdx === 2
            ? 'Mantener guardia compacta al desplazarse hacia atrás.'
            : eIdx === 3
            ? 'Respuesta defensiva sólida y sin titubeos.'
            : 'Excelente actitud marcial y control.';
        }
        observations[t.id] = techObs;

        grades.push({
          techniqueId: t.id,
          techniqueName: t.name,
          phase: grp,
          techniqueGroup: grp,
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
        observations,
        percentage: overallPercentage,
        isPassed: overallPercentage >= 70,
        phaseNotes: {
          kihon: ev.kihonNotes,
          kata: ev.kataNotes,
          kumite: ev.kumiteNotes
        },
        evaluatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await mongoose.connection.collection('TechnicalExamEvaluations').insertOne(evalDoc);
      console.log(`Evaluación registrada: [${ev.name}] -> ${student.name}: ${overallPercentage}%`);
    }
  }

  // 6. Proceso de Síntesis IA de Observaciones y Consolidación Final para los 2 alumnos
  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const finalGrade = sIdx === 0 ? 93 : 95;

    // Síntesis técnica que condensa los puntos en común de los 5 Senseis
    const aiSynthesis = [
      `* Coincidencia técnica de los 5 Senseis (Sensei Roy Gatjens, Sensei Rooy Lee, Sensei Andrea Abarca, Sensei Gerardo Montero, Sensei David Artavia): el aspirante ${student.name} evidenció un destacable enfoque de Kime, excelente sincronía de Hikite hacia la cadera y una actitud marcial ejemplar en tatami.`,
      `* Corrección principal observada en común: cuidar la longitud y profundidad en Zenkutsu Dachi, asegurando que la pierna posterior permanezca totalmente extendida y el talón en contacto con el suelo durante los giros.`,
      `* Detalle de Kata y Kumite: elogian el ritmo y Kiai vigoroso en Heian Shodan, reiterando conservar la guardia compacta y el centro de gravedad alineado en las respuestas defensivas de Kumite.`
    ].join('\n');

    const consDoc = {
      callId: callId,
      studentId: student._id,
      dojoId: kumaDojoId,
      finalScore: finalGrade,
      finalGrade: finalGrade,
      status: 'passed',
      officialVerdict: 'Aprobado con Distinción (Colegiado 5 Sinodales)',
      isPassed: true,
      promotedRank: '9° Kyu (Cinta Amarilla)',
      observations: `Tribunal de 5 Sinodales unánime en el dictamen favorable para ${student.name}. Se destacan sus fortalezas en técnica básica y se señalan recomendaciones precisas para afinar la postura.`,
      aiAnalysis: aiSynthesis,
      evaluatorsCount: 5,
      certificateIssued: false,
      consolidatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.collection('TechnicalExamConsolidations').insertOne(consDoc);
    console.log(`Consolidación con Síntesis de 5 Senseis guardada para: ${student.name} (${finalGrade}%)`);
  }

  console.log('\n======================================================');
  console.log('DEMO CON 5 SENSEIS PROCESADO DE 0 A 100 EXITOSAMENTE');
  console.log('======================================================');
  process.exit(0);
}

createFiveSenseisKumaDemo().catch(err => {
  console.error(err);
  process.exit(1);
});
