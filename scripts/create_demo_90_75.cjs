const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function runDemo90And75() {
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

  // 2. Seleccionar los 2 estudiantes de cinta blanca
  const studentIds = [
    '6adda0320d0f419dd6b90879', // Jimena Duran Reinosa (Objetivo: 90%)
    '6adda0330d0f419dd6b9087b'  // Samuel Mendez Castro (Objetivo: 75% / 7.5)
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

  // 3. Limpiar convocatorias anteriores para un escenario limpio de 0 a 100
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
      jimenaOffset: 0, // 90%
      samuelOffset: 0, // 75%
      notesJimena: {
        kihon: 'Muy buena alineación en Zenkutsu Dachi, pierna trasera completamente estirada y excelente anclaje del talón. Foco y Kime sólido en Oi Zuki.',
        kata: 'Heian Shodan ejecutado con gran estabilidad, ritmo marcial impecable y mirada (Chakugan) fija al frente. Kiai muy potente.',
        kumite: 'Excelente control de la distancia (Ma-ai) en Gohon Kumite. Buena reacción en el contraataque con Gyaku Zuki.'
      },
      notesSamuel: {
        kihon: 'En Zenkutsu Dachi tiende a despegar el talón del pie posterior al avanzar. Debe estirar completamente la rodilla de atrás y bajar más la cadera.',
        kata: 'En Heian Shodan dudó levemente en el giro hacia atrás después del segundo Kiai y se acomodó la solapa del karategui. Debe mantener inmovilidad absoluta.',
        kumite: 'En Gohon Kumite pierde un poco la distancia (Ma-ai) quedando demasiado cerca en el tercer paso. Cuidar la separación de seguridad.'
      }
    },
    {
      name: 'Sensei Rooy Lee',
      email: 'kuroobicostarica@gmail.com',
      role: 'Sinodal 1',
      token: `rooy-${crypto.randomBytes(4).toString('hex')}`,
      jimenaOffset: 0, // 90%
      samuelOffset: -1, // 74%
      notesJimena: {
        kihon: 'Desplazamientos limpios en media luna. Excelente recogida (Hikiashi) en Mae Geri. Bajar medio puño más la posición para alcanzar la perfección.',
        kata: 'Secuencia fluida y sin titubeos. Concentración total sin tocarse la vestimenta en ningún momento.',
        kumite: 'Guardia Kamae firme y zanshin sostenido al terminar cada bloqueo.'
      },
      notesSamuel: {
        kihon: 'La mano de Hikite se le afloja al terminar el Age Uke. Debe mantener el puño pegado firmemente a la cintura sobre el cinturón.',
        kata: 'Ritmo irregular en las transiciones de Heian Shodan. Sostener la vista al frente antes de iniciar cada movimiento.',
        kumite: 'Baja la mano de guardia tras bloquear el ataque de puño. No desarmar el Kamae hasta que el oponente retroceda.'
      }
    },
    {
      name: 'Sensei David Artavia',
      email: 'artaviadavid@hotmail.com',
      role: 'Sinodal 2',
      token: `david-${crypto.randomBytes(4).toString('hex')}`,
      jimenaOffset: 1, // 91%
      samuelOffset: 1, // 76%
      notesJimena: {
        kihon: 'Trayectoria de bloqueo muy limpia en Age Uke y Soto Uke con la rotación de cadera oportuna.',
        kata: 'Transiciones fluidas entre Zenkutsu y Kokutsu Dachi. Excelente postura de Shuto Uke.',
        kumite: 'Manejo respetuoso del compañero con gran precisión técnica y sin contacto desmedido.'
      },
      notesSamuel: {
        kihon: 'En Mae Geri le falta elevar más la rodilla al pecho antes de patear y recoger con mayor velocidad (Hikiashi) para no caer de golpe.',
        kata: 'Las posiciones le quedan un poco cortas en los giros de 90 grados. Abrir más el paso hacia Zenkutsu Dachi.',
        kumite: 'Retrocede antes de tiempo anticipando el ataque. Debe esperar el movimiento del atacante con serenidad.'
      }
    },
    {
      name: 'Sensei Eric Morales',
      email: 'ericmoralesiskf@gmail.com',
      role: 'Sinodal 3',
      token: `eric-${crypto.randomBytes(4).toString('hex')}`,
      jimenaOffset: -1, // 89%
      samuelOffset: 0, // 75%
      notesJimena: {
        kihon: 'Puño de Hikite bien posicionado sobre la cresta ilíaca. Tronco firme y hombros relajados al golpear.',
        kata: 'Coordinación y respiración sincronizada en todo el kata. Enfoque marcial sobresaliente.',
        kumite: 'Respuesta inmediata al comando del oponente. Muy buen espíritu marcial en tatami.'
      },
      notesSamuel: {
        kihon: 'El bloqueo de Gedan Barai lo hace muy abierto hacia el lado. Cerrar la trayectoria a la anchura del cuerpo.',
        kata: 'Kiai un poco tímido en el primer punto focal. Poner más fuerza y determinación desde el abdomen.',
        kumite: 'Buena actitud y saludo respetuoso, pero debe girar más la cadera en el contraataque.'
      }
    },
    {
      name: 'Sensei Gerardo Pérez',
      email: 'gerardopereziskf@gmail.com',
      role: 'Sinodal 4',
      token: `gerardo-${crypto.randomBytes(4).toString('hex')}`,
      jimenaOffset: 0, // 90%
      samuelOffset: 0, // 75%
      notesJimena: {
        kihon: 'Firmeza en el pie base durante el pateo. Buenas posiciones básicas aprobadas con solvencia.',
        kata: 'Inmovilidad impecable al terminar el kata. Cero reajustes hasta la orden de descanso.',
        kumite: 'Distancia de ataque adecuada y bloqueo a la altura reglamentaria.'
      },
      notesSamuel: {
        kihon: 'Pasos en falso al iniciar la media luna. Mover los pies directamente en trayectoria curva sin pasos previos.',
        kata: 'No tocarse ni acomodarse el uniforme durante las pausas del kata. Mantener disciplina corporal.',
        kumite: 'Control aceptable del golpe final, pero necesita mayor firmeza en los pies de apoyo.'
      }
    }
  ];

  // 5. Crear la Convocatoria Oficial
  const callAccessToken = `kuma-tribunal5-${crypto.randomBytes(3).toString('hex')}`;
  const callDoc = {
    title: 'Convocatoria Oficial de Examen Técnico — Tribunal Colegiado 5 Sinodales ISKF',
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
    notes: 'Examen oficial de pase de grado con tribunal de 5 sinodales. Notas: Jimena Duran (90%), Samuel Mendez (75% / 7.5).',
    createdBy: 'Comisión Técnica ISKF',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertCallRes = await mongoose.connection.collection('TechnicalExamCalls').insertOne(callDoc);
  const callId = insertCallRes.insertedId;
  console.log('Convocatoria creada ID:', callId.toString());

  // 6. Generar Calificaciones y Comentarios Personales de los 5 Senseis para cada Alumno
  const aspectIds = (syllabus.technicalAspects || []).map(a => a.id);
  const techList = syllabus.techniques || [];

  for (const ev of evaluators) {
    for (let idx = 0; idx < students.length; idx++) {
      const student = students[idx];
      const isJimena = student.name.includes('Jimena');

      // Base: Jimena = 90 + offset; Samuel = 75 + offset
      const targetBase = isJimena ? (90 + ev.jimenaOffset) : (75 + ev.samuelOffset);
      const phaseNotes = isJimena ? ev.notesJimena : ev.notesSamuel;

      const grades = [];
      const scores = {};
      const techniqueAverages = {};
      let totalSum = 0;
      let totalCriteriaCount = 0;

      techList.forEach((t, tIdx) => {
        const variation = (tIdx % 3 === 0 ? 0 : (tIdx % 3 === 1 ? -1 : 1));
        const techTarget = targetBase + variation;

        const criteriaRatings = aspectIds.map((aspId, aIdx) => {
          const critScore = Math.min(100, Math.max(65, techTarget + (aIdx % 2 === 0 ? 1 : -1)));
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

  console.log('Evaluaciones con notas y comentarios personales insertadas por los 5 Senseis para ambos alumnos.');

  // 7. Consolidar Dictamen Oficial Colegiado del Tribunal
  // Alumno 1: Jimena Duran Reinosa (90% - Alta Excelencia)
  const jimenaStudent = students.find(s => s.name.includes('Jimena'));
  const jimenaSummary = [
    '* Detalle en Kata (Heian Shodan) para ganar 100%: Mantener inmovilidad y concentración absoluta tras el kiai final sin realizar el más mínimo reajuste a la vestimenta hasta la orden oficial de descanso.',
    '* Corrección postural para ganar 100%: En Zenkutsu Dachi, descender medio puño más el centro de gravedad sin subir la altura del cuerpo durante los avances en media luna.',
    '* Detalle de impacto para ganar 100%: Máxima aceleración y sincronía en el tirón del Hikite hacia la cintura en el instante exacto del impacto final.',
    '* Detalle en Combate (Gohon Kumite) para ganar 100%: Mayor velocidad explosiva y rotación de cadera en la respuesta de contraataque inmediatamente tras el bloqueo.',
    '* Detalle para alcanzar la nota máxima (100%): Con una nota destacada de 90%, para la calificación perfecta faltó: mayor descenso milimétrico en Zenkutsu Dachi, máxima aceleración en el Hikite final.',
    '* Aspectos aprobados demostrados: muy buen saludo, respeto y disciplina dentro del tatami, excelente estabilidad en giros y Kime sólido.'
  ].join('\n');

  await mongoose.connection.collection('TechnicalExamConsolidations').insertOne({
    callId: callId,
    dojoId: kumaDojoId,
    dojoName: 'Dojo Kuma',
    studentId: jimenaStudent._id,
    studentName: jimenaStudent.name,
    studentRank: '10° Kyu (Cinta Blanca)',
    targetRank: '9° Kyu (Cinta Amarilla)',
    promotedRank: '9° Kyu (Cinta Amarilla)',
    syllabusId: syllabus._id.toString(),
    syllabusName: syllabus.name,
    finalGrade: 90,
    overallPercentage: 90,
    isPassed: true,
    officialVerdict: 'Aprobado',
    evaluators: evaluators.map(e => ({
      name: e.name,
      role: e.role,
      percentage: 90 + e.jimenaOffset,
      isPassed: true
    })),
    evaluatorCount: 5,
    aiConsolidatedSummary: jimenaSummary,
    aiAnalysis: jimenaSummary,
    observations: 'Aprobada con excelencia técnica (90%). Se avala su promoción a 9° Kyu.',
    status: 'oficializado',
    certificateIssued: true,
    consolidatedBy: 'Comisión Técnica ISKF',
    consolidatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Alumno 2: Samuel Mendez Castro (75% - Aprobado Raspando)
  const samuelStudent = students.find(s => s.name.includes('Samuel'));
  const samuelSummary = [
    '* Corrección en Kata (Heian Shodan): Mantener la mirada fija al frente tras cada giro, bajar bien las posiciones y evitar tocarse o acomodarse el uniforme (karategui) durante la ejecución y pausas.',
    '* Corrección de postura básica (Zenkutsu Dachi): Estirar por completo la pierna trasera apoyando todo el talón en el suelo al avanzar y no hacer pasos en falso.',
    '* Mano a la cintura (Hikite): Jalar con fuerza y rapidez la mano que no golpea hasta pegarla firmemente a la cintura sobre el cinturón sin dejarla descolgada.',
    '* Corrección en Combate (Gohon Kumite): Mantener la distancia de seguridad reglamentaria (Ma-ai) y no bajar los brazos de guardia (Kamae) tras bloquear.',
    '* ¿Qué faltó para alcanzar la nota máxima (10 de 10)?: Con una nota de 75%, para sacar un 10 perfecto faltó: asentar firmemente el talón posterior, recoger rápido la pierna en Mae Geri (Hikiashi), no tocarse el karategui y mayor fijación de cadera.',
    '* Aspectos aprobados demostrados: muy buen saludo, respeto y disciplina dentro del tatami.'
  ].join('\n');

  await mongoose.connection.collection('TechnicalExamConsolidations').insertOne({
    callId: callId,
    dojoId: kumaDojoId,
    dojoName: 'Dojo Kuma',
    studentId: samuelStudent._id,
    studentName: samuelStudent.name,
    studentRank: '10° Kyu (Cinta Blanca)',
    targetRank: '9° Kyu (Cinta Amarilla)',
    promotedRank: '9° Kyu (Cinta Amarilla)',
    syllabusId: syllabus._id.toString(),
    syllabusName: syllabus.name,
    finalGrade: 75,
    overallPercentage: 75,
    isPassed: true,
    officialVerdict: 'Aprobado',
    evaluators: evaluators.map(e => ({
      name: e.name,
      role: e.role,
      percentage: 75 + e.samuelOffset,
      isPassed: true
    })),
    evaluatorCount: 5,
    aiConsolidatedSummary: samuelSummary,
    aiAnalysis: samuelSummary,
    observations: 'Aprobado raspando con nota 75 (7.5 de 10). Debe enfocar sus entrenamientos en corregir las posturas y fijación del Hikite.',
    status: 'oficializado',
    certificateIssued: true,
    consolidatedBy: 'Comisión Técnica ISKF',
    consolidatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('¡Proceso completado de 0 a 100 con éxito!');
  await mongoose.disconnect();
}

runDemo90And75().catch(console.error);
