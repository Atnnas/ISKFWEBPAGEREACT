"use server";

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import dbConnect from '../mongodb';
import WrittenExam from '../../models/WrittenExam';
import Dojo from '../../models/Dojo';
import ExaminationSession from '../../models/ExaminationSession';
import ExamSubmission from '../../models/ExamSubmission';
import ExamDeviceLock from '../../models/ExamDeviceLock';

// Seed data inicial con los 3 exámenes requeridos por el usuario
const DEFAULT_EXAMS_SEED = [
  {
    name: "Examen de 4 a 3 Kyu",
    code: "KYU-4-3",
    targetRanks: "4 a 3 Kyu",
    description: "I Examen Oficial de 4° Kyu a 3er Kyu: Terminología, Complete, Posiciones (Dachi) y Desarrollo.",
    order: 1,
    questions: [
      // --- SECCION 1: ASOCIE TERMINOLOGIA (Selección Única) ---
      {
        id: "q-pdf-1",
        type: "single_choice",
        text: "¿Cuál es el significado del término SHIHAN?",
        options: ["Maestro de un rango superior", "De menor antigüedad", "Ponerse en fila", "Ponerse de pie"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-2",
        type: "single_choice",
        text: "¿Cuál es el significado del término KOHAI?",
        options: ["De menor antigüedad", "Maestro superior", "De mayor antigüedad", "Instructor"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-3",
        type: "single_choice",
        text: "¿Qué significa la orden SEIRETSU?",
        options: ["Ponerse en fila", "Detenerse", "Ponerse de pie", "Sentarse"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-4",
        type: "single_choice",
        text: "¿Qué significa la orden KIRITSU?",
        options: ["Ponerse de pie", "Ponerse en fila", "Detenerse", "Saludo"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-5",
        type: "single_choice",
        text: "¿Qué significa la orden YAME?",
        options: ["Detenerse", "Empezar", "Continuar", "Ponerse de pie"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-6",
        type: "single_choice",
        text: "¿Cuál es el significado del término TE?",
        options: ["Mano", "Pie", "Vacío", "Derecha"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-7",
        type: "single_choice",
        text: "¿Qué significa el término MIGI?",
        options: ["Derecha", "Izquierda", "Adelante", "Forma"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-8",
        type: "single_choice",
        text: "¿Cuál es el significado del término REI?",
        options: ["Saludo", "Mano", "Vacío", "Forma"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-9",
        type: "single_choice",
        text: "¿Cuál es el significado del término KATA?",
        options: ["Forma", "Combate", "Saludo", "Mano"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-10",
        type: "single_choice",
        text: "¿Cuál es el significado del término KARA?",
        options: ["Vacío", "Mano", "Derecha", "Forma"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-11",
        type: "single_choice",
        text: "¿Cuál es el significado del término SHOTOKAN?",
        options: ["Escuela de Shoto", "Lugar de la vía", "Fundamento básico", "Meditación"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-12",
        type: "single_choice",
        text: "¿Cuál es el significado del término DOJO?",
        options: ["Lugar de la vía", "Escuela de Shoto", "Fundamento básico", "Cinturón"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-13",
        type: "single_choice",
        text: "¿Cuál es el significado del término KIHON?",
        options: ["Fundamento básico", "Lugar de la vía", "Escuela de Shoto", "Meditación"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-14",
        type: "single_choice",
        text: "¿Qué significa la orden SEIZA?",
        options: ["Sentarse con la espalda erguida", "Ponerse de pie", "Ponerse en fila", "Detenerse"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-15",
        type: "single_choice",
        text: "¿Cuál es el significado del término MOKUSO?",
        options: ["Meditación", "Sentarse erguido", "Saludo", "Lugar de la vía"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-16",
        type: "single_choice",
        text: "¿Cuál es el significado del concepto DO?",
        options: ["Camino o vía", "Cinturón", "Instructor", "Palabra"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-17",
        type: "single_choice",
        text: "¿Cómo se define tradicionalmente la palabra OSS?",
        options: ["Palabra de palabras", "Instructor", "Cinturón", "De mayor antigüedad"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-18",
        type: "single_choice",
        text: "¿Cuál es el significado del término SENSEI?",
        options: ["Instructor", "De mayor antigüedad", "Cinturón", "Camino o vía"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-19",
        type: "single_choice",
        text: "¿Cuál es el significado del término OBI?",
        options: ["Cinturón", "Instructor", "Uniforme", "Camino o vía"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-20",
        type: "single_choice",
        text: "¿Cuál es el significado del término SEMPAI?",
        options: ["De mayor antigüedad", "Instructor", "De menor antigüedad", "Cinturón"],
        correctOptionIndex: 0
      },
      // --- SECCION 2: COMPLETE (Respuesta Corta) ---
      {
        id: "q-pdf-21",
        type: "short_answer",
        text: "Escriba el significado de: KARATE DO",
        expectedNotes: "Camino de la mano vacía."
      },
      {
        id: "q-pdf-22",
        type: "short_answer",
        text: "Escriba el significado de: BASSAI DAI",
        expectedNotes: "Romper o atravesar la fortaleza (versión mayor)."
      },
      {
        id: "q-pdf-23",
        type: "short_answer",
        text: "Escriba el significado de: KANKU DAI",
        expectedNotes: "Mirar al cielo / contemplar el cielo (versión mayor)."
      },
      {
        id: "q-pdf-24",
        type: "short_answer",
        text: "Escriba una oración del DOJO KUN",
        expectedNotes: "Hitotsu, jinkaku kansei ni tsutomuru koto (o en español: Buscar la perfección del carácter, ser leal, esforzarse, respetar, refrenar la violencia)."
      },
      {
        id: "q-pdf-25",
        type: "short_answer",
        text: "¿Cuántas katas oficiales tiene el estilo Shotokan?",
        expectedNotes: "26 katas oficiales."
      },
      {
        id: "q-pdf-26",
        type: "short_answer",
        text: "Escriba el nombre del padre / fundador del estilo Shotokan",
        expectedNotes: "Gichin Funakoshi."
      },
      {
        id: "q-pdf-27",
        type: "short_answer",
        text: "Escriba el origen del Karate Do Shotokan",
        expectedNotes: "Okinawa, Japón."
      },
      {
        id: "q-pdf-28",
        type: "short_answer",
        text: "Escriba el significado de JIYU IPPON KUMITE",
        expectedNotes: "Combate semi-libre a una técnica / un paso."
      },
      {
        id: "q-pdf-29",
        type: "short_answer",
        text: "Mencione un área en las que se divide el KIHON",
        expectedNotes: "Kihon Ido (desplazamientos), Kihon Waza (técnicas estáticas)."
      },
      {
        id: "q-pdf-30",
        type: "short_answer",
        text: "Escriba el nombre en japonés del uniforme de Karate Do",
        expectedNotes: "Karategi (o Gi / Dogi)."
      },
      // --- SECCION 3: POSICIONES (DACHI) (Selección Única) ---
      {
        id: "q-pdf-31",
        type: "single_choice",
        text: "¿Cuál es la posición de pies juntos completamente pegados (talones y puntas unidos)?",
        options: ["HEISOKU DACHI", "MUSUBI DACHI", "KIBA DACHI", "ZENKUTSU DACHI", "YOI DACHI", "KOKUTSU DACHI"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-32",
        type: "single_choice",
        text: "¿Cuál es la posición de jinete con pies paralelos y peso distribuido al 50/50?",
        options: ["KIBA DACHI", "ZENKUTSU DACHI", "KOKUTSU DACHI", "MUSUBI DACHI", "YOI DACHI", "HEISOKU DACHI"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-33",
        type: "single_choice",
        text: "¿Cuál es la posición con la pierna delantera flexionada y pierna trasera estirada (60% peso adelante, 40% atrás)?",
        options: ["ZENKUTSU DACHI", "KOKUTSU DACHI", "KIBA DACHI", "YOI DACHI", "MUSUBI DACHI", "HEISOKU DACHI"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-34",
        type: "single_choice",
        text: "¿Cuál es la posición de saludo formal en posición erguida con talones juntos y puntas abiertas a 45 grados?",
        options: ["MUSUBI DACHI", "HEISOKU DACHI", "YOI DACHI", "KIBA DACHI", "ZENKUTSU DACHI", "KOKUTSU DACHI"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-35",
        type: "single_choice",
        text: "¿Cuál es la posición defensiva atrasada con 70% del peso en la pierna trasera y 30% en la delantera?",
        options: ["KOKUTSU DACHI", "ZENKUTSU DACHI", "KIBA DACHI", "YOI DACHI", "MUSUBI DACHI", "HEISOKU DACHI"],
        correctOptionIndex: 0
      },
      {
        id: "q-pdf-36",
        type: "single_choice",
        text: "¿Cuál es la posición natural de preparado / listo (Hachiji Dachi) con pies separados al ancho de hombros?",
        options: ["YOI DACHI", "MUSUBI DACHI", "HEISOKU DACHI", "KOKUTSU DACHI", "ZENKUTSU DACHI", "KIBA DACHI"],
        correctOptionIndex: 0
      },
      // --- SECCION 4: DESARROLLO (Respuesta Larga) ---
      {
        id: "q-pdf-37",
        type: "long_answer",
        text: "¿Personalmente en qué le ha beneficiado el Karate Do en su vida diaria, salud y formación de carácter?",
        expectedNotes: "Respuesta reflexiva personal sobre disciplina, respeto, control emocional, salud física y perseverancia."
      },
      {
        id: "q-pdf-38",
        type: "long_answer",
        text: "¿Cite un concepto del Niju Kun y relaciónelo con el vivir diario?",
        expectedNotes: "Citar cualquiera de los 20 preceptos de Funakoshi y su aplicación práctica fuera del dojo."
      }
    ]
  },
  {
    name: "Examen de 3 a 2 Kyu",
    code: "KYU-3-2",
    targetRanks: "3 a 2 Kyu",
    description: "Evaluación sobre el kata Tekki Shodan, dinámica de cadera en Kiba Dachi y Jiyu Ippon Kumite.",
    order: 2,
    questions: [
      {
        id: "q-32-1",
        type: "single_choice",
        text: "¿Cuál es el kata Shitei fundamental evaluado para el pase de 3er a 2° Kyu?",
        options: [
          "Tekki Shodan",
          "Heian Godan",
          "Bassai Dai",
          "Kanku Dai"
        ],
        correctOptionIndex: 0
      },
      {
        id: "q-32-2",
        type: "short_answer",
        text: "¿Qué significa el nombre del kata 'Tekki' y cuál es la única postura básica en la que se ejecuta?",
        expectedNotes: "Significa 'Jinete de Hierro' y se ejecuta íntegramente en postura Kiba Dachi."
      },
      {
        id: "q-32-3",
        type: "long_answer",
        text: "Describa el principio de rotación interna de cadera (Koshi) y cómo se genera la potencia en golpes de puño directo (Choku Zuki / Kagi Zuki) en Kiba Dachi sin desplazar los pies.",
        expectedNotes: "Acción de anclaje de piernas al suelo, retroversión pélvica y torsión de cadera con contracción súbita en el instante de impacto (Kime)."
      },
      {
        id: "q-32-4",
        type: "single_choice",
        text: "En Jiyu Ippon Kumite, ¿cuál es la distancia de combate (Maai) reglamentaria para iniciar el ataque de Jodan Oi Zuki?",
        options: [
          "Maai estándar (un paso largo de distancia)",
          "Cuerpo a cuerpo cerrado",
          "Dos pasos largos",
          "Distancia variable sin control"
        ],
        correctOptionIndex: 0
      }
    ]
  },
  {
    name: "Examen de 2 a 1 Kyu",
    code: "KYU-2-1",
    targetRanks: "2 a 1 Kyu",
    description: "Evaluación avanzada previa a cinta negra: kata superior Bassai Dai, principios del Dojo Kun y Zanshin.",
    order: 3,
    questions: [
      {
        id: "q-21-1",
        type: "single_choice",
        text: "¿Cuál es el primer kata superior (Sentei / Tokui) que se evalúa formalmente en la preparación hacia 1er Kyu y Shodan?",
        options: [
          "Bassai Dai",
          "Meikyo",
          "Sochin",
          "Nijushiho"
        ],
        correctOptionIndex: 0
      },
      {
        id: "q-21-2",
        type: "single_choice",
        text: "¿Cuál es la traducción tradicional del nombre del kata 'Bassai Dai'?",
        options: [
          "Atravesar la fortaleza (o romper la fortaleza)",
          "La mirada al cielo",
          "Manos de calma",
          "Camino del espejo"
        ],
        correctOptionIndex: 0
      },
      {
        id: "q-21-3",
        type: "short_answer",
        text: "Mencione al menos 3 de los 5 preceptos del Dojo Kun que todo aspirante debe dominar.",
        expectedNotes: "Perfeccionar el carácter, ser leal y fiel, esforzarse y superarse, respetar a los demás, refrenar el comportamiento violento."
      },
      {
        id: "q-21-4",
        type: "long_answer",
        text: "Explique el concepto marcial de 'Zanshin' (alerta permanente) y su aplicación práctica antes, durante y después de la ejecución de una técnica o combate.",
        expectedNotes: "Estado mental de serenidad y vigilancia total; no relajar la postura ni perder el contacto visual tras finalizar el golpe o kata."
      }
    ]
  }
];

/**
 * Obtiene todos los exámenes escritos desde MongoDB.
 * Si la colección está vacía, realiza un auto-seed con los 3 exámenes requeridos.
 */
export async function getWrittenExams() {
  try {
    await dbConnect();
    
    let count = await WrittenExam.countDocuments();
    if (count === 0) {
      await WrittenExam.insertMany(DEFAULT_EXAMS_SEED);
    }

    const exams = await WrittenExam.find({}).sort({ order: 1, createdAt: 1 }).lean();

    return exams.map((exam) => ({
      id: exam._id.toString(),
      _id: exam._id.toString(),
      name: exam.name,
      code: exam.code || '',
      targetRanks: exam.targetRanks || '',
      description: exam.description || '',
      order: exam.order || 0,
      questions: (exam.questions || []).map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        imageUrl: q.imageUrl || '',
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex ?? 0,
        leftTerms: q.leftTerms || [],
        topTerms: q.topTerms || [],
        correctMatches: (q.correctMatches || []).map(m => ({
          leftIndex: m.leftIndex ?? 0,
          rightIndex: m.rightIndex ?? 0
        })),
        expectedNotes: q.expectedNotes || ''
      }))
    }));
  } catch (error) {
    console.error('Error en getWrittenExams:', error);
    return [];
  }
}

/**
 * Crea un nuevo examen en la base de datos.
 */
export async function createWrittenExam(data) {
  try {
    await dbConnect();

    const count = await WrittenExam.countDocuments();
    const newExam = new WrittenExam({
      name: data.name,
      description: data.description || '',
      targetRanks: data.targetRanks || '',
      code: data.code || `KYU-CUSTOM-${Date.now().toString().slice(-4)}`,
      order: count + 1,
      questions: data.questions || []
    });

    await newExam.save();
    revalidatePath('/admin/examinations/written');

    const plain = newExam.toObject();
    return {
      success: true,
      exam: {
        id: plain._id.toString(),
        _id: plain._id.toString(),
        name: plain.name,
        code: plain.code,
        targetRanks: plain.targetRanks,
        description: plain.description,
        order: plain.order,
        questions: plain.questions
      }
    };
  } catch (error) {
    console.error('Error creando examen:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza nombre y descripción de un examen.
 */
export async function updateWrittenExam(id, data) {
  try {
    await dbConnect();

    const updated = await WrittenExam.findByIdAndUpdate(
      id,
      {
        name: data.name,
        description: data.description || '',
        targetRanks: data.targetRanks || ''
      },
      { new: true }
    ).lean();

    revalidatePath('/admin/examinations/written');

    return {
      success: true,
      exam: {
        ...updated,
        id: updated._id.toString(),
        _id: updated._id.toString()
      }
    };
  } catch (error) {
    console.error('Error actualizando examen:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina un examen de la base de datos.
 */
export async function deleteWrittenExam(id) {
  try {
    await dbConnect();
    await WrittenExam.findByIdAndDelete(id);

    revalidatePath('/admin/examinations/written');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando examen:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Guarda las preguntas de un examen (agregar, editar o quitar).
 */
export async function saveExamQuestions(examId, questions) {
  try {
    await dbConnect();

    const updated = await WrittenExam.findByIdAndUpdate(
      examId,
      { questions },
      { new: true }
    ).lean();

    revalidatePath('/admin/examinations/written');

    return {
      success: true,
      questions: updated?.questions || []
    };
  } catch (error) {
    console.error('Error guardando preguntas del examen:', error);
    return { success: false, error: error.message };
  }
}

// =========================================================================
// CONVOCATORIAS / SESIONES DE EXAMINACIÓN Y DOJO MANAGEMENT
// =========================================================================

/**
 * Obtiene la lista de Dojos registrados para el selector de convocatorias.
 */
export async function getDojosForExaminations() {
  try {
    await dbConnect();
    const dojos = await Dojo.find({}).sort({ name: 1 }).lean();
    return dojos.map(d => ({
      id: d.idName || d._id.toString(),
      _id: d._id.toString(),
      name: d.name,
      province: d.province || '',
      sensei: d.sensei || '',
      logo: d.logo || '/images/dojos/escudo.jpg'
    }));
  } catch (err) {
    console.error("Error fetching dojos for examinations:", err);
    return [];
  }
}

/**
 * Obtiene todas las convocatorias de examinación con el conteo de entregas.
 */
export async function getExaminationSessions() {
  try {
    await dbConnect();
    const [sessions, allDojos] = await Promise.all([
      ExaminationSession.find({}).sort({ createdAt: -1 }).lean(),
      Dojo.find({}).lean()
    ]);

    const dojoMap = {};
    allDojos.forEach(d => {
      if (d.name) dojoMap[d.name.toLowerCase().trim()] = d.logo || '/images/dojos/escudo.jpg';
      if (d.idName) dojoMap[d.idName.toLowerCase().trim()] = d.logo || '/images/dojos/escudo.jpg';
    });

    const results = await Promise.all(sessions.map(async (sess) => {
      const sessionId = sess._id.toString();
      const totalSubmissions = await ExamSubmission.countDocuments({ sessionId });
      const pendingSubmissions = await ExamSubmission.countDocuments({ sessionId, status: { $ne: 'graded' } });
      const gradedSubmissions = await ExamSubmission.countDocuments({ sessionId, status: 'graded' });

      const enrichedAssignedDojos = (sess.assignedDojos || []).map(d => ({
        id: d.id,
        name: d.name,
        logo: d.logo || dojoMap[d.name?.toLowerCase()?.trim()] || dojoMap[d.id?.toLowerCase()?.trim()] || '/images/dojos/escudo.jpg'
      }));

      return {
        id: sessionId,
        _id: sessionId,
        title: sess.title,
        writtenExamId: sess.writtenExamId?.toString(),
        writtenExamName: sess.writtenExamName,
        assignedDojos: enrichedAssignedDojos,
        accessCode: sess.accessCode,
        status: sess.status || 'active',
        timeLimitMinutes: sess.timeLimitMinutes || 0,
        securityMode: sess.securityMode || 'audit',
        notes: sess.notes || '',
        createdAt: sess.createdAt ? sess.createdAt.toISOString() : null,
        totalSubmissions,
        pendingSubmissions,
        gradedSubmissions
      };
    }));

    return results;
  } catch (err) {
    console.error("Error fetching examination sessions:", err);
    return [];
  }
}

/**
 * Crea una nueva convocatoria de examinación vinculada a Dojos de BD.
 */
export async function createExaminationSession(data) {
  try {
    await dbConnect();

    const writtenExam = await WrittenExam.findById(data.writtenExamId).lean();
    if (!writtenExam) {
      return { success: false, error: "Examen escrito base no encontrado en la base de datos." };
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slug = (data.title || 'examen')
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    const accessCode = `${slug}-${randomSuffix}`;

    const newSession = new ExaminationSession({
      title: data.title.trim(),
      writtenExamId: writtenExam._id,
      writtenExamName: writtenExam.name,
      assignedDojos: data.assignedDojos || [],
      accessCode,
      status: 'active',
      timeLimitMinutes: Math.max(0, parseInt(data.timeLimitMinutes, 10) || 0),
      securityMode: data.securityMode || 'audit',
      notes: data.notes?.trim() || ''
    });

    await newSession.save();
    revalidatePath('/admin/examinations');

    const plain = newSession.toObject();
    return {
      success: true,
      session: {
        id: plain._id.toString(),
        _id: plain._id.toString(),
        title: plain.title,
        writtenExamId: plain.writtenExamId.toString(),
        writtenExamName: plain.writtenExamName,
        assignedDojos: plain.assignedDojos,
        accessCode: plain.accessCode,
        status: plain.status,
        timeLimitMinutes: plain.timeLimitMinutes || 0,
        securityMode: plain.securityMode || 'audit',
        notes: plain.notes,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        gradedSubmissions: 0
      }
    };
  } catch (err) {
    console.error("Error creating examination session:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Elimina una convocatoria y todas las entregas asociadas a ella.
 */
export async function deleteExaminationSession(sessionId) {
  try {
    await dbConnect();
    await ExaminationSession.findByIdAndDelete(sessionId);
    await ExamSubmission.deleteMany({ sessionId });

    revalidatePath('/admin/examinations');
    return { success: true };
  } catch (err) {
    console.error("Error deleting examination session:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Alterna el estado de una examinación entre Activa y Cerrada.
 */
export async function toggleExaminationSessionStatus(sessionId) {
  try {
    await dbConnect();
    const session = await ExaminationSession.findById(sessionId);
    if (!session) return { success: false, error: "Convocatoria no encontrada." };

    session.status = session.status === 'active' ? 'closed' : 'active';
    await session.save();

    revalidatePath('/admin/examinations');
    return { success: true, status: session.status };
  } catch (err) {
    console.error("Error toggling session status:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene los datos públicos de una examinación para que el estudiante la resuelva.
 * Protege las respuestas correctas omitiéndolas del payload enviado al cliente.
 */
export async function getPublicExaminationSession(accessCodeOrId, clientDeviceInfo = {}) {
  try {
    await dbConnect();

    if (!accessCodeOrId) {
      return { success: false, error: "No se proporcionó un código de acceso válido." };
    }

    // 1. Limpieza y sanitización del código recibido
    let clean = decodeURIComponent(accessCodeOrId.toString()).trim().replace(/\/+$/, '');

    // 2. Búsqueda por accessCode (exacto o insensible a mayúsculas/minúsculas)
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let session = await ExaminationSession.findOne({
      $or: [
        { accessCode: clean },
        { accessCode: { $regex: new RegExp(`^${escaped}$`, 'i') } }
      ]
    }).lean();

    // 3. Si no se encontró y tiene formato de ObjectId de 24 caracteres hex, buscar por _id
    if (!session && /^[0-9a-fA-F]{24}$/.test(clean)) {
      session = await ExaminationSession.findById(clean).lean();
    }

    // 4. Si aún no se encuentra, intentar buscar por coincidencia en título
    if (!session) {
      session = await ExaminationSession.findOne({
        title: { $regex: new RegExp(`^${escaped}$`, 'i') }
      }).lean();
    }

    if (!session) {
      return { 
        success: false, 
        error: `No se encontró ninguna convocatoria activa con el código "${clean}". Verifica el enlace con tu Sensei.` 
      };
    }

    // 5. Verificar si la convocatoria fue cerrada por el Sensei
    if (session.status === 'closed') {
      return { 
        success: false, 
        isClosed: true, 
        title: session.title,
        error: "Esta convocatoria de examen ha sido cerrada por el Tribunal Examinador. Solicita al Sensei que la active desde el panel de administración." 
      };
    }

    // 6. Verificación de Seguridad y Bloqueo de Dispositivo desde el Servidor (MongoDB)
    // Se aísla por client deviceToken para garantizar que 1 solo enlace funcione para N estudiantes de forma independiente
    const { deviceToken } = clientDeviceInfo || {};
    let lockRecord = null;
    if (deviceToken) {
      lockRecord = await ExamDeviceLock.findOne({ sessionId: session._id, deviceToken }).lean();
    }

    if (lockRecord) {
      if (lockRecord.status === 'locked_by_security') {
        return {
          success: false,
          isSecurityLocked: true,
          title: session.title,
          error: "Este dispositivo ha sido bloqueado de forma permanente por el servidor debido a reiteradas salidas de la evaluación.",
          report: lockRecord.reason || 'Bloqueo registrado en el servidor backend.'
        };
      }

      if (lockRecord.status === 'submitted') {
        return {
          success: false,
          isAlreadySubmitted: true,
          title: session.title,
          error: "Ya se ha registrado una entrega para esta convocatoria desde este dispositivo."
        };
      }

      if (lockRecord.status === 'time_expired') {
        return {
          success: false,
          isTimeExpired: true,
          title: session.title,
          error: "El tiempo límite asignado para resolver esta prueba ha concluido en este dispositivo."
        };
      }

      // Si el tiempo límite ya transcurrió según el reloj del servidor
      if (session.timeLimitMinutes > 0 && lockRecord.startedAt) {
        const elapsedSec = Math.floor((Date.now() - new Date(lockRecord.startedAt).getTime()) / 1000);
        const remainingSec = (session.timeLimitMinutes * 60) - elapsedSec;
        if (remainingSec <= 0) {
          await ExamDeviceLock.updateOne({ _id: lockRecord._id }, { status: 'time_expired' });
          return {
            success: false,
            isTimeExpired: true,
            title: session.title,
            error: "El tiempo límite asignado para resolver esta prueba ha concluido en este dispositivo."
          };
        }
      }
    }

    // 7. Cargar el examen escrito base con búsquedas de respaldo
    let writtenExam = null;
    if (session.writtenExamId) {
      writtenExam = await WrittenExam.findById(session.writtenExamId).lean();
    }
    if (!writtenExam && session.writtenExamName) {
      writtenExam = await WrittenExam.findOne({ name: session.writtenExamName }).lean();
    }
    if (!writtenExam) {
      writtenExam = await WrittenExam.findOne().lean();
    }

    if (!writtenExam) {
      return { 
        success: false, 
        title: session.title,
        error: "El cuestionario base de este examen no se encuentra disponible." 
      };
    }

    // Calcular segundos restantes respaldados por el servidor
    let serverRemainingSeconds = null;
    if (session.timeLimitMinutes > 0) {
      if (lockRecord?.startedAt) {
        const elapsedSec = Math.floor((Date.now() - new Date(lockRecord.startedAt).getTime()) / 1000);
        serverRemainingSeconds = Math.max(0, (session.timeLimitMinutes * 60) - elapsedSec);
      } else {
        serverRemainingSeconds = session.timeLimitMinutes * 60;
      }
    }

    // Sanitizar preguntas (no exponer respuestas correctas)
    const sanitizedQuestions = (writtenExam.questions || []).map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      imageUrl: q.imageUrl || '',
      options: q.options || [],
      leftTerms: q.leftTerms || [],
      topTerms: q.topTerms || []
    }));

    // Enriquecer o respaldar logos de los Dojos asignados
    const dojoNamesOrIds = (session.assignedDojos || []).map(d => d.name || d.id);
    const dbDojos = await Dojo.find({
      $or: [
        { name: { $in: dojoNamesOrIds } },
        { idName: { $in: dojoNamesOrIds } }
      ]
    }).lean();

    const dojoMap = {};
    dbDojos.forEach(d => {
      if (d.name) dojoMap[d.name.toLowerCase().trim()] = d.logo || '/images/dojos/escudo.jpg';
      if (d.idName) dojoMap[d.idName.toLowerCase().trim()] = d.logo || '/images/dojos/escudo.jpg';
    });

    const enrichedAssignedDojos = (session.assignedDojos || []).map(d => ({
      id: d.id,
      name: d.name,
      logo: d.logo || dojoMap[d.name?.toLowerCase()?.trim()] || dojoMap[d.id?.toLowerCase()?.trim()] || '/images/dojos/escudo.jpg'
    }));

    return {
      success: true,
      session: {
        id: session._id.toString(),
        _id: session._id.toString(),
        title: session.title,
        writtenExamName: session.writtenExamName || writtenExam.name,
        targetRanks: writtenExam.targetRanks || '',
        assignedDojos: enrichedAssignedDojos,
        accessCode: session.accessCode,
        timeLimitMinutes: session.timeLimitMinutes || 0,
        securityMode: session.securityMode || 'audit',
        serverRemainingSeconds,
        deviceStatus: lockRecord?.status || 'active'
      },
      exam: {
        id: writtenExam._id.toString(),
        name: writtenExam.name,
        code: writtenExam.code || '',
        targetRanks: writtenExam.targetRanks || '',
        description: writtenExam.description || '',
        questions: sanitizedQuestions
      }
    };
  } catch (err) {
    console.error("Error getting public examination session:", err);
    return { success: false, error: "Error de conexión al cargar la examinación." };
  }
}

/**
 * Registra o inicializa la sesión de un dispositivo en el servidor.
 * Garantiza que el tiempo de inicio quede resguardado en MongoDB y el dispositivo quede enlazado
 * mediante Huella Digital de Hardware (resiste borrado de cookies) y Token de Dispositivo.
 */
export async function registerExamDeviceSession(data) {
  try {
    await dbConnect();
    let { sessionId, deviceToken, fingerprint, ip, userAgent, studentName, studentDojo, studentRank, totalQuestionsCount } = data || {};

    // Extracción forzada de headers reales en el servidor si no fueron provistos
    if (!ip || !userAgent) {
      try {
        const headerStore = await headers();
        if (!ip) {
          ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || '';
        }
        if (!userAgent) {
          userAgent = headerStore.get('user-agent') || '';
        }
      } catch {
        // En caso de que se llame fuera de un contexto de request con headers
      }
    }

    if (!sessionId || !deviceToken) {
      return { success: false, error: "Faltan parámetros requeridos." };
    }

    const session = await ExaminationSession.findById(sessionId).lean();
    if (!session) {
      return { success: false, error: "Convocatoria no encontrada." };
    }

    // Cada dispositivo y cliente se aísla de forma individual por su deviceToken único
    let record = await ExamDeviceLock.findOne({ sessionId, deviceToken });

    if (!record) {
      record = new ExamDeviceLock({
        sessionId,
        deviceToken,
        fingerprint: fingerprint || '',
        ip: ip || '',
        userAgent: userAgent || '',
        status: 'active',
        startedAt: new Date(),
        studentName: studentName || '',
        studentDojo: studentDojo || '',
        studentRank: studentRank || '',
        totalQuestionsCount: totalQuestionsCount || 0,
        lastPingAt: new Date()
      });
      await record.save();
    } else {
      let needsSave = false;
      if (fingerprint && !record.fingerprint) {
        record.fingerprint = fingerprint;
        needsSave = true;
      }
      if (ip && !record.ip) {
        record.ip = ip;
        needsSave = true;
      }
      if (userAgent && !record.userAgent) {
        record.userAgent = userAgent;
        needsSave = true;
      }
      if (studentName && record.studentName !== studentName) {
        record.studentName = studentName;
        needsSave = true;
      }
      if (studentDojo && record.studentDojo !== studentDojo) {
        record.studentDojo = studentDojo;
        needsSave = true;
      }
      if (studentRank && record.studentRank !== studentRank) {
        record.studentRank = studentRank;
        needsSave = true;
      }
      if (totalQuestionsCount && record.totalQuestionsCount !== totalQuestionsCount) {
        record.totalQuestionsCount = totalQuestionsCount;
        needsSave = true;
      }
      record.lastPingAt = new Date();
      needsSave = true;
      if (needsSave) {
        await record.save();
      }
    }

    let remainingSeconds = null;
    if (session.timeLimitMinutes > 0 && record.startedAt) {
      const elapsedSec = Math.floor((Date.now() - new Date(record.startedAt).getTime()) / 1000);
      remainingSeconds = Math.max(0, (session.timeLimitMinutes * 60) - elapsedSec);
    }

    return { 
      success: true, 
      status: record.status, 
      startedAt: record.startedAt,
      remainingSeconds,
      securityViolationsCount: record.securityViolationsCount || 0
    };
  } catch (err) {
    console.error("Error registering exam device session:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Emite un latido (heartbeat) periódico desde el dispositivo del aspirante.
 * Actualiza en tiempo real el nombre, dojo, preguntas respondidas y lastPingAt.
 */
export async function pingExamDeviceHeartbeat(data) {
  try {
    await dbConnect();
    const { 
      sessionId, 
      deviceToken, 
      studentName, 
      studentDojo, 
      studentRank, 
      answeredQuestionsCount, 
      totalQuestionsCount 
    } = data || {};

    if (!sessionId || !deviceToken) {
      return { success: false, error: "Parámetros incompletos." };
    }

    const updateFields = {
      lastPingAt: new Date()
    };
    if (studentName) updateFields.studentName = studentName.trim();
    if (studentDojo) updateFields.studentDojo = studentDojo.trim();
    if (studentRank) updateFields.studentRank = studentRank.trim();
    if (typeof answeredQuestionsCount === 'number') updateFields.answeredQuestionsCount = answeredQuestionsCount;
    if (typeof totalQuestionsCount === 'number') updateFields.totalQuestionsCount = totalQuestionsCount;

    const record = await ExamDeviceLock.findOneAndUpdate(
      { sessionId, deviceToken },
      { $set: updateFields },
      { new: true }
    ).lean();

    return { 
      success: true, 
      status: record?.status || 'active',
      securityViolationsCount: record?.securityViolationsCount || 0
    };
  } catch (err) {
    console.error("Error updating exam device heartbeat:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene los datos en tiempo real de la sala de examen (Live Proctoring).
 * Combina dispositivos activos (ExamDeviceLock) y entregas finalizadas (ExamSubmission).
 */
export async function getLiveProctoringData(sessionId) {
  try {
    await dbConnect();

    const session = await ExaminationSession.findById(sessionId).lean();
    if (!session) {
      return { success: false, error: "Convocatoria no encontrada." };
    }

    const [deviceLocks, submissions] = await Promise.all([
      ExamDeviceLock.find({ sessionId }).sort({ startedAt: -1 }).lean(),
      ExamSubmission.find({ sessionId }).sort({ submittedAt: -1 }).lean()
    ]);

    const now = Date.now();
    const timeLimitSec = (session.timeLimitMinutes || 0) * 60;

    const candidates = deviceLocks.map(lock => {
      const startedMs = lock.startedAt ? new Date(lock.startedAt).getTime() : now;
      const elapsedSec = Math.floor((now - startedMs) / 1000);
      let remainingSec = null;
      if (timeLimitSec > 0) {
        remainingSec = Math.max(0, timeLimitSec - elapsedSec);
      }

      const lastPingMs = lock.lastPingAt ? new Date(lock.lastPingAt).getTime() : startedMs;
      const isOnline = (now - lastPingMs) < 60000; // Activo en el último minuto

      // Verificar si ya entregó
      const matchingSub = submissions.find(s => 
        (lock.studentName && s.studentName && s.studentName.toLowerCase().trim() === lock.studentName.toLowerCase().trim()) ||
        (s.sessionId?.toString() === lock.sessionId?.toString() && s.deviceToken && s.deviceToken === lock.deviceToken)
      );

      let computedStatus = lock.status; // 'active', 'locked_by_security', 'submitted', 'time_expired'
      if (matchingSub || lock.status === 'submitted') {
        computedStatus = 'submitted';
      } else if (lock.status === 'locked_by_security') {
        computedStatus = 'locked_by_security';
      } else if (remainingSec === 0 && timeLimitSec > 0) {
        computedStatus = 'time_expired';
      } else if (!isOnline) {
        computedStatus = 'idle'; // Desconectado o pestaña en background prolongado
      } else {
        computedStatus = 'in_progress';
      }

      return {
        id: lock._id.toString(),
        deviceToken: lock.deviceToken,
        studentName: lock.studentName || matchingSub?.studentName || 'Aspirante en proceso',
        studentDojo: lock.studentDojo || matchingSub?.studentDojo || 'Por definir',
        studentRank: lock.studentRank || matchingSub?.studentRank || '',
        status: computedStatus,
        isOnline,
        startedAt: lock.startedAt ? lock.startedAt.toISOString() : null,
        lastPingAt: lock.lastPingAt ? lock.lastPingAt.toISOString() : null,
        remainingSec,
        securityViolationsCount: lock.securityViolationsCount || matchingSub?.securityViolationsCount || 0,
        answeredQuestionsCount: matchingSub ? (matchingSub.answers?.length || 0) : (lock.answeredQuestionsCount || 0),
        totalQuestionsCount: lock.totalQuestionsCount || matchingSub?.answers?.length || 0,
        submissionScore: matchingSub?.percentage ?? null,
        submissionPassed: matchingSub?.passed ?? null,
        isAutoSubmitted: Boolean(matchingSub?.isAutoSubmitted),
        ip: lock.ip ? lock.ip.replace(/::ffff:/, '') : '',
        reason: lock.reason || ''
      };
    });

    // Filtrar candidatos activos en la sala: quitar automáticamente las sesiones concluidas / entregadas
    const activeCandidates = candidates.filter(c => c.status !== 'submitted');

    // Resumen de métricas en vivo
    const metrics = {
      totalConnected: activeCandidates.length,
      inProgress: activeCandidates.filter(c => c.status === 'in_progress').length,
      submitted: submissions.length,
      securityAlerts: activeCandidates.filter(c => c.securityViolationsCount > 0 && c.status !== 'locked_by_security').length,
      lockedBySecurity: activeCandidates.filter(c => c.status === 'locked_by_security').length,
      idle: activeCandidates.filter(c => c.status === 'idle').length
    };

    return {
      success: true,
      sessionTitle: session.title,
      timeLimitMinutes: session.timeLimitMinutes || 0,
      securityMode: session.securityMode || 'audit',
      candidates: activeCandidates,
      metrics
    };
  } catch (err) {
    console.error("Error fetching live proctoring data:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Permite al Sensei/Tribunal retirar o purgar una sesión de la sala en vivo/espera.
 */
export async function removeExamDeviceSession(sessionId, deviceToken) {
  try {
    await dbConnect();
    if (!sessionId || !deviceToken) {
      return { success: false, error: "Parámetros requeridos faltantes." };
    }

    await ExamDeviceLock.deleteOne({ sessionId, deviceToken });
    revalidatePath('/admin/examinations');

    return { success: true, message: "Sesión retirada de la sala en vivo con éxito." };
  } catch (err) {
    console.error("Error removing exam device session:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Permite al Sensei/Tribunal perdonar una salida accidental o desbloquear un dispositivo
 * para que el estudiante pueda continuar si el tribunal lo autoriza.
 */
export async function resetStudentDeviceLock(sessionId, deviceToken, unlockReason = '') {
  try {
    await dbConnect();
    const record = await ExamDeviceLock.findOne({ sessionId, deviceToken });
    if (!record) {
      return { success: false, error: "Registro de dispositivo no encontrado." };
    }

    record.status = 'active';
    record.lockedAt = null;
    record.securityViolationsCount = 0;
    record.reason = unlockReason ? `Desbloqueado por Sensei: ${unlockReason}` : 'Desbloqueado administrativamente';
    record.lastPingAt = new Date();
    await record.save();

    return { success: true, message: "Aspirante desbloqueado con éxito." };
  } catch (err) {
    console.error("Error resetting student device lock:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Reporta en tiempo real una falta o bloqueo de seguridad directamente en MongoDB.
 * Asocia la Huella Digital de Hardware y la IP real del servidor.
 */
export async function reportSecurityViolationAction(data) {
  try {
    await dbConnect();
    let { sessionId, deviceToken, fingerprint, ip, userAgent, reason, isLockout, violationsCount } = data || {};

    // Extracción forzada de headers reales en el servidor si no fueron provistos
    if (!ip || !userAgent) {
      try {
        const headerStore = await headers();
        if (!ip) {
          ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || '';
        }
        if (!userAgent) {
          userAgent = headerStore.get('user-agent') || '';
        }
      } catch (err) {
        void err;
      }
    }

    if (!sessionId || !deviceToken) {
      return { success: false, error: "Faltan parámetros requeridos." };
    }

    let record = await ExamDeviceLock.findOne({ sessionId, deviceToken });

    if (!record) {
      record = new ExamDeviceLock({
        sessionId,
        deviceToken: deviceToken || 'unknown',
        fingerprint: fingerprint || '',
        ip: ip || '',
        userAgent: userAgent || '',
        status: isLockout ? 'locked_by_security' : 'active',
        securityViolationsCount: violationsCount || 1,
        startedAt: new Date(),
        lockedAt: isLockout ? new Date() : null,
        reason: reason || ''
      });
    } else {
      record.securityViolationsCount = violationsCount || (record.securityViolationsCount + 1);
      if (isLockout) {
        record.status = 'locked_by_security';
        record.lockedAt = new Date();
        record.reason = reason || 'Bloqueo registrado en el servidor por infracción del protocolo de seguridad';
      }
      if (fingerprint && !record.fingerprint) record.fingerprint = fingerprint;
      if (deviceToken) record.deviceToken = deviceToken;
      if (ip) record.ip = ip;
      if (userAgent) record.userAgent = userAgent;
    }

    await record.save();

    return { success: true, status: record.status };
  } catch (err) {
    console.error("Error reporting security violation:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Recibe y procesa el examen completado por un estudiante.
 * Autocalifica preguntas de selección única y asociar términos.
 */
export async function submitStudentExam(data) {
  try {
    await dbConnect();

    const { 
      sessionId, 
      studentName, 
      studentDojo, 
      studentRank, 
      answers, 
      timeSpentSeconds, 
      isAutoSubmitted,
      securityViolationsCount,
      closedBySecurity,
      securityReport
    } = data;

    if (!studentName?.trim() || !studentDojo?.trim()) {
      return { success: false, error: "El nombre del alumno y el Dojo son obligatorios." };
    }

    const session = await ExaminationSession.findById(sessionId).lean();
    if (!session || session.status === 'closed') {
      return { success: false, error: "La convocatoria ha cerrado o no está disponible." };
    }

    // Verificar si ya existe una entrega previa de este estudiante en esta misma sesión
    const escapedName = studentName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingSubmission = await ExamSubmission.findOne({
      sessionId: session._id,
      studentName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      studentDojo: studentDojo.trim()
    });
    if (existingSubmission) {
      return { 
        success: false, 
        error: "Ya se ha registrado una entrega previa de este aspirante en esta convocatoria. No está permitido enviar más de una vez." 
      };
    }

    const writtenExam = await WrittenExam.findById(session.writtenExamId).lean();
    if (!writtenExam) {
      return { success: false, error: "El examen base no está disponible." };
    }

    const questionsMap = {};
    (writtenExam.questions || []).forEach(q => {
      questionsMap[q.id] = q;
    });

    let autoScore = 0;

    const processedAnswers = (answers || []).map(ans => {
      const q = questionsMap[ans.questionId];
      if (!q) return ans;

      if (q.type === 'single_choice') {
        const isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
        if (isCorrect) autoScore += 1;
        return {
          questionId: ans.questionId,
          questionType: q.type,
          questionText: q.text,
          imageUrl: q.imageUrl || '',
          options: q.options || [],
          correctOptionIndex: q.correctOptionIndex,
          selectedOptionIndex: ans.selectedOptionIndex,
          isCorrect,
          isGraded: true,
          earnedPoints: isCorrect ? 1 : 0,
          maxPoints: 1
        };
      }

      if (q.type === 'matching') {
        const totalRows = (q.leftTerms || []).length;
        let correctMatchesCount = 0;
        const studentMatches = ans.matchingMatches || [];

        (q.correctMatches || []).forEach(officialMatch => {
          const found = studentMatches.find(sm => sm.leftIndex === officialMatch.leftIndex && sm.rightIndex === officialMatch.rightIndex);
          if (found) correctMatchesCount++;
        });

        const earned = totalRows > 0 ? (correctMatchesCount / totalRows) : 0;
        const isAllCorrect = totalRows > 0 && correctMatchesCount === totalRows;
        autoScore += earned;

        return {
          questionId: ans.questionId,
          questionType: q.type,
          questionText: q.text,
          imageUrl: q.imageUrl || '',
          leftTerms: q.leftTerms || [],
          topTerms: q.topTerms || [],
          correctMatches: q.correctMatches || [],
          matchingMatches: studentMatches,
          isCorrect: isAllCorrect,
          isGraded: true,
          earnedPoints: Math.round(earned * 100) / 100,
          maxPoints: 1
        };
      }

      // Respuesta corta o larga: evaluadas manualmente por el Sensei
      return {
        questionId: ans.questionId,
        questionType: q.type,
        questionText: q.text,
        imageUrl: q.imageUrl || '',
        writtenAnswer: ans.writtenAnswer || '',
        isCorrect: null,
        isGraded: false,
        earnedPoints: 0,
        maxPoints: 1,
        senseiComments: ''
      };
    });

    const totalQuestions = (writtenExam.questions || []).length;

    const submission = new ExamSubmission({
      sessionId: session._id,
      sessionTitle: session.title,
      writtenExamId: writtenExam._id,
      studentName: studentName.trim(),
      studentDojo: studentDojo.trim(),
      studentRank: (studentRank && studentRank.trim()) || writtenExam.targetRanks || writtenExam.name || session.writtenExamName || '',
      answers: processedAnswers,
      autoScore: Math.round(autoScore * 100) / 100,
      manualScore: 0,
      totalScore: Math.round(autoScore * 100) / 100,
      maxPossibleScore: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((autoScore / totalQuestions) * 100) : 0,
      timeSpentSeconds: Math.max(0, parseInt(timeSpentSeconds, 10) || 0),
      isAutoSubmitted: Boolean(isAutoSubmitted),
      securityViolationsCount: Math.max(0, parseInt(securityViolationsCount, 10) || 0),
      closedBySecurity: Boolean(closedBySecurity),
      securityReport: securityReport?.trim() || '',
      status: 'submitted',
      submittedAt: new Date()
    });

    await submission.save();

    // Actualizar el estado del dispositivo en el servidor para bloquear reintentos
    const { deviceToken } = data || {};
    if (deviceToken) {
      await ExamDeviceLock.findOneAndUpdate(
        { sessionId: session._id, deviceToken },
        {
          status: closedBySecurity ? 'locked_by_security' : 'submitted',
          submittedAt: new Date(),
          lockedAt: closedBySecurity ? new Date() : null,
          reason: securityReport || (closedBySecurity ? 'Cerrado por protocolo de seguridad' : 'Entregado con éxito'),
          securityViolationsCount: Math.max(0, parseInt(securityViolationsCount, 10) || 0)
        },
        { upsert: true }
      );
    }

    revalidatePath('/admin/examinations');

    return {
      success: true,
      submissionId: submission._id.toString(),
      studentName: submission.studentName
    };
  } catch (err) {
    console.error("Error submitting student exam:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene todas las entregas recibidas para una convocatoria de examinación.
 */
export async function getExamSubmissions(sessionId) {
  try {
    await dbConnect();
    const submissions = await ExamSubmission.find({ sessionId }).sort({ submittedAt: -1 }).lean();
    if (!submissions || submissions.length === 0) return [];

    // Cargar los exámenes escritos base vinculados para enriquecer opciones e imágenes si aplica
    const writtenExamIds = [...new Set(submissions.map(s => s.writtenExamId?.toString()).filter(Boolean))];
    const writtenExams = await WrittenExam.find({ _id: { $in: writtenExamIds } }).lean();
    const examsMap = {};
    writtenExams.forEach(we => {
      examsMap[we._id.toString()] = we;
    });

    return submissions.map(s => {
      const baseExam = examsMap[s.writtenExamId?.toString()];
      const baseQuestionsMap = {};
      (baseExam?.questions || []).forEach(q => {
        baseQuestionsMap[q.id] = q;
      });

      const enrichedAnswers = (s.answers || []).map(ans => {
        const baseQ = baseQuestionsMap[ans.questionId];
        return {
          ...ans,
          questionText: ans.questionText || baseQ?.text || '',
          imageUrl: ans.imageUrl || baseQ?.imageUrl || '',
          options: (ans.options && ans.options.length > 0) ? ans.options : (baseQ?.options || []),
          correctOptionIndex: ans.correctOptionIndex ?? baseQ?.correctOptionIndex ?? null,
          leftTerms: (ans.leftTerms && ans.leftTerms.length > 0) ? ans.leftTerms : (baseQ?.leftTerms || []),
          topTerms: (ans.topTerms && ans.topTerms.length > 0) ? ans.topTerms : (baseQ?.topTerms || []),
          correctMatches: (ans.correctMatches && ans.correctMatches.length > 0) ? ans.correctMatches : (baseQ?.correctMatches || []),
          isGraded: ans.isGraded || (typeof ans.earnedPoints === 'number' && (ans.earnedPoints > 0 || ans.isCorrect !== null || !!ans.senseiComments))
        };
      });

      return {
        id: s._id.toString(),
        _id: s._id.toString(),
        sessionId: s.sessionId.toString(),
        sessionTitle: s.sessionTitle,
        writtenExamId: s.writtenExamId.toString(),
        studentName: s.studentName,
        studentDojo: s.studentDojo,
        studentRank: s.studentRank || '',
        answers: enrichedAnswers,
        autoScore: s.autoScore || 0,
        manualScore: s.manualScore || 0,
        totalScore: s.totalScore || 0,
        maxPossibleScore: s.maxPossibleScore || s.answers?.length || 100,
        percentage: s.percentage || 0,
        timeSpentSeconds: s.timeSpentSeconds || 0,
        isAutoSubmitted: Boolean(s.isAutoSubmitted),
        securityViolationsCount: s.securityViolationsCount || 0,
        closedBySecurity: Boolean(s.closedBySecurity),
        securityReport: s.securityReport || '',
        status: s.status || 'submitted',
        passed: s.passed,
        senseiFeedback: s.senseiFeedback || '',
        gradedBy: s.gradedBy || '',
        submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
        gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null
      };
    });
  } catch (err) {
    console.error("Error fetching exam submissions:", err);
    return [];
  }
}

/**
 * Guarda la calificación administrativa o el progreso parcial realizado por el Sensei.
 */
export async function gradeExamSubmission(submissionId, gradingData) {
  try {
    await dbConnect();

    const submission = await ExamSubmission.findById(submissionId);
    if (!submission) {
      return { success: false, error: "Entrega no encontrada en la base de datos." };
    }

    const { answersGrading, senseiFeedback, passed, gradedBy, isPartialProgress } = gradingData || {};

    if (Array.isArray(answersGrading)) {
      submission.answers = submission.answers.map(ans => {
        const update = answersGrading.find(g => g.questionId === ans.questionId);
        if (update) {
          const earned = typeof update.earnedPoints === 'number' ? update.earnedPoints : (ans.earnedPoints || 0);
          return {
            ...ans.toObject(),
            earnedPoints: earned,
            senseiComments: update.senseiComments ?? ans.senseiComments,
            isCorrect: earned > 0,
            isGraded: update.isGraded ?? true
          };
        }
        return ans;
      });
    }

    let totalScore = 0;
    submission.answers.forEach(a => {
      totalScore += (a.earnedPoints || 0);
    });

    const max = submission.maxPossibleScore || submission.answers.length || 1;
    const percentage = Math.min(100, Math.round((totalScore / max) * 100));

    submission.totalScore = Math.round(totalScore * 100) / 100;
    submission.percentage = percentage;
    if (senseiFeedback !== undefined) {
      submission.senseiFeedback = senseiFeedback?.trim() || '';
    }
    submission.gradedBy = gradedBy?.trim() || submission.gradedBy || 'Tribunal Examinador';

    if (isPartialProgress) {
      // Guardado de progreso parcial: no altera resolución final (aprobado/reprobado) y marca status como partially_graded
      submission.status = 'partially_graded';
    } else {
      // Calificación final asentada
      submission.status = 'graded';
      submission.passed = passed !== undefined ? passed : percentage >= 70;
      submission.gradedAt = new Date();
    }

    await submission.save();
    revalidatePath('/admin/examinations');

    return {
      success: true,
      isPartialProgress: Boolean(isPartialProgress),
      submission: {
        id: submission._id.toString(),
        _id: submission._id.toString(),
        totalScore: submission.totalScore,
        percentage: submission.percentage,
        status: submission.status,
        passed: submission.passed,
        senseiFeedback: submission.senseiFeedback
      }
    };
  } catch (err) {
    console.error("Error grading exam submission:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Elimina una entrega individual de examen de la base de datos.
 */
export async function deleteExamSubmission(submissionId) {
  try {
    await dbConnect();
    const submission = await ExamSubmission.findByIdAndDelete(submissionId);
    if (!submission) {
      return { success: false, error: "La entrega solicitada no existe o ya fue eliminada." };
    }

    revalidatePath('/admin/examinations');
    return { success: true };
  } catch (err) {
    console.error("Error deleting exam submission:", err);
    return { success: false, error: err.message };
  }
}
