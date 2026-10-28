'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import crypto from 'crypto';
import dbConnect from '../mongodb';
import TechnicalExamEvaluation from '../../models/TechnicalExamEvaluation';
import TechnicalExamConsolidation from '../../models/TechnicalExamConsolidation';
import TechnicalExamCall from '../../models/TechnicalExamCall';
import ExamSyllabus from '../../models/ExamSyllabus';
import Student from '../../models/Student';
import Dojo from '../../models/Dojo';
import { auth } from '../../auth';
import {
  getKataForRank,
  getKumiteForRank,
  getPrimaryStance,
  generateShotokanFeedbackBullets
} from '../utils/shotokanCriteriaFeedback';
import { synthesizePhaseBulletsWithAI } from '../utils/martialAiSynthesizer';

/**
 * Obtener evaluaciones técnicas de un dojo específico (para Padrón y Tatami)
 * Si se especifica evaluatorEmail, filtra únicamente las notas de ese Sensei.
 */
export async function getTechnicalEvaluationsByDojo(dojoId, syllabusId = null, evaluatorEmail = null) {
  try {
    await dbConnect();

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return [];
    }

    const query = { dojoId: new mongoose.Types.ObjectId(dojoId) };
    if (syllabusId) {
      query.syllabusId = String(syllabusId);
    }
    if (evaluatorEmail) {
      query.evaluatorEmail = String(evaluatorEmail).trim().toLowerCase();
    }

    const evals = await TechnicalExamEvaluation.find(query).sort({ updatedAt: -1 }).lean();

    return evals.map(e => ({
      _id: e._id.toString(),
      id: e._id.toString(),
      studentId: e.studentId.toString(),
      studentName: e.studentName,
      studentRank: e.studentRank,
      targetRank: e.targetRank,
      dojoId: e.dojoId.toString(),
      dojoName: e.dojoName || '',
      syllabusId: e.syllabusId || '',
      syllabusName: e.syllabusName || '',
      scores: e.scores || {},
      techniqueAverages: e.techniqueAverages || {},
      // Observaciones específicas por técnica según el temario
      observations: e.observations || {},
      percentage: Number(e.percentage) || 0,
      pointsEarned: Number(e.pointsEarned) || 0,
      pointsPossible: Number(e.pointsPossible) || 0,
      isPassed: Boolean(e.isPassed),
      evaluatorId: e.evaluatorId ? e.evaluatorId.toString() : null,
      evaluatorName: e.evaluatorName || 'Comisión Técnica',
      evaluatorEmail: e.evaluatorEmail || '',
      notes: e.notes || '',
      evaluatedAt: e.evaluatedAt ? e.evaluatedAt.toISOString() : null,
      updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error('Error al obtener evaluaciones técnicas:', error);
    return [];
  }
}

/**
 * Guardar o actualizar un lote de notas de evaluación técnica en MongoDB por un Sensei
 * Soporta múltiples evaluadores (Tribunal de 1 a 5 Senseis)
 */
export async function saveTatamiBatchScores({
  dojoId,
  dojoName,
  syllabusId,
  syllabusName,
  targetRank,
  evaluatorName = null,
  evaluatorEmail = null,
  batchScoresByStudent // Array of { studentId, studentName, studentRank, scores, observations, techniqueAverages, percentage, pointsEarned, pointsPossible, isPassed }
}) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para registrar evaluaciones en tatami.' };
    }

    await dbConnect();

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return { success: false, error: 'ID de Dojo inválido.' };
    }

    if (!Array.isArray(batchScoresByStudent) || batchScoresByStudent.length === 0) {
      return { success: false, error: 'No se recibieron notas de estudiantes para guardar.' };
    }

    const finalEvaluatorName = (evaluatorName || session.user.name || 'Comisión Técnica ISKF').trim();
    const finalEvaluatorEmail = (evaluatorEmail || session.user.email || 'comision@iskf.cr').trim().toLowerCase();
    const now = new Date();

    const results = [];

    for (const item of batchScoresByStudent) {
      if (!item.studentId || !mongoose.Types.ObjectId.isValid(item.studentId)) {
        continue;
      }

      // Consulta discriminada por estudiante Y por Sensei evaluador
      const query = {
        studentId: new mongoose.Types.ObjectId(item.studentId),
        evaluatorEmail: finalEvaluatorEmail,
        ...(syllabusId ? { syllabusId: String(syllabusId) } : {})
      };

      const updateData = {
        studentId: new mongoose.Types.ObjectId(item.studentId),
        studentName: item.studentName || 'Estudiante',
        studentRank: item.studentRank || '10° Kyu (Cinta Blanca)',
        targetRank: targetRank || item.targetRank || '10° Kyu (Cinta Blanca)',
        dojoId: new mongoose.Types.ObjectId(dojoId),
        dojoName: dojoName || '',
        syllabusId: syllabusId ? String(syllabusId) : '',
        syllabusName: syllabusName || 'Temario Oficial ISKF',
        scores: item.scores || {},
        techniqueAverages: item.techniqueAverages || {},
        observations: item.observations || {},
        percentage: Number(item.percentage) || 0,
        pointsEarned: Number(item.pointsEarned) || 0,
        pointsPossible: Number(item.pointsPossible) || 0,
        isPassed: Boolean(item.isPassed),
        evaluatorName: finalEvaluatorName,
        evaluatorEmail: finalEvaluatorEmail,
        evaluatedAt: now,
      };

      const savedDoc = await TechnicalExamEvaluation.findOneAndUpdate(
        query,
        { $set: updateData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push({
        studentId: item.studentId,
        evaluationId: savedDoc._id.toString(),
        percentage: savedDoc.percentage,
        isPassed: savedDoc.isPassed,
        evaluatorName: finalEvaluatorName
      });
    }

    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/examinations');

    return {
      success: true,
      count: results.length,
      evaluations: results,
      message: `Se guardaron exitosamente ${results.length} evaluaciones técnicas para el evaluador ${finalEvaluatorName}.`
    };
  } catch (error) {
    console.error('Error al guardar notas de tatami en base de datos:', error);
    return { success: false, error: error.message || 'Error al persistir notas en la base de datos.' };
  }
}

/**
 * Obtener todas las evaluaciones individuales de todos los Senseis para un examen/tatami,
 * agrupadas por estudiante para calcular promedios cruzados y recopilar observaciones.
 */
export async function getAllSenseiEvaluationsForTatami({ dojoId, syllabusId = null, studentIds = null, callId = null }) {
  try {
    await dbConnect();

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return { success: false, error: 'ID de Dojo inválido' };
    }

    const query = {};
    if (callId && mongoose.Types.ObjectId.isValid(callId)) {
      query.callId = new mongoose.Types.ObjectId(callId);
    } else if (dojoId && mongoose.Types.ObjectId.isValid(dojoId)) {
      query.dojoId = new mongoose.Types.ObjectId(dojoId);
    }
    if (syllabusId) {
      query.syllabusId = String(syllabusId);
    }
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      query.studentId = { $in: studentIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const allEvals = await TechnicalExamEvaluation.find(query).sort({ evaluatorName: 1, updatedAt: -1 }).lean();

    // Agrupar por studentId
    const byStudent = {};

    allEvals.forEach(ev => {
      const sId = ev.studentId.toString();
      if (!byStudent[sId]) {
        byStudent[sId] = {
          studentId: sId,
          studentName: ev.studentName,
          studentRank: ev.studentRank,
          targetRank: ev.targetRank,
          syllabusId: ev.syllabusId,
          syllabusName: ev.syllabusName,
          evaluations: []
        };
      }
      byStudent[sId].evaluations.push({
        evaluationId: ev._id.toString(),
        evaluatorName: ev.evaluatorName || ev.evaluatorSenseiName || 'Sensei',
        evaluatorEmail: ev.evaluatorEmail,
        scores: ev.scores || {},
        techniqueAverages: ev.techniqueAverages || {},
        grades: ev.grades || [],
        observations: ev.observations || {},
        phaseNotes: ev.phaseNotes || {},
        notes: ev.notes || '',
        percentage: Number(ev.percentage) || 0,
        isPassed: Boolean(ev.isPassed),
        evaluatedAt: ev.evaluatedAt ? ev.evaluatedAt.toISOString() : null,
      });
    });

    return {
      success: true,
      byStudent
    };
  } catch (error) {
    console.error('Error al obtener evaluaciones de todos los senseis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Síntesis inteligente con IA de las observaciones de todos los Senseis.
 * Si se dispone de GEMINI_API_KEY o OPENAI_API_KEY en variables de entorno, consulta a la API.
 * Si no, utiliza el motor heurístico marcial avanzado integrado para sintetizar en un dictamen oficial.
 */
export async function synthesizeSenseiObservationsWithAI({
  studentName,
  targetRank,
  syllabusName = 'Temario Oficial ISKF',
  averagedPercentage = 0,
  _isPassed = false,
  senseiObservations = [], // Array of { evaluatorName, techniqueName, observation }
  _scores = {},             // Map of criteria scores (e.g. { "tech-01_aspect-dachi": 40 })
  techniqueAverages = {},  // Map of technique scores (e.g. { "tech-01": 2 })
  techniques = [],         // Techniques from syllabus
  _technicalAspects = []    // Aspects from syllabus
}) {
  try {
    const validNotes = senseiObservations.filter(o => o.observation && String(o.observation).trim().length > 0);
    const pct = Number(averagedPercentage) || 0;

    // 1. Resolver nombres específicos de Kata, Kumite y postura del cinturón evaluado
    const kataName = getKataForRank(targetRank, techniques);
    const kumiteName = getKumiteForRank(targetRank, techniques);
    const primaryStance = getPrimaryStance(targetRank, techniques);

    // 2. Analizar promedios y falencias por técnica y criterio según estrellas
    const lowTechs = [];
    const highTechs = [];
    Object.entries(techniqueAverages || {}).forEach(([techId, val]) => {
      if (typeof val !== 'number') return;
      const normalized = val <= 10 ? val * 10 : val;
      const tObj = (techniques || []).find(t => t.id === techId);
      const tName = tObj?.name || techId;
      const tGroup = (tObj?.group || tObj?.phase || 'kihon').toLowerCase();
      if (normalized < 70) {
        lowTechs.push({ id: techId, name: tName, group: tGroup, score: normalized });
      } else if (normalized >= 85) {
        highTechs.push({ id: techId, name: tName, group: tGroup, score: normalized });
      }
    });

    // 3. Preparar contexto para la IA
    const notesSummaryText = validNotes.length > 0
      ? validNotes.map((item) => `[Técnica: "${item.techniqueName}"]: "${item.observation}"`).join('\n')
      : 'No se redactaron notas textuales. La evaluación se realizó mediante la escala oficial de estrellas por técnica y criterio.';

    const lowTechsDesc = lowTechs.length > 0
      ? lowTechs.map(t => `- ${t.name} (${t.group}): ${t.score}% (Falla en el criterio técnico)`).join('\n')
      : (pct < 70 ? `- Desempeño insuficiente en las técnicas fundamentales de ${targetRank}` : 'Ninguna técnica en nivel crítico');

    const prompt = `Analiza la evaluación técnica del karateca ${studentName} para el grado de ${targetRank} (${syllabusName}), con una calificación final de ${pct}% (sobre 100%):

INFORMACIÓN DEL TEMARIO Y CALIFICACIONES DEL ASPIRANTE:
- Grado aspirado: ${targetRank}
- Kata oficial del grado: ${kataName}
- Combate oficial del grado: ${kumiteName}
- Postura base: ${primaryStance}
- Calificación consolidada: ${pct}%
- Técnicas con calificación baja / deficiente (1-2 estrellas o <70%):
${lowTechsDesc}

OBSERVACIONES REGISTRADAS POR EVALUADORES:
${notesSummaryText}

TU TAREA OBLIGATORIA:
1. REGLA ESTRICTA DE ENFOQUE (SIN NOMBRES NI ATRIBUCIÓN):
   - NUNCA menciones nombres de evaluadores, ni frases como "según el tribunal", "el tribunal indica", "los profesores observaron".
   - Al karateca le interesan ÚNICAMENTE las correcciones técnicas directas y biomecánicas de su examen.
2. REGLA DE SEVERIDAD Y CORRELACIÓN CON LOS ASPECTOS TÉCNICOS:
   - SI LA NOTA ES BAJA (< 70% o 1-2 estrellas):
     El dictamen debe ser SEVERO, FIRME Y EXIGENTE. Señala con precisión las falencias de Shotokan que provocaron la reprobación:
     * En Kihon (Posturas/Dachi): pierna posterior doblada en vez de estirada, talón despegado al avanzar, pasos en falso o reajustar los pies.
     * En Kihon (Golpes/Tsuki): mano de Hikite descolgada en la cadera, hombros tensos y golpe sin foco ni Kime.
     * En Kihon (Defensas/Uke): bloqueo pegado al cuerpo sin la separación de un puño de distancia y sin rotación de cadera.
     * En Kihon (Patadas/Geri): no elevar la rodilla antes de patear, no recoger la pierna con Hikiashi e impacto incorrecto.
     * En Kata (${kataName}): olvidar pasos, detenerse, o la falta grave de tocarse o acomodarse el karategui rompiendo la inmovilidad en tatami.
     * En Kumite (${kumiteName}): perder la distancia Ma-ai, retroceder con miedo o desarmar la guardia Kamae tras bloquear.
   - SI LA NOTA ES ALTA (>= 85% o 4-5 estrellas):
     Tono de alta precisión técnica. Enfocado EXCLUSIVAMENTE en el detalle fino que le faltó para corregir y ganar 100% (10 de 10) (ej: descender medio puño más el centro de gravedad sin oscilar la altura, máxima aceleración en el Hikite en el impacto final, cero movimientos tras el kiai en ${kataName}).
   - SI LA NOTA ES MEDIA (70% - 84% o 3 estrellas):
     Correcciones constructivas directas para afianzar la fijación de posturas y kime.
3. COMPARACIÓN Y SÍNTESIS INTELIGENTE DE COMENTARIOS:
   - Compara las observaciones de los evaluadores por cada fase (Kihon, Kata, Kumite).
   - Si dos o más Senseis coinciden o se parecen en un rubro (por ejemplo: la salida con la punta del pie antes de avanzar, acomodarse el cabello o uniforme, los codos en un bloqueo, la respiración o la distancia), sintétizalos y unifícalos en una sola viñeta concisa de consenso.
   - Si las observaciones de los Senseis coinciden con las técnicas de baja calificación de estrellas, intégralas directamente en la corrección de esa técnica.
   - Si una técnica recibió estrellas bajas y no fue mencionada en texto, añade la corrección técnica correspondiente.
4. Formato OBLIGATORIO: Lista con viñetas (*), una por línea.
* [Corrección en Kata (${kataName})]
* [Corrección en Kihon / Posturas]
* [Corrección en Kumite (${kumiteName})]
* [Detalle para 100% (si es alta) O Motivo severo de no aprobación (si es baja)]
* [Aspectos positivos: ÚNICAMENTE lo que se haya demostrado o elogiado explícitamente]`;

    // 4. Intentar Gemini API si está configurada
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 450,
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim().length > 10) {
            return {
              success: true,
              summary: generatedText.trim(),
              source: 'gemini'
            };
          }
        }
      } catch (err) {
        console.warn('Error al invocar Gemini API, usando motor de respaldo:', err);
      }
    }

    // 5. Intentar OpenAI API si está configurada
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Eres el evaluador técnico oficial de ISKF Costa Rica. Emites correcciones técnicas directas sin citar nombres de evaluadores. Mapeas las fallas técnicas exactas según el temario oficial del cinturón en Kihon, Kata y Kumite.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.25,
            max_tokens: 450
          })
        });

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.choices?.[0]?.message?.content;
          if (generatedText && generatedText.trim().length > 10) {
            return {
              success: true,
              summary: generatedText.trim(),
              source: 'openai'
            };
          }
        }
      } catch (err) {
        console.warn('Error al invocar OpenAI API, usando motor de respaldo:', err);
      }
    }

    // 6. Motor Heurístico y Semántico de Síntesis Marcial Colegiada
    // Clasificar y comparar las notas de los evaluadores por fase técnica
    const kihonNotes = validNotes
      .filter(n => {
        const t = (n.techniqueName || '').toLowerCase();
        return t.includes('kihon') || t.includes('dachi') || t.includes('zuki') || t.includes('uke') || t.includes('geri') || t.includes('básic');
      })
      .map(n => ({ evaluatorName: n.evaluatorName, note: n.observation }));

    const kataNotes = validNotes
      .filter(n => (n.techniqueName || '').toLowerCase().includes('kata') || (n.techniqueName || '').toLowerCase().includes('shodan') || (n.techniqueName || '').toLowerCase().includes('heian'))
      .map(n => ({ evaluatorName: n.evaluatorName, note: n.observation }));

    const kumiteNotes = validNotes
      .filter(n => (n.techniqueName || '').toLowerCase().includes('kumite') || (n.techniqueName || '').toLowerCase().includes('gohon') || (n.techniqueName || '').toLowerCase().includes('combate'))
      .map(n => ({ evaluatorName: n.evaluatorName, note: n.observation }));

    // Si algunas notas no coincidieron por nombre específico, distribuirlas según contexto
    validNotes.forEach(n => {
      const lowerObs = (n.observation || '').toLowerCase();
      const inK = kihonNotes.some(x => x.note === n.observation);
      const inKa = kataNotes.some(x => x.note === n.observation);
      const inKu = kumiteNotes.some(x => x.note === n.observation);
      if (!inK && !inKa && !inKu) {
        if (lowerObs.includes('kata') || lowerObs.includes('karategui') || lowerObs.includes('embusen') || lowerObs.includes('mirada')) {
          kataNotes.push({ evaluatorName: n.evaluatorName, note: n.observation });
        } else if (lowerObs.includes('kumite') || lowerObs.includes('combate') || lowerObs.includes('distancia') || lowerObs.includes('guardia') || lowerObs.includes('respiracion')) {
          kumiteNotes.push({ evaluatorName: n.evaluatorName, note: n.observation });
        } else {
          kihonNotes.push({ evaluatorName: n.evaluatorName, note: n.observation });
        }
      }
    });

    const synK = synthesizePhaseBulletsWithAI({
      phase: 'kihon',
      notesList: kihonNotes,
      techniqueScores: lowTechs.filter(t => t.group === 'kihon'),
      phaseAverage: pct,
      targetRank
    });
    const synKa = synthesizePhaseBulletsWithAI({
      phase: 'kata',
      notesList: kataNotes,
      techniqueScores: lowTechs.filter(t => t.group === 'kata'),
      phaseAverage: pct,
      targetRank
    });
    const synKu = synthesizePhaseBulletsWithAI({
      phase: 'kumite',
      notesList: kumiteNotes,
      techniqueScores: lowTechs.filter(t => t.group === 'kumite'),
      phaseAverage: pct,
      targetRank
    });

    const combinedList = [];
    synK.forEach(b => combinedList.push(`* ${b.text}`));
    synKa.forEach(b => combinedList.push(`* ${b.text}`));
    synKu.forEach(b => combinedList.push(`* ${b.text}`));

    const fallbackList = generateShotokanFeedbackBullets({
      percentage: pct,
      targetRank,
      techniques,
      validNotes
    });

    fallbackList.forEach(fb => {
      const isExtra = fb.includes('100%') || fb.includes('no aprobación') || fb.includes('demostrados');
      if (isExtra && !combinedList.some(c => c.slice(0, 20) === fb.slice(0, 20))) {
        combinedList.push(fb);
      }
    });

    const synthesizedVerdict = combinedList.length > 0 ? combinedList.join('\n') : fallbackList.join('\n');

    return {
      success: true,
      summary: synthesizedVerdict,
      source: 'expert-engine'
    };
  } catch (error) {
    console.error('Error al sintetizar observaciones con IA:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar la síntesis con IA.'
    };
  }
}

/**
 * Guardar el dictamen consolidado final del tribunal en MongoDB
 */
export async function saveConsolidatedVerdict({
  studentId,
  studentName,
  studentRank,
  targetRank,
  dojoId,
  dojoName,
  syllabusId,
  syllabusName,
  evaluators = [],
  averagedScores = {},
  averagedTechniqueScores = {},
  overallPercentage = 0,
  isPassed = false,
  rawObservationsByTechnique = {},
  aiConsolidatedSummary = '',
  consolidatedBy = 'Comisión Técnica ISKF'
}) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para oficializar actas de examen.' };
    }

    await dbConnect();

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return { success: false, error: 'ID de estudiante inválido.' };
    }

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return { success: false, error: 'ID de Dojo inválido.' };
    }

    const query = {
      studentId: new mongoose.Types.ObjectId(studentId),
      ...(syllabusId ? { syllabusId: String(syllabusId) } : {})
    };

    // Fetch syllabus snapshot if an ID is provided
    const syllabusDoc = syllabusId ? await ExamSyllabus.findById(syllabusId).lean() : null;

    const updateData = {
      studentId: new mongoose.Types.ObjectId(studentId),
      studentName: studentName || 'Estudiante',
      studentRank: studentRank || '10° Kyu (Cinta Blanca)',
      targetRank: targetRank || '10° Kyu (Cinta Blanca)',
      dojoId: new mongoose.Types.ObjectId(dojoId),
      dojoName: dojoName || '',
      syllabusId: syllabusId ? String(syllabusId) : '',
      syllabusName: syllabusName || 'Temario Oficial ISKF',
      evaluators: evaluators || [],
      evaluatorCount: evaluators.length || 1,
      averagedScores: averagedScores || {},
      averagedTechniqueScores: averagedTechniqueScores || {},
      overallPercentage: Number(overallPercentage) || 0,
      isPassed: Boolean(isPassed),
      rawObservationsByTechnique: rawObservationsByTechnique || {},
      aiConsolidatedSummary: String(aiConsolidatedSummary || '').trim(),
      consolidatedBy: consolidatedBy || session.user.name || 'Comisión Técnica ISKF',
      status: 'oficializado',
      consolidatedAt: new Date(),
      // Snapshot of the criteria (techniques and technical aspects) used for this exam
      criteriaSnapshot: syllabusDoc
        ? {
            techniques: syllabusDoc.techniques || [],
            technicalAspects: syllabusDoc.technicalAspects || [],
          }
        : {},
    };

    const doc = await TechnicalExamConsolidation.findOneAndUpdate(
      query,
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/examinations');

    return {
      success: true,
      consolidationId: doc._id.toString(),
      summary: doc.aiConsolidatedSummary,
      message: 'Dictamen consolidado del tribunal guardado exitosamente en base de datos.'
    };
  } catch (error) {
    console.error('Error al guardar dictamen consolidado:', error);
    return { success: false, error: error.message || 'Error al persistir dictamen consolidado.' };
  }
}

/**
 * Obtener todos los dictámenes consolidados de un dojo y temario
 */
export async function getConsolidatedEvaluationsByDojo(dojoId, syllabusId = null) {
  try {
    await dbConnect();

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return [];
    }

    const query = { dojoId: new mongoose.Types.ObjectId(dojoId) };
    if (syllabusId) {
      query.syllabusId = String(syllabusId);
    }

    const consolidations = await TechnicalExamConsolidation.find(query).sort({ updatedAt: -1 }).lean();

    return consolidations.map(c => ({
      _id: c._id.toString(),
      id: c._id.toString(),
      studentId: c.studentId.toString(),
      studentName: c.studentName,
      studentRank: c.studentRank,
      targetRank: c.targetRank,
      dojoId: c.dojoId.toString(),
      dojoName: c.dojoName,
      syllabusId: c.syllabusId,
      syllabusName: c.syllabusName,
      evaluators: c.evaluators || [],
      evaluatorCount: c.evaluatorCount || 1,
      averagedScores: c.averagedScores || {},
      averagedTechniqueScores: c.averagedTechniqueScores || {},
      overallPercentage: c.overallPercentage || 0,
      isPassed: c.isPassed,
      rawObservationsByTechnique: c.rawObservationsByTechnique || {},
      aiConsolidatedSummary: c.aiConsolidatedSummary || '',
      criteriaSnapshot: c.criteriaSnapshot || null,
      consolidatedBy: c.consolidatedBy,
      status: c.status,
      consolidatedAt: c.consolidatedAt ? c.consolidatedAt.toISOString() : null,
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error('Error al obtener dictámenes consolidados:', error);
    return [];
  }
}

/**
 * ============================================================================
 * ETAPA 1: CREAR CONVOCATORIA DE EXAMEN Y GENERAR ENLACE ÚNICO
 * ============================================================================
 */
export async function createTechnicalExamCall({
  dojoId,
  title = 'Convocatoria Oficial de Examen Técnico ISKF',
  examDate,
  startTime = '09:00 AM',
  location = '',
  notes = '',
  syllabusIds = [],
  evaluators = [],
  maxPerTanda = 6
}) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para crear convocatorias de examen.' };
    }

    await dbConnect();

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return { success: false, error: 'ID de Dojo inválido.' };
    }

    const dojo = await Dojo.findById(dojoId).lean();
    if (!dojo) {
      return { success: false, error: 'Dojo no encontrado.' };
    }

    // Helper para generar tokens amigables y únicos por evaluador
    const generateSenseiToken = (name = 'sensei', _email = '') => {
      const base = (name || 'sensei').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
      const rand = crypto.randomBytes(3).toString('hex');
      return `${base || 'sinodal'}-${rand}`;
    };

    // Sensei Roy Gatjens (padre) es el Director Nacional de la ISKF y siempre preside el tribunal examinador
    const isGatjensDirector = (e) => {
      const n = String(e?.name || '').toLowerCase();
      const em = String(e?.email || '').toLowerCase();
      return (n.includes('gatjens') || em.includes('roygatjens')) && !n.includes('lee') && !em.includes('roylee');
    };

    // Regla reglamentaria ISKF: El Sensei titular / dueño del dojo a evaluar NO puede ser evaluador de sus propios alumnos
    const isOwnerOfDojo = (e) => {
      if (!e || !dojo) return false;
      const normalize = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^sensei\s+/, '').trim();
      const eName = normalize(e?.name);
      const dSensei = normalize(dojo?.sensei);
      const eEmail = String(e?.email || '').toLowerCase().trim();
      const dEmail = String(dojo?.email || '').toLowerCase().trim();
      if (dSensei && eName && (dSensei === eName || dSensei.includes(eName) || eName.includes(dSensei))) return true;
      if (eEmail && dEmail && eEmail === dEmail) return true;
      return false;
    };

    const providedEvaluators = (Array.isArray(evaluators) && evaluators.length > 0) ? evaluators : [];
    const validEvaluators = providedEvaluators.filter(e => !isOwnerOfDojo(e));
    const existingRoy = validEvaluators.find(isGatjensDirector);
    const otherEvaluators = validEvaluators.filter(e => !isGatjensDirector(e));

    const royEvaluator = {
      name: 'Sensei Roy Gatjens',
      email: existingRoy?.email && existingRoy.email.includes('@') ? existingRoy.email.trim() : 'roygatjens@iskf.cr',
      role: 'Director Nacional / Sinodal Principal',
      token: existingRoy?.token || generateSenseiToken('Sensei Roy Gatjens', 'roygatjens@iskf.cr')
    };

    const formattedOthers = otherEvaluators.slice(0, 4).map((e, idx) => ({
      name: String(e.name || '').trim(),
      email: String(e.email || '').trim(),
      role: String(e.role || `Sinodal ${idx + 2}`).trim(),
      token: e.token || generateSenseiToken(e.name, e.email)
    }));

    const defaultEvaluators = [royEvaluator, ...formattedOthers];

    // Token seguro único de 32 caracteres hexadecimales para el enlace público del dojo
    const accessToken = crypto.randomBytes(16).toString('hex');

    // Capturar snapshot inmutable de los temarios vigentes para salvaguardar históricos
    let syllabusSnapshots = [];
    const targetSyllabusIds = Array.isArray(syllabusIds) && syllabusIds.length > 0
      ? syllabusIds.filter(id => mongoose.Types.ObjectId.isValid(id))
      : [];

    if (targetSyllabusIds.length > 0) {
      const foundSyllabi = await ExamSyllabus.find({ _id: { $in: targetSyllabusIds } }).lean();
      syllabusSnapshots = foundSyllabi.map(s => ({
        syllabusId: s._id.toString(),
        targetRank: s.targetRank,
        name: s.name,
        techniques: s.techniques || [],
        technicalAspects: s.technicalAspects || [],
        version: s.version || 1
      }));
    } else {
      const allActiveSyllabi = await ExamSyllabus.find({ isActive: { $ne: false } }).lean();
      syllabusSnapshots = allActiveSyllabi.map(s => ({
        syllabusId: s._id.toString(),
        targetRank: s.targetRank,
        name: s.name,
        techniques: s.techniques || [],
        technicalAspects: s.technicalAspects || [],
        version: s.version || 1
      }));
    }

    const newCall = await TechnicalExamCall.create({
      title: title.trim(),
      dojoId: dojo._id,
      dojoName: dojo.name,
      dojoSensei: dojo.sensei || '',
      examDate: examDate ? String(examDate).trim() : new Date().toISOString().split('T')[0],
      startTime: String(startTime).trim() || '09:00 AM',
      location: location ? String(location).trim() : (dojo.location || ''),
      accessToken,
      status: 'convocado',
      syllabusIds: syllabusIds || [],
      syllabusSnapshots,
      evaluators: defaultEvaluators,
      schedules: [],
      aspirants: [],
      maxPerTanda: Number(maxPerTanda) > 0 ? Number(maxPerTanda) : 6,
      notes: notes ? String(notes).trim() : '',
      createdBy: session.user.name || 'Comisión Técnica ISKF',
    });

    const safeCall = {
      _id: newCall._id.toString(),
      id: newCall._id.toString(),
      title: String(newCall.title || ''),
      dojoId: newCall.dojoId.toString(),
      dojoName: String(newCall.dojoName || ''),
      dojoSensei: String(newCall.dojoSensei || ''),
      examDate: String(newCall.examDate || ''),
      startTime: String(newCall.startTime || '09:00 AM'),
      location: String(newCall.location || ''),
      accessToken: String(newCall.accessToken || ''),
      status: String(newCall.status || 'convocado'),
      aspirantsCount: 0,
      evaluatorCount: defaultEvaluators.length,
      schedulesCount: 0,
      evaluators: defaultEvaluators.map(e => ({
        name: String(e.name || ''),
        email: String(e.email || ''),
        role: String(e.role || 'Sinodal'),
        token: String(e.token || '')
      })),
      schedules: [],
      aspirants: [],
      syllabusIds: (newCall.syllabusIds || []).map(String),
      syllabusSnapshots: syllabusSnapshots.map(s => ({
        syllabusId: String(s.syllabusId || ''),
        targetRank: String(s.targetRank || ''),
        name: String(s.name || ''),
        techniques: (s.techniques || []).map(t => ({
          id: String(t.id || ''),
          name: String(t.name || ''),
          group: String(t.group || ''),
          repetitions: Number(t.repetitions) || 3,
          notes: String(t.notes || '')
        })),
        technicalAspects: (s.technicalAspects || []).map(a => ({
          id: String(a.id || ''),
          category: String(a.category || ''),
          title: String(a.title || ''),
          points: Array.isArray(a.points) ? a.points.map(String) : []
        })),
        version: Number(s.version) || 1
      })),
      maxPerTanda: Number(newCall.maxPerTanda) || 6,
      notes: String(newCall.notes || ''),
      createdAt: newCall.createdAt ? newCall.createdAt.toISOString() : new Date().toISOString()
    };

    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/examinations');

    return {
      success: true,
      callId: safeCall.id,
      accessToken: safeCall.accessToken,
      link: `/convocatoria/${safeCall.accessToken}`,
      call: safeCall,
      message: 'Convocatoria creada exitosamente. Comparta el enlace con el Sensei del Dojo.'
    };
  } catch (error) {
    console.error('Error al crear convocatoria de examen:', error);
    return { success: false, error: error.message || 'Error al crear la convocatoria.' };
  }
}

/**
 * ============================================================================
 * ETAPA 2: OBTENER CONVOCATORIA POR TOKEN PARA EL SENSEI DEL DOJO
 * ============================================================================
 */
export async function getTechnicalExamCallByToken(accessToken) {
  try {
    await dbConnect();

    if (!accessToken || typeof accessToken !== 'string') {
      return { success: false, error: 'Token de convocatoria inválido.' };
    }

    const call = await TechnicalExamCall.findOne({ accessToken: accessToken.trim() }).lean();
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada o el enlace ha expirado.' };
    }

    // Cargar todos los alumnos activos del Dojo
    const students = await Student.find({
      dojoId: call.dojoId,
      status: 'active'
    }).sort({ name: 1 }).lean();

    // Cargar los temarios: priorizar el snapshot histórico de la convocatoria si existe
    let syllabi = [];
    if (Array.isArray(call.syllabusSnapshots) && call.syllabusSnapshots.length > 0) {
      syllabi = call.syllabusSnapshots;
    } else {
      syllabi = await ExamSyllabus.find({ isActive: { $ne: false } }).sort({ sortOrder: 1, name: 1 }).lean();
    }

    return {
      success: true,
      call: {
        _id: call._id.toString(),
        id: call._id.toString(),
        title: call.title,
        dojoId: call.dojoId.toString(),
        dojoName: call.dojoName,
        dojoSensei: call.dojoSensei,
        examDate: call.examDate,
        startTime: call.startTime,
        location: call.location,
        accessToken: call.accessToken,
        status: call.status,
        syllabusIds: call.syllabusIds || [],
        syllabusSnapshots: (call.syllabusSnapshots || []).map(s => ({
          syllabusId: String(s.syllabusId || s._id || ''),
          targetRank: String(s.targetRank || ''),
          name: String(s.name || ''),
          version: Number(s.version) || 1,
          techniques: (s.techniques || []).map(t => ({
            id: String(t.id || ''),
            name: String(t.name || ''),
            group: String(t.group || ''),
            repetitions: Number(t.repetitions) || 3,
            notes: String(t.notes || '')
          })),
          technicalAspects: (s.technicalAspects || []).map(a => ({
            id: String(a.id || ''),
            category: String(a.category || ''),
            title: String(a.title || ''),
            points: Array.isArray(a.points) ? a.points.map(String) : []
          }))
        })),
        evaluators: (call.evaluators || []).map(ev => ({
          name: ev.name || '',
          email: ev.email || '',
          role: ev.role || 'Sinodal'
        })),
        schedules: (call.schedules || []).map(sc => ({
          blockName: sc.blockName || '',
          startTime: sc.startTime || '',
          targetRanks: sc.targetRanks || [],
          studentIds: (sc.studentIds || []).map(id => id.toString())
        })),
        aspirants: (call.aspirants || []).map(a => ({
          studentId: a.studentId.toString(),
          studentName: a.studentName || '',
          currentRank: a.currentRank || '',
          targetRank: a.targetRank || '',
          scheduleBlock: a.scheduleBlock || '',
          promotedAt: a.promotedAt ? a.promotedAt.toISOString() : null,
        })),
        maxPerTanda: call.maxPerTanda || 6,
        notes: call.notes || '',
        createdAt: call.createdAt ? call.createdAt.toISOString() : null,
      },
      students: students.map(s => ({
        _id: s._id.toString(),
        id: s._id.toString(),
        name: s.name,
        birthDate: s.birthDate ? s.birthDate.toISOString() : null,
        currentRank: s.currentRank,
        dojoId: s.dojoId ? s.dojoId.toString() : '',
        dojoName: s.dojoName || '',
        photo: s.photo || '',
        notes: s.notes || '',
        positiveAspects: s.positiveAspects || '',
        hasSpecialCondition: Boolean(s.hasSpecialCondition),
        specialCondition: s.specialCondition || '',
        isPromotedForExam: Boolean(s.isPromotedForExam),
        promotedAt: s.promotedAt ? s.promotedAt.toISOString() : null,
      })),
      syllabi: syllabi.map(syl => ({
        _id: (syl._id || syl.syllabusId || '').toString(),
        id: (syl._id || syl.syllabusId || '').toString(),
        name: String(syl.name || ''),
        targetRank: String(syl.targetRank || ''),
        karanType: String(syl.karanType || ''),
        minimumScore: Number(syl.minimumScore) || 70,
        version: Number(syl.version) || 1,
        techniques: (syl.techniques || []).map(t => ({
          id: String(t.id || ''),
          name: String(t.name || ''),
          group: String(t.group || ''),
          repetitions: Number(t.repetitions) || 3,
          notes: String(t.notes || '')
        })),
        technicalAspects: (syl.technicalAspects || []).map(a => ({
          id: String(a.id || ''),
          category: String(a.category || ''),
          title: String(a.title || ''),
          points: Array.isArray(a.points) ? a.points.map(String) : []
        }))
      }))
    };
  } catch (error) {
    console.error('Error al obtener convocatoria por token:', error);
    return { success: false, error: 'Ocurrió un error al cargar la convocatoria.' };
  }
}

/**
 * ============================================================================
 * ETAPA 2: PROMOCIONAR / DESMARCAR ALUMNO PARA EL PADRÓN DE EXAMEN
 * ============================================================================
 */
export async function toggleStudentPromotionForCall({
  callId,
  studentId,
  isPromoted,
  targetRank = '',
  scheduleBlock = ''
}) {
  try {
    await dbConnect();

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return { success: false, error: 'ID de estudiante inválido.' };
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return { success: false, error: 'Estudiante no encontrado.' };
    }

    // Actualizar bandera en el modelo de estudiante
    student.isPromotedForExam = Boolean(isPromoted);
    student.promotedAt = isPromoted ? new Date() : null;
    await student.save();

    // Actualizar el padrón de aspirantes en la convocatoria
    const call = await TechnicalExamCall.findById(callId);
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    if (!Array.isArray(call.aspirants)) {
      call.aspirants = [];
    }

    const existingIndex = call.aspirants.findIndex(
      a => a.studentId.toString() === studentId.toString()
    );

    if (isPromoted) {
      const aspirantData = {
        studentId: student._id,
        studentName: student.name,
        currentRank: student.currentRank,
        targetRank: targetRank || student.currentRank,
        scheduleBlock: scheduleBlock || '',
        promotedAt: new Date(),
      };

      if (existingIndex >= 0) {
        call.aspirants[existingIndex] = aspirantData;
      } else {
        call.aspirants.push(aspirantData);
      }
    } else {
      if (existingIndex >= 0) {
        call.aspirants.splice(existingIndex, 1);
      }
    }

    await call.save();

    revalidatePath(`/convocatoria/${call.accessToken}`);
    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      isPromoted: Boolean(isPromoted),
      aspirantsCount: call.aspirants.length,
      message: isPromoted
        ? `${student.name} fue agregado(a) al Padrón Oficial de Examen.`
        : `${student.name} fue retirado(a) del Padrón de Examen.`
    };
  } catch (error) {
    console.error('Error al alternar promoción de estudiante:', error);
    return { success: false, error: error.message || 'Error al actualizar promoción del aspirante.' };
  }
}

/**
 * ============================================================================
 * ETAPA 2: INSCRIPCIÓN RÁPIDA DE ALUMNO NUEVO DIRECTO AL PADRÓN
 * ============================================================================
 */
export async function quickRegisterStudentForCall({
  callId,
  dojoId,
  dojoName,
  name,
  birthDate,
  currentRank,
  targetRank = '',
  scheduleBlock = ''
}) {
  try {
    await dbConnect();

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }
    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return { success: false, error: 'ID de Dojo inválido.' };
    }
    if (!name || !name.trim()) {
      return { success: false, error: 'El nombre completo del karateca es obligatorio.' };
    }

    const newStudent = await Student.create({
      name: name.trim(),
      birthDate: birthDate ? new Date(birthDate) : new Date('2010-01-01'),
      currentRank: currentRank ? currentRank.trim() : '10° Kyu (Cinta Blanca)',
      dojoId: new mongoose.Types.ObjectId(dojoId),
      dojoName: dojoName ? dojoName.trim() : 'Dojo Afiliado ISKF',
      status: 'active',
      isPromotedForExam: true,
      promotedAt: new Date(),
    });

    const call = await TechnicalExamCall.findById(callId);
    if (call) {
      if (!Array.isArray(call.aspirants)) call.aspirants = [];
      call.aspirants.push({
        studentId: newStudent._id,
        studentName: newStudent.name,
        currentRank: newStudent.currentRank,
        targetRank: targetRank || newStudent.currentRank,
        scheduleBlock: scheduleBlock || '',
        promotedAt: new Date(),
      });
      await call.save();
    }

    revalidatePath(`/convocatoria/${call?.accessToken}`);
    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      student: {
        _id: newStudent._id.toString(),
        name: newStudent.name,
        currentRank: newStudent.currentRank,
        isPromotedForExam: true,
      },
      message: `${newStudent.name} registrado(a) e incorporado(a) al Padrón Oficial con éxito.`
    };
  } catch (error) {
    console.error('Error al registrar alumno rápido:', error);
    return { success: false, error: error.message || 'Error al inscribir al karateca.' };
  }
}

/**
 * ============================================================================
 * ETAPA 3: ACTUALIZAR HORARIOS PROGRAMADOS Y TRIBUNAL DE EVALUADORES
 * ============================================================================
 */
export async function updateExamCallSchedulesAndEvaluators({
  callId,
  schedules = [],
  evaluators = [],
  status = null
}) {
  try {
    await dbConnect();

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }

    const call = await TechnicalExamCall.findById(callId);
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    if (Array.isArray(schedules)) {
      call.schedules = schedules;
    }

    if (Array.isArray(evaluators) && evaluators.length > 0) {
      const dojo = await Dojo.findById(call.dojoId).lean();
      const isOwnerOfDojo = (e) => {
        if (!e || !dojo) return false;
        const normalize = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^sensei\s+/, '').trim();
        const eName = normalize(e?.name);
        const dSensei = normalize(dojo?.sensei);
        const eEmail = String(e?.email || '').toLowerCase().trim();
        const dEmail = String(dojo?.email || '').toLowerCase().trim();
        if (dSensei && eName && (dSensei === eName || dSensei.includes(eName) || eName.includes(dSensei))) return true;
        if (eEmail && dEmail && eEmail === dEmail) return true;
        return false;
      };

      // Tribunal de 1 a 5 evaluadores: Sensei Roy Gatjens (Director Nacional) siempre encabeza la mesa en la posición 0
      const isGatjensDirector = (e) => {
        const n = String(e?.name || '').toLowerCase();
        const em = String(e?.email || '').toLowerCase();
        return (n.includes('gatjens') || em.includes('roygatjens')) && !n.includes('lee') && !em.includes('roylee');
      };

      const validEvaluators = evaluators.filter(e => !isOwnerOfDojo(e));
      const existingRoy = validEvaluators.find(isGatjensDirector);
      const otherEvaluators = validEvaluators.filter(e => !isGatjensDirector(e));

      const royEvaluator = {
        name: 'Sensei Roy Gatjens',
        email: existingRoy?.email && existingRoy.email.includes('@') ? existingRoy.email.trim() : 'roygatjens@iskf.cr',
        role: 'Director Nacional / Sinodal Principal',
        token: existingRoy?.token || `${(existingRoy?.name || 'roygatjens').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}`
      };

      const formattedOthers = otherEvaluators.slice(0, 4).map((e, idx) => ({
        name: String(e.name || '').trim(),
        email: String(e.email || '').trim(),
        role: String(e.role || `Sinodal ${idx + 2}`).trim(),
        token: e.token || `${(e.name || 'sinodal').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}`
      }));

      call.evaluators = [royEvaluator, ...formattedOthers];
    }

    if (status && ['convocado', 'programado', 'en_tatami', 'cerrado'].includes(status)) {
      call.status = status;
    } else if (call.status === 'convocado' && schedules.length > 0) {
      call.status = 'programado';
    }

    await call.save();

    revalidatePath(`/convocatoria/${call.accessToken}`);
    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      status: call.status,
      evaluatorCount: call.evaluators.length,
      evaluators: call.evaluators.map(e => ({
        name: e.name,
        email: e.email,
        role: e.role,
        token: e.token
      })),
      scheduleCount: call.schedules.length,
      message: 'Horarios de atención y mesa de evaluadores actualizados exitosamente.'
    };
  } catch (error) {
    console.error('Error al actualizar horarios y tribunal:', error);
    return { success: false, error: error.message || 'Error al actualizar horarios y tribunal.' };
  }
}

/**
 * ============================================================================
 * ETAPA 5: CIERRE OFICIAL DE CONVOCATORIA DE EXAMEN
 * ============================================================================
 */
export async function closeExamCall({ callId, force = false }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'Solo el Sensei Administrador puede cerrar la convocatoria de examen.' };
    }

    await dbConnect();

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }

    const callObjId = new mongoose.Types.ObjectId(callId);
    const call = await TechnicalExamCall.findById(callObjId).lean();

    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    if (call.status === 'cerrado') {
      return { success: false, error: 'La convocatoria ya se encuentra cerrada.' };
    }

    // Identificar aspirantes convocados
    const rawStudentIds = [
      ...(call.aspirants || []).map(a => a.studentId?.toString()),
      ...(call.schedules || []).flatMap(s => (s.studentIds || []).map(String))
    ].filter(Boolean);
    const uniqueStudentIds = [...new Set(rawStudentIds)].filter(id => mongoose.Types.ObjectId.isValid(id));

    // Si no es un cierre forzado explícito, verificar completitud estricta de Kihon y demás fases
    if (!force && uniqueStudentIds.length > 0) {
      const studentObjIds = uniqueStudentIds.map(id => new mongoose.Types.ObjectId(id));
      const students = await Student.find({ _id: { $in: studentObjIds } }).select('name currentRank targetRank').lean();
      const studentNameMap = new Map();
      students.forEach(s => studentNameMap.set(s._id.toString(), s.name));

      // Mapear técnicas esperadas de los temarios de la convocatoria
      const techGroupMap = {};
      let expectedKihon = 0;
      let expectedKata = 0;
      let expectedKumite = 0;

      (call.syllabusSnapshots || []).forEach(snap => {
        (snap.techniques || []).forEach(t => {
          if (t.id) {
            const grp = (t.group || t.phase || 'kihon').toLowerCase();
            techGroupMap[t.id] = grp;
            if (grp === 'kihon') expectedKihon++;
            else if (grp === 'kata') expectedKata++;
            else if (grp === 'kumite') expectedKumite++;
          }
        });
      });

      if (expectedKihon === 0) expectedKihon = 6;
      if (expectedKata === 0) expectedKata = 1;
      if (expectedKumite === 0) expectedKumite = 1;

      // Buscar evaluaciones registradas para esta convocatoria
      const evaluations = await TechnicalExamEvaluation.find({ callId: callObjId }).lean();

      // Analizar avance por alumno (agrupando evaluaciones)
      const studentKihonStatus = {};
      const studentKataStatus = {};
      const studentKumiteStatus = {};

      uniqueStudentIds.forEach(stId => {
        studentKihonStatus[stId] = { techs: new Set(), scores: 0 };
        studentKataStatus[stId] = { techs: new Set(), scores: 0 };
        studentKumiteStatus[stId] = { techs: new Set(), scores: 0 };
      });

      evaluations.forEach(ev => {
        const stId = ev.studentId?.toString();
        if (!stId || !studentKihonStatus[stId]) return;

        Object.entries(ev.scores || {}).forEach(([k, val]) => {
          if (typeof val !== 'number' || val <= 0) return;
          const prefix = k.split('_')[0];
          const grpFromMap = techGroupMap[prefix];
          if (grpFromMap === 'kata' || k.includes('_kata_') || prefix.includes('-ka') || k.startsWith('kata_')) {
            studentKataStatus[stId].scores++;
          } else if (grpFromMap === 'kumite' || k.includes('_kumite_') || prefix.includes('-ku') || k.startsWith('kumite_')) {
            studentKumiteStatus[stId].scores++;
          } else if (k.startsWith('aspect_') || k.startsWith('eval_aspect_') || k.includes('_aspectos_')) {
            // aspectos
          } else {
            studentKihonStatus[stId].scores++;
          }
        });

        Object.keys(ev.techniqueAverages || {}).forEach(techKey => {
          const grp = techGroupMap[techKey] || (techKey.includes('-ka') ? 'kata' : techKey.includes('-ku') ? 'kumite' : techKey.startsWith('aspect') ? 'aspectos' : 'kihon');
          if (grp === 'kihon') studentKihonStatus[stId].techs.add(techKey);
          else if (grp === 'kata') studentKataStatus[stId].techs.add(techKey);
          else if (grp === 'kumite') studentKumiteStatus[stId].techs.add(techKey);
        });

        if (ev.phaseNotes?.kihon) studentKihonStatus[stId].scores++;
        if (ev.phaseNotes?.kata) studentKataStatus[stId].scores++;
        if (ev.phaseNotes?.kumite) studentKumiteStatus[stId].scores++;
      });

      // Validar si Kihon y demás fases están completadas
      const pendingKihonStudents = [];
      const pendingKataStudents = [];
      const pendingKumiteStudents = [];

      uniqueStudentIds.forEach(stId => {
        const sName = studentNameMap.get(stId) || 'Aspirante sin nombre';
        const kStatus = studentKihonStatus[stId];
        const kaStatus = studentKataStatus[stId];
        const kuStatus = studentKumiteStatus[stId];

        const kihonIsDone = kStatus.techs.size >= expectedKihon || (kStatus.scores >= expectedKihon && kStatus.techs.size > 0);
        if (!kihonIsDone) {
          pendingKihonStudents.push({ id: stId, name: sName, evaluatedTechs: kStatus.techs.size, expectedTechs: expectedKihon });
        }

        const kataIsDone = kaStatus.techs.size >= expectedKata || (kaStatus.scores >= expectedKata && kaStatus.techs.size > 0);
        if (!kataIsDone) {
          pendingKataStudents.push({ id: stId, name: sName, evaluatedTechs: kaStatus.techs.size, expectedTechs: expectedKata });
        }

        const kumiteIsDone = kuStatus.techs.size >= expectedKumite || (kuStatus.scores >= expectedKumite && kuStatus.techs.size > 0);
        if (!kumiteIsDone) {
          pendingKumiteStudents.push({ id: stId, name: sName, evaluatedTechs: kuStatus.techs.size, expectedTechs: expectedKumite });
        }
      });

      if (pendingKihonStudents.length > 0 || pendingKataStudents.length > 0 || pendingKumiteStudents.length > 0) {
        const missingMessages = [];
        if (pendingKihonStudents.length > 0) {
          const names = pendingKihonStudents.map(p => p.name).join(', ');
          missingMessages.push(`🥋 Kihon incompleto (${uniqueStudentIds.length - pendingKihonStudents.length}/${uniqueStudentIds.length} completados): Faltan ${names}`);
        }
        if (pendingKataStudents.length > 0) {
          const names = pendingKataStudents.map(p => p.name).join(', ');
          missingMessages.push(`🥋 Kata incompleto (${uniqueStudentIds.length - pendingKataStudents.length}/${uniqueStudentIds.length} completados): Faltan ${names}`);
        }
        if (pendingKumiteStudents.length > 0) {
          const names = pendingKumiteStudents.map(p => p.name).join(', ');
          missingMessages.push(`🥋 Kumite incompleto (${uniqueStudentIds.length - pendingKumiteStudents.length}/${uniqueStudentIds.length} completados): Faltan ${names}`);
        }

        return {
          success: false,
          isIncomplete: true,
          totalStudents: uniqueStudentIds.length,
          pendingKihonCount: pendingKihonStudents.length,
          pendingKataCount: pendingKataStudents.length,
          pendingKumiteCount: pendingKumiteStudents.length,
          pendingKihonStudents,
          pendingKataStudents,
          pendingKumiteStudents,
          error: `No se puede cerrar el examen porque las evaluaciones técnicas están incompletas:\n\n${missingMessages.join('\n')}`
        };
      }
    }

    const updatedCall = await TechnicalExamCall.findByIdAndUpdate(
      callId,
      {
        $set: {
          status: 'cerrado',
          closedAt: new Date(),
          closedForced: Boolean(force)
        }
      },
      { new: true }
    );

    if (!updatedCall) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    revalidatePath(`/convocatoria/${updatedCall.accessToken}`);
    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/examinations');

    return {
      success: true,
      closedAt: updatedCall.closedAt.toISOString(),
      closedForced: Boolean(force),
      message: force
        ? 'Convocatoria de examen cerrada de forma forzada por el administrador.'
        : 'Convocatoria de examen cerrada oficialmente. Se ha finalizado la mesa de evaluación.'
    };
  } catch (error) {
    console.error('Error al cerrar convocatoria de examen:', error);
    return { success: false, error: error.message || 'Error al cerrar la convocatoria.' };
  }
}

/**
 * Reabrir convocatoria de examen para continuar evaluando
 */
export async function reopenExamCall({ callId, targetStatus = 'en_tatami' }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'Solo el Sensei Administrador puede reabrir la convocatoria de examen.' };
    }

    await dbConnect();

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }

    const validStatuses = ['convocado', 'programado', 'en_tatami'];
    const newStatus = validStatuses.includes(targetStatus) ? targetStatus : 'en_tatami';

    const call = await TechnicalExamCall.findByIdAndUpdate(
      callId,
      {
        $set: {
          status: newStatus,
          closedAt: null,
          reopenedAt: new Date()
        }
      },
      { new: true }
    );

    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    revalidatePath(`/convocatoria/${call.accessToken}`);
    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/examinations');

    return {
      success: true,
      newStatus: call.status,
      message: `Convocatoria de examen reabierta exitosamente (estado: ${call.status}). El tribunal examinador puede continuar con la evaluación.`
    };
  } catch (error) {
    console.error('Error al reabrir convocatoria de examen:', error);
    return { success: false, error: error.message || 'Error al reabrir la convocatoria.' };
  }
}

/**
 * ============================================================================
 * ELIMINAR CONVOCATORIA DE EXAMEN
 * ============================================================================
 */
export async function deleteExamCall({ callId }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para eliminar la convocatoria de examen.' };
    }

    await dbConnect();

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }

    const call = await TechnicalExamCall.findByIdAndDelete(callId);
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/examinations');

    return {
      success: true,
      message: 'Convocatoria de examen eliminada exitosamente.'
    };
  } catch (error) {
    console.error('Error al eliminar convocatoria de examen:', error);
    return { success: false, error: error.message || 'Error al eliminar la convocatoria.' };
  }
}

/**
 * Obtener convocatorias de examen por dojo
 */
export async function getExamCallsByDojo(dojoId) {
  try {
    await dbConnect();

    const query = (dojoId && dojoId !== 'all' && mongoose.Types.ObjectId.isValid(dojoId))
      ? { dojoId: new mongoose.Types.ObjectId(dojoId) }
      : {};

    const calls = await TechnicalExamCall.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return calls.map(c => ({
      _id: c._id.toString(),
      id: c._id.toString(),
      title: c.title,
      dojoId: c.dojoId.toString(),
      dojoName: c.dojoName,
      dojoSensei: c.dojoSensei || '',
      examDate: c.examDate,
      startTime: c.startTime || '09:00 AM',
      location: c.location || '',
      accessToken: c.accessToken,
      status: c.status,
      aspirantsCount: (c.aspirants || []).length,
      evaluatorCount: (c.evaluators || []).length,
      schedulesCount: (c.schedules || []).length,
      evaluators: (c.evaluators || []).map(e => ({
        name: e.name,
        email: e.email,
        role: e.role,
        token: e.token || `${(e.name || 'sinodal').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}`
      })),
      schedules: (c.schedules || []).map(s => ({
        blockName: s.blockName,
        startTime: s.startTime,
        endTime: s.endTime || '',
        targetRanks: s.targetRanks || [],
        studentIds: (s.studentIds || []).map(id => id.toString())
      })),
      aspirants: (c.aspirants || []).map(a => ({
        studentId: a.studentId.toString(),
        studentName: a.studentName,
        currentRank: a.currentRank,
        targetRank: a.targetRank,
        scheduleBlock: a.scheduleBlock
      })),
      maxPerTanda: c.maxPerTanda || 6,
      syllabusIds: (c.syllabusIds || []).map(String),
      syllabusSnapshots: (c.syllabusSnapshots || []).map(s => ({
        syllabusId: String(s.syllabusId || s._id || ''),
        targetRank: String(s.targetRank || ''),
        name: String(s.name || ''),
        version: Number(s.version) || 1,
        techniques: (s.techniques || []).map(t => ({
          id: String(t.id || ''),
          name: String(t.name || ''),
          group: String(t.group || ''),
          repetitions: Number(t.repetitions) || 3,
          notes: String(t.notes || '')
        })),
        technicalAspects: (s.technicalAspects || []).map(a => ({
          id: String(a.id || ''),
          category: String(a.category || ''),
          title: String(a.title || ''),
          points: Array.isArray(a.points) ? a.points.map(String) : []
        }))
      })),
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      closedAt: c.closedAt ? c.closedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error('Error al obtener convocatorias por dojo:', error);
    return [];
  }
}

/**
 * Obtener estudiantes de un dojo que están listos para examen (isPromotedForExam = true)
 */
export async function getStudentsReadyForExam(dojoId) {
  try {
    await dbConnect();
    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return [];
    }

    const students = await Student.find({
      dojoId: new mongoose.Types.ObjectId(dojoId),
      isPromotedForExam: true,
      status: 'active'
    }).sort({ currentRank: 1, name: 1 }).lean();

    return students.map(s => ({
      _id: s._id.toString(),
      id: s._id.toString(),
      name: s.name,
      currentRank: s.currentRank,
      birthDate: s.birthDate ? s.birthDate.toISOString() : null,
      photo: s.photo || '',
      hasSpecialCondition: Boolean(s.hasSpecialCondition),
      specialCondition: s.specialCondition || '',
      positiveAspects: s.positiveAspects || '',
      notes: s.notes || '',
      isPromotedForExam: true,
    }));
  } catch (error) {
    console.error('Error al obtener estudiantes listos para examen:', error);
    return [];
  }
}

/**
 * Actualizar la capacidad máxima de karatecas por tanda en una convocatoria
 */
export async function updateExamCallMaxPerTanda({ callId, maxPerTanda }) {
  try {
    await dbConnect();
    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }
    const safeMax = parseInt(maxPerTanda, 10);
    if (isNaN(safeMax) || safeMax < 1 || safeMax > 50) {
      return { success: false, error: 'La capacidad por tanda debe ser un número entre 1 y 50.' };
    }

    const call = await TechnicalExamCall.findById(callId);
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    call.maxPerTanda = safeMax;
    await call.save();

    revalidatePath('/admin/examinations/technical');
    revalidatePath(`/convocatoria/${call.accessToken}`);

    return {
      success: true,
      maxPerTanda: call.maxPerTanda,
      message: `Capacidad de tandas configurada a ${call.maxPerTanda} karatecas.`
    };
  } catch (error) {
    console.error('Error al actualizar capacidad por tanda:', error);
    return { success: false, error: error.message || 'Error al actualizar capacidad por tanda.' };
  }
}

/**
 * Guardar las tandas y sus horarios para una convocatoria
 */
export async function saveCallSchedules({ callId, schedules = [], maxPerTanda = null }) {
  try {
    await dbConnect();
    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }

    const call = await TechnicalExamCall.findById(callId);
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    if (typeof maxPerTanda === 'number' && maxPerTanda > 0 && maxPerTanda <= 50) {
      call.maxPerTanda = Math.round(maxPerTanda);
    }

    call.schedules = schedules.map(s => ({
      blockName: String(s.blockName || '').trim(),
      startTime: String(s.startTime || '').trim(),
      endTime: String(s.endTime || '').trim(),
      targetRanks: Array.isArray(s.targetRanks) ? s.targetRanks : [],
      studentIds: Array.isArray(s.studentIds) ? s.studentIds.map(id => String(id)) : []
    }));

    if (call.status === 'convocado' && call.schedules.length > 0) {
      call.status = 'programado';
    }

    // Asegurar que cualquier alumno asignado en tanda esté registrado en el padrón de aspirantes
    const existingAspirantIds = new Set((call.aspirants || []).map(a => a.studentId.toString()));
    const allScheduleStudentIds = [...new Set(call.schedules.flatMap(s => s.studentIds || []))];
    const missingStudentIds = allScheduleStudentIds.filter(id => !existingAspirantIds.has(id) && mongoose.Types.ObjectId.isValid(id));

    if (missingStudentIds.length > 0) {
      const missingStudents = await Student.find({
        _id: { $in: missingStudentIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).lean();

      missingStudents.forEach(st => {
        call.aspirants.push({
          studentId: st._id,
          studentName: st.name,
          currentRank: st.currentRank,
          targetRank: st.currentRank,
          scheduleBlock: '',
          promotedAt: new Date()
        });
      });
    }

    await call.save();

    revalidatePath('/admin/examinations/technical');
    revalidatePath(`/convocatoria/${call.accessToken}`);
    revalidatePath('/evaluar', 'layout');

    return {
      success: true,
      status: call.status,
      schedules: call.schedules.map(s => ({
        blockName: s.blockName,
        startTime: s.startTime,
        endTime: s.endTime,
        targetRanks: s.targetRanks,
        studentIds: s.studentIds.map(id => id.toString())
      })),
      message: 'Tandas de examen guardadas con éxito.'
    };
  } catch (error) {
    console.error('Error al guardar tandas de convocatoria:', error);
    return { success: false, error: error.message || 'Error al guardar las tandas.' };
  }
}

/**
 * ============================================================================
 * ETAPA 6: EVALUACIÓN DE SINODAL POR ENLACE PRIVADO (TOKEN DE EVALUADOR)
 * ============================================================================
 */

/**
 * Obtener datos completos de convocatoria para el Sinodal mediante su enlace único
 */
export async function getExamCallForEvaluator({ accessToken, evaluatorToken }) {
  try {
    await dbConnect();

    if (!accessToken || typeof accessToken !== 'string') {
      return { success: false, error: 'Enlace de examen inválido o incompleto.' };
    }

    let call = await TechnicalExamCall.findOne({ accessToken: accessToken.trim() }).lean();
    if (!call) {
      // Fallback a la convocatoria activa más reciente si el enlace era de una versión previa recreada
      call = await TechnicalExamCall.findOne({ status: { $ne: 'cerrado' } }).sort({ createdAt: -1 }).lean();
    }
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada o el examen ha finalizado.' };
    }

    // Localizar al evaluador en el tribunal colegiado
    const evaluators = Array.isArray(call.evaluators) ? call.evaluators : [];
    let evaluator = evaluators.find(e => e.token && e.token === evaluatorToken);

    // Fallback si el token viene como email o si hay un solo evaluador
    if (!evaluator) {
      evaluator = evaluators.find(e => e.email === evaluatorToken) || evaluators[0];
    }

    if (!evaluator) {
      return { success: false, error: 'No se encontró un Sensei Evaluador válido asignado a este enlace.' };
    }

    // Recolectar todos los IDs de estudiantes de la convocatoria (aspirantes + asignados en tandas)
    const rawStudentIds = [
      ...(call.aspirants || []).map(a => a.studentId.toString()),
      ...(call.schedules || []).flatMap(s => (s.studentIds || []).map(String))
    ];
    const uniqueStudentIds = [...new Set(rawStudentIds)].filter(id => mongoose.Types.ObjectId.isValid(id));

    // Cargar estudiantes
    const students = await Student.find({
      _id: { $in: uniqueStudentIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).lean();

    // Cargar temarios oficiales de la base de datos
    const syllabi = await ExamSyllabus.find({}).sort({ name: 1 }).lean();

    // Cargar evaluaciones ya emitidas previamente por este evaluador para esta convocatoria
    const evalQuery = {
      evaluatorEmail: evaluator.email,
      studentId: { $in: uniqueStudentIds.map(id => new mongoose.Types.ObjectId(id)) }
    };
    if (call._id) {
      evalQuery.callId = call._id;
    }
    const evaluations = await TechnicalExamEvaluation.find(evalQuery).lean();

    return {
      success: true,
      call: {
        _id: call._id.toString(),
        id: call._id.toString(),
        title: call.title,
        dojoId: call.dojoId.toString(),
        dojoName: call.dojoName,
        dojoSensei: call.dojoSensei || '',
        examDate: call.examDate,
        startTime: call.startTime || '09:00 AM',
        location: call.location || '',
        accessToken: call.accessToken,
        status: call.status,
        maxPerTanda: call.maxPerTanda || 6,
        schedules: (call.schedules || []).map(s => ({
          blockName: s.blockName,
          startTime: s.startTime,
          endTime: s.endTime || '',
          targetRanks: s.targetRanks || [],
          studentIds: (s.studentIds || []).map(id => id.toString())
        })),
        evaluators: evaluators.map(e => ({
          name: e.name,
          email: e.email,
          role: e.role,
          token: e.token
        }))
      },
      evaluator: {
        name: evaluator.name,
        email: evaluator.email,
        role: evaluator.role || 'Sinodal',
        token: evaluator.token || evaluatorToken
      },
      students: students.map(s => {
        const aspirantInfo = (call.aspirants || []).find(a => a.studentId.toString() === s._id.toString());
        return {
          _id: s._id.toString(),
          id: s._id.toString(),
          name: s.name,
          birthDate: s.birthDate ? s.birthDate.toISOString() : null,
          currentRank: s.currentRank,
          targetRank: aspirantInfo?.targetRank || s.targetRank || s.currentRank,
          photo: s.photo || '',
          dojoId: s.dojoId ? s.dojoId.toString() : '',
          dojoName: s.dojoName || '',
          status: s.status,
          notes: s.notes || '',
          positiveAspects: s.positiveAspects || '',
          hasSpecialCondition: Boolean(s.hasSpecialCondition),
          specialCondition: s.specialCondition || '',
          isPromotedForExam: Boolean(s.isPromotedForExam),
          promotedAt: s.promotedAt ? s.promotedAt.toISOString() : null
        };
      }),
      syllabi: syllabi.map(s => ({
        _id: s._id.toString(),
        id: s._id.toString(),
        name: s.name,
        currentRank: s.currentRank,
        targetRank: s.targetRank,
        targetRanks: [s.targetRank, s.currentRank].filter(Boolean),
        description: s.description || '',
        techniques: (s.techniques || []).map(t => ({
          id: t.id || Math.random().toString(36).substring(2, 9),
          group: t.group,
          phase: t.group,
          name: t.name,
          stance: t.stance || '',
          direction: t.direction || '',
          repetitions: Number(t.repetitions) || 3,
          notes: t.notes || ''
        })),
        technicalAspects: (s.technicalAspects && s.technicalAspects.length > 0) ? s.technicalAspects : []
      })),
      evaluations: evaluations.map(ev => ({
        _id: ev._id.toString(),
        id: ev._id.toString(),
        studentId: ev.studentId.toString(),
        studentName: ev.studentName,
        studentRank: ev.studentRank,
        targetRank: ev.targetRank,
        syllabusId: ev.syllabusId,
        scores: ev.scores || {},
        techniqueAverages: ev.techniqueAverages || {},
        observations: ev.observations || {},
        percentage: ev.percentage || 0,
        pointsEarned: ev.pointsEarned || 0,
        pointsPossible: ev.pointsPossible || 0,
        isPassed: ev.isPassed || false,
        evaluatorEmail: ev.evaluatorEmail,
        evaluatorName: ev.evaluatorName,
        phaseNotes: ev.phaseNotes || {},
        notes: ev.notes || '',
        evaluatedAt: ev.evaluatedAt ? ev.evaluatedAt.toISOString() : null
      }))
    };
  } catch (error) {
    console.error('Error al obtener datos para evaluador:', error);
    return { success: false, error: error.message || 'Error al conectar con la convocatoria de examen.' };
  }
}

/**
 * Guardar calificación atómica técnica con estrellas por evaluador (Nube)
 */
export async function saveEvaluatorAtomicGrade({
  callId,
  studentId,
  evaluatorEmail,
  evaluatorName,
  syllabusId,
  syllabusName = 'Temario Oficial ISKF',
  scores = {},
  techniqueAverages = {},
  observations = {},
  phaseNotes = {},
  percentage = 0,
  pointsEarned = 0,
  pointsPossible = 0,
  isPassed = false,
  notes = ''
}) {
  try {
    await dbConnect();

    // 1. Validación estricta de ID y Email
    if (!studentId || typeof studentId !== 'string' || !mongoose.Types.ObjectId.isValid(studentId)) {
      return { success: false, error: 'ID de estudiante inválido.' };
    }
    const safeEmail = String(evaluatorEmail || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail) || safeEmail.length > 120) {
      return { success: false, error: 'Email del evaluador inválido.' };
    }

    const student = await Student.findById(studentId).lean();
    if (!student) {
      return { success: false, error: 'Estudiante no encontrado.' };
    }

    // 2. Si se proporciona callId, verificar que la convocatoria no esté cerrada ni sea modificada indebidamente
    if (callId && mongoose.Types.ObjectId.isValid(callId)) {
      const callRecord = await TechnicalExamCall.findById(callId).select('status evaluators').lean();
      if (callRecord && callRecord.status === 'cerrado') {
        return {
          success: false,
          error: 'La convocatoria ha sido cerrada oficialmente. No se admiten más votaciones o cambios de calificación.'
        };
      }
      if (callRecord && Array.isArray(callRecord.evaluators) && callRecord.evaluators.length > 0) {
        const isAuthorized = callRecord.evaluators.some(e => (e.email || '').toLowerCase().trim() === safeEmail);
        if (!isAuthorized) {
          const session = await auth();
          const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'editor';
          if (!isAdmin) {
            return {
              success: false,
              error: 'El evaluador no está registrado ni autorizado en esta convocatoria técnica.'
            };
          }
        }
      }
    }

    // 2. Sanitización defensiva contra Prototype Pollution y DoS de scores
    const safeScores = {};
    if (scores && typeof scores === 'object' && !Array.isArray(scores)) {
      const entries = Object.entries(scores).slice(0, 150);
      for (const [key, val] of entries) {
        if (
          typeof key === 'string' &&
          key !== '__proto__' &&
          key !== 'constructor' &&
          key !== 'prototype' &&
          /^[a-zA-Z0-9_\-.:]{1,80}$/.test(key)
        ) {
          const num = Number(val);
          if (Number.isFinite(num) && num >= 0 && num <= 10) {
            safeScores[key] = Math.round(num * 10) / 10;
          }
        }
      }
    }

    // 3. Sanitización defensiva de promedios por técnica
    const safeAverages = {};
    if (techniqueAverages && typeof techniqueAverages === 'object' && !Array.isArray(techniqueAverages)) {
      const entries = Object.entries(techniqueAverages).slice(0, 100);
      for (const [key, val] of entries) {
        if (
          typeof key === 'string' &&
          key !== '__proto__' &&
          key !== 'constructor' &&
          key !== 'prototype' &&
          /^[a-zA-Z0-9_\-.:]{1,80}$/.test(key)
        ) {
          const num = Number(val);
          if (Number.isFinite(num) && num >= 0 && num <= 10) {
            safeAverages[key] = Math.round(num * 10) / 10;
          }
        }
      }
    }

    // 4. Sanitización defensiva de tags de observación
    const safeObservations = {};
    if (observations && typeof observations === 'object' && !Array.isArray(observations)) {
      const entries = Object.entries(observations).slice(0, 100);
      for (const [key, tags] of entries) {
        if (
          typeof key === 'string' &&
          key !== '__proto__' &&
          key !== 'constructor' &&
          key !== 'prototype' &&
          /^[a-zA-Z0-9_\-.:]{1,80}$/.test(key) &&
          Array.isArray(tags)
        ) {
          safeObservations[key] = tags
            .slice(0, 20)
            .map(t => (typeof t === 'string' ? t.replace(/<[^>]*>/g, '').trim().substring(0, 60) : ''))
            .filter(Boolean);
        }
      }
    }

    // 5. Sanitización de observaciones condensadas por fase (Kihon, Kata, Kumite, Aspectos)
    const safePhaseNotes = {};
    if (phaseNotes && typeof phaseNotes === 'object' && !Array.isArray(phaseNotes)) {
      for (const [pKey, pVal] of Object.entries(phaseNotes).slice(0, 10)) {
        if (typeof pKey === 'string' && /^[a-zA-Z0-9_-]{1,30}$/.test(pKey)) {
          safePhaseNotes[pKey] = typeof pVal === 'string' ? pVal.replace(/<[^>]*>/g, '').trim().substring(0, 3000) : '';
        }
      }
    }

    let safeNotes = typeof notes === 'string' ? notes.replace(/<[^>]*>/g, '').trim().substring(0, 3000) : '';
    // Si no se pasó string de notas generales pero sí de fases, sintetizar el texto general unificado
    if (!safeNotes) {
      const parts = [];
      if (safePhaseNotes.kihon) parts.push(`[Kihon]:\n${safePhaseNotes.kihon}`);
      if (safePhaseNotes.kata) parts.push(`[Kata]:\n${safePhaseNotes.kata}`);
      if (safePhaseNotes.kumite) parts.push(`[Kumite]:\n${safePhaseNotes.kumite}`);
      if (safePhaseNotes.aspectos) parts.push(`[Aspectos]:\n${safePhaseNotes.aspectos}`);
      safeNotes = parts.join('\n\n');
    }

    const safeEvaluatorName = String(evaluatorName || 'Sinodal Convocado').replace(/<[^>]*>/g, '').trim().substring(0, 100);
    const safeSyllabusId = String(syllabusId || 'general').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
    const safeSyllabusName = String(syllabusName || 'Temario Oficial ISKF').replace(/<[^>]*>/g, '').trim().substring(0, 150);
    const safeCallId = (callId && mongoose.Types.ObjectId.isValid(callId)) ? new mongoose.Types.ObjectId(callId) : null;

    const payload = {
      ...(safeCallId ? { callId: safeCallId } : {}),
      studentId: student._id,
      studentName: student.name,
      studentRank: student.currentRank || '10° Kyu (Cinta Blanca)',
      targetRank: student.currentRank || '10° Kyu (Cinta Blanca)',
      dojoId: student.dojoId,
      syllabusId: safeSyllabusId,
      syllabusName: safeSyllabusName,
      scores: safeScores,
      techniqueAverages: safeAverages,
      observations: safeObservations,
      phaseNotes: safePhaseNotes,
      percentage: Math.max(0, Math.min(100, Math.round(Number(percentage) || 0))),
      pointsEarned: Math.max(0, Math.min(5000, Number(pointsEarned) || 0)),
      pointsPossible: Math.max(0, Math.min(5000, Number(pointsPossible) || 0)),
      isPassed: Boolean(isPassed),
      evaluatorName: safeEvaluatorName,
      evaluatorEmail: safeEmail,
      notes: safeNotes,
      evaluatedAt: new Date()
    };

    const updateFilter = {
      studentId: student._id,
      evaluatorEmail: safeEmail
    };
    if (safeCallId) {
      updateFilter.callId = safeCallId;
    } else {
      updateFilter.syllabusId = safeSyllabusId;
    }

    const saved = await TechnicalExamEvaluation.findOneAndUpdate(
      updateFilter,
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
    );

    return {
      success: true,
      evaluation: {
        _id: saved._id.toString(),
        id: saved._id.toString(),
        studentId: saved.studentId.toString(),
        studentName: saved.studentName,
        scores: saved.scores,
        percentage: saved.percentage,
        isPassed: saved.isPassed,
        evaluatedAt: saved.evaluatedAt ? saved.evaluatedAt.toISOString() : null
      }
    };
  } catch (error) {
    console.error('Error al guardar calificación atómica:', error);
    return { success: false, error: error.message || 'Error al registrar la calificación.' };
  }
}

/**
 * Obtener el progreso en vivo de todos los Senseis del Tribunal para una convocatoria
 */
export async function getTribunalProgressForCall(params) {
  try {
    await dbConnect();

    const callId = typeof params === 'string' ? params : (params?.callId || params?.id);

    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'ID de convocatoria inválido.' };
    }

    const call = await TechnicalExamCall.findById(callId).lean();
    if (!call) {
      return { success: false, error: 'Convocatoria no encontrada.' };
    }

    const dojo = call.dojoId ? await Dojo.findById(call.dojoId).lean() : null;
    const dojoLogo = dojo?.logo || '/images/dojos/default_logo.jpg';
    const dojoName = dojo?.name || call.dojoName || 'Dojo ISKF';

    const rawStudentIds = [
      ...(call.aspirants || []).map(a => a.studentId.toString()),
      ...(call.schedules || []).flatMap(s => (s.studentIds || []).map(String))
    ];
    const uniqueStudentIds = [...new Set(rawStudentIds)].filter(id => mongoose.Types.ObjectId.isValid(id));

    // Helper para generar tokens si faltan
    const generateToken = (name) => `${(name || 'sinodal').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}`;

    // 1. Evaluadores oficiales configurados en la convocatoria
    const configuredEvaluators = (call.evaluators || []).map(e => ({
      name: e.name,
      email: e.email,
      role: e.role || 'Sinodal',
      token: e.token || generateToken(e.name)
    }));

    const studentObjIds = uniqueStudentIds.map(id => new mongoose.Types.ObjectId(id));

    const callObjId = new mongoose.Types.ObjectId(call._id);

    // 2. Solo si hay evaluadores con notas registradas específicamente en ESTA convocatoria (callId)
    const activeEvals = await TechnicalExamEvaluation.find({
      callId: callObjId,
      studentId: { $in: studentObjIds }
    }).select('evaluatorName evaluatorEmail').lean();

    const seenEmails = new Set(configuredEvaluators.map(e => (e.email || '').toLowerCase().trim()));
    activeEvals.forEach(ev => {
      const email = (ev.evaluatorEmail || '').toLowerCase().trim();
      const rawName = String(ev.evaluatorName || '').trim();
      if (email && rawName && !seenEmails.has(email)) {
        seenEmails.add(email);
        configuredEvaluators.push({
          name: rawName,
          email: ev.evaluatorEmail,
          role: 'Sinodal Activo',
          token: generateToken(rawName)
        });
      }
    });

    // 0. Mapeo estricto de técnicas del temario por fase para reflejar exactamente lo guardado sin adivinanzas
    const techGroupMap = {};
    let expectedKihon = 0;
    let expectedKata = 0;
    let expectedKumite = 0;

    (call.syllabusSnapshots || []).forEach(snap => {
      (snap.techniques || []).forEach(t => {
        if (t.id) {
          const grp = (t.group || t.phase || 'kihon').toLowerCase();
          techGroupMap[t.id] = grp;
          if (grp === 'kihon') expectedKihon++;
          else if (grp === 'kata') expectedKata++;
          else if (grp === 'kumite') expectedKumite++;
        }
      });
    });

    if (expectedKihon === 0) expectedKihon = 6;
    if (expectedKata === 0) expectedKata = 1;
    if (expectedKumite === 0) expectedKumite = 1;
    const totalExpectedTechniques = expectedKihon + expectedKata + expectedKumite;

    const progressByEvaluator = await Promise.all(configuredEvaluators.map(async (ev) => {
      const cleanEmail = String(ev.email || '').trim().toLowerCase();
      const evalFilter = {
        callId: callObjId,
        evaluatorEmail: cleanEmail,
        studentId: { $in: studentObjIds }
      };
      const evals = await TechnicalExamEvaluation.find(evalFilter).lean();

      const evaluationsByStudent = {};
      let totalPercentage = 0;
      let passedCount = 0;
      let lastEvaluatedAt = null;
      let lastEvaluatedStudentName = '';

      let totalScoresCount = 0;
      const evaluatedTechniques = new Set();
      let lastTechnique = '';

      evals.forEach(item => {
        const stId = item.studentId.toString();
        const scCount = Object.keys(item.scores || {}).length;
        totalScoresCount += scCount;

        Object.keys(item.techniqueAverages || {}).forEach(k => evaluatedTechniques.add(k));

        // Conteo exacto de notas reales por fase
        const phaseScores = { kihon: 0, kata: 0, kumite: 0, aspectos: 0 };
        const phaseTechniques = {
          kihon: new Set(),
          kata: new Set(),
          kumite: new Set(),
          aspectos: new Set()
        };

        Object.entries(item.scores || {}).forEach(([k, val]) => {
          if (typeof val !== 'number' || val <= 0) return;
          const prefix = k.split('_')[0];
          const grpFromMap = techGroupMap[prefix];
          if (grpFromMap && phaseScores[grpFromMap] !== undefined) {
            phaseScores[grpFromMap]++;
          } else if (k.includes('_kata_') || prefix.includes('-ka') || k.startsWith('kata_')) {
            phaseScores.kata++;
          } else if (k.includes('_kumite_') || prefix.includes('-ku') || k.startsWith('kumite_')) {
            phaseScores.kumite++;
          } else if (k.startsWith('aspect_') || k.startsWith('eval_aspect_') || k.includes('_aspectos_')) {
            phaseScores.aspectos++;
          } else {
            phaseScores.kihon++;
          }
        });

        Object.keys(item.techniqueAverages || {}).forEach(techKey => {
          const grp = techGroupMap[techKey] || (techKey.includes('-ka') ? 'kata' : techKey.includes('-ku') ? 'kumite' : techKey.startsWith('aspect') ? 'aspectos' : 'kihon');
          if (phaseTechniques[grp]) {
            phaseTechniques[grp].add(techKey);
          }
        });

        const pNotes = item.phaseNotes || {};

        const kihonStarted = phaseScores.kihon > 0 || phaseTechniques.kihon.size > 0 || Boolean(pNotes.kihon);
        const kihonDone = kihonStarted && (phaseTechniques.kihon.size >= expectedKihon || phaseScores.kihon >= expectedKihon * 3);

        const kataStarted = phaseScores.kata > 0 || phaseTechniques.kata.size > 0 || Boolean(pNotes.kata);
        const kataDone = kataStarted && (phaseTechniques.kata.size >= expectedKata || phaseScores.kata >= expectedKata * 8);

        const kumiteStarted = phaseScores.kumite > 0 || phaseTechniques.kumite.size > 0 || Boolean(pNotes.kumite);
        const kumiteDone = kumiteStarted && (phaseTechniques.kumite.size >= expectedKumite || phaseScores.kumite >= expectedKumite * 3);

        const totalEvaluatedTechs = phaseTechniques.kihon.size + phaseTechniques.kata.size + phaseTechniques.kumite.size;
        const isFullyDone = (expectedKumite > 0 ? kumiteDone : true) && (expectedKata > 0 ? kataDone : true) && (expectedKihon > 0 ? kihonDone : true);

        // Promedios por fase para este evaluador (normalizados a 0-100%)
        const phaseSums = { kihon: 0, kata: 0, kumite: 0, aspectos: 0 };
        const phaseCounts = { kihon: 0, kata: 0, kumite: 0, aspectos: 0 };

        Object.entries(item.techniqueAverages || {}).forEach(([techId, avgVal]) => {
          if (typeof avgVal !== 'number') return;
          const grp = techGroupMap[techId] || (techId.includes('-ka') ? 'kata' : techId.includes('-ku') ? 'kumite' : (techId.startsWith('aspect') ? 'aspectos' : 'kihon'));
          if (phaseSums[grp] !== undefined) {
            const normalized = avgVal <= 10 ? avgVal * 10 : avgVal;
            phaseSums[grp] += normalized;
            phaseCounts[grp]++;
          }
        });

        const phaseAverages = {
          kihon: phaseCounts.kihon > 0 ? Math.round(phaseSums.kihon / phaseCounts.kihon) : null,
          kata: phaseCounts.kata > 0 ? Math.round(phaseSums.kata / phaseCounts.kata) : null,
          kumite: phaseCounts.kumite > 0 ? Math.round(phaseSums.kumite / phaseCounts.kumite) : null,
          aspectos: phaseCounts.aspectos > 0 ? Math.round(phaseSums.aspectos / phaseCounts.aspectos) : null,
          total: item.percentage || 0
        };

        evaluationsByStudent[stId] = {
          id: item._id.toString(),
          studentId: stId,
          studentName: item.studentName,
          percentage: item.percentage || 0,
          isPassed: Boolean(item.isPassed),
          scoresCount: scCount,
          scores: item.scores || {},
          techniqueAverages: item.techniqueAverages || {},
          techniquesCount: Object.keys(item.techniqueAverages || {}).length,
          phaseNotes: item.phaseNotes || {},
          phaseAverages,
          grades: item.grades || [],
          evaluatorName: ev.name,
          evaluatorRole: ev.role || 'Sinodal',
          evaluatedAt: item.evaluatedAt ? item.evaluatedAt.toISOString() : null,
          phaseStats: {
            kihon: {
              started: kihonStarted,
              done: kihonDone,
              scoresCount: phaseScores.kihon,
              techniquesCount: phaseTechniques.kihon.size,
              expectedTechniques: expectedKihon
            },
            kata: {
              started: kataStarted,
              done: kataDone,
              scoresCount: phaseScores.kata,
              techniquesCount: phaseTechniques.kata.size,
              expectedTechniques: expectedKata
            },
            kumite: {
              started: kumiteStarted,
              done: kumiteDone,
              scoresCount: phaseScores.kumite,
              techniquesCount: phaseTechniques.kumite.size,
              expectedTechniques: expectedKumite
            },
            totalEvaluatedTechs,
            totalExpectedTechs: totalExpectedTechniques,
            isFullyDone
          }
        };
        totalPercentage += (item.percentage || 0);
        if (item.isPassed) passedCount += 1;

        if (!lastEvaluatedAt || new Date(item.evaluatedAt) > new Date(lastEvaluatedAt)) {
          lastEvaluatedAt = item.evaluatedAt ? item.evaluatedAt.toISOString() : null;
          lastEvaluatedStudentName = item.studentName;
          const techKeys = Object.keys(item.techniqueAverages || {});
          if (techKeys.length > 0) {
            lastTechnique = techKeys[techKeys.length - 1];
          }
        }
      });

      const evaluatedCount = evals.length;
      const totalToEvaluate = uniqueStudentIds.length;
      const percentCompleted = totalToEvaluate > 0 ? Math.round((evaluatedCount / totalToEvaluate) * 100) : 0;
      const avgGrade = evaluatedCount > 0 ? Math.round(totalPercentage / evaluatedCount) : 0;

      return {
        evaluator: ev,
        totalToEvaluate,
        evaluatedCount,
        percentCompleted,
        avgGrade,
        passedCount,
        totalScoresCount,
        distinctTechniquesCount: evaluatedTechniques.size,
        lastTechnique,
        lastEvaluatedAt,
        lastEvaluatedStudentName,
        evaluationsByStudent
      };
    }));

    // Cargar consolidaciones registradas para esta convocatoria
    const consolidations = await TechnicalExamConsolidation.find({
      $or: [
        { callId: callObjId },
        { dojoId: call.dojoId, studentId: { $in: studentObjIds } }
      ]
    }).lean();

    const consolidationsByStudent = {};
    consolidations.forEach(c => {
      consolidationsByStudent[c.studentId.toString()] = {
        id: c._id.toString(),
        finalGrade: c.finalGrade || c.overallPercentage || 0,
        officialVerdict: c.officialVerdict || (c.isPassed ? 'Aprobado' : 'Reprobado'),
        isPassed: Boolean(c.isPassed),
        promotedRank: c.promotedRank || c.targetRank,
        aiAnalysis: c.aiAnalysis || c.aiConsolidatedSummary || '',
        observations: c.observations || '',
        rawObservationsByTechnique: c.rawObservationsByTechnique || null,
        certificateIssued: Boolean(c.certificateIssued),
        consolidatedAt: c.consolidatedAt ? c.consolidatedAt.toISOString() : null
      };
    });

    return {
      success: true,
      callId: call._id.toString(),
      title: call.title,
      status: call.status,
      dojoName,
      dojoLogo,
      totalAspirants: uniqueStudentIds.length,
      syllabusSummary: {
        kihonCount: expectedKihon,
        kataCount: expectedKata,
        kumiteCount: expectedKumite,
        totalTechniques: totalExpectedTechniques
      },
      syllabusTechniques: (call.syllabusSnapshots?.[0]?.techniques || []),
      syllabusAspects: (call.syllabusSnapshots?.[0]?.technicalAspects || []),
      consolidationsByStudent,
      aspirants: (call.aspirants || []).map(a => ({
        studentId: a.studentId.toString(),
        studentName: a.studentName,
        currentRank: a.currentRank,
        targetRank: a.targetRank,
        scheduleBlock: a.scheduleBlock
      })),
      progressByEvaluator,
      schedules: (call.schedules || []).map(s => ({
        blockName: s.blockName,
        startTime: s.startTime,
        endTime: s.endTime,
        studentIds: (s.studentIds || []).map(String)
      }))
    };
  } catch (error) {
    console.error('Error al obtener progreso del tribunal:', error);
    return { success: false, error: error.message || 'Error al obtener progreso del tribunal.' };
  }
}

/**
 * Consulta ultraliviana para sincronización periódica de tandas y alumnos en tiempo real
 */
export async function getCallSchedulesLatest({ callId, accessToken }) {
  try {
    await dbConnect();
    let call = null;
    if (callId && mongoose.Types.ObjectId.isValid(callId)) {
      call = await TechnicalExamCall.findById(callId).lean();
    }
    if (!call && accessToken) {
      call = await TechnicalExamCall.findOne({ accessToken: String(accessToken || '').trim() }).lean();
    }
    if (!call && callId) {
      call = await TechnicalExamCall.findOne({ _id: callId }).lean();
    }
    if (!call) {
      call = await TechnicalExamCall.findOne({ status: { $ne: 'cerrado' } }).sort({ createdAt: -1 }).lean();
    }
    if (!call) return { success: false, error: 'Convocatoria no encontrada' };

    const rawStudentIds = [
      ...(call.aspirants || []).map(a => a.studentId.toString()),
      ...(call.schedules || []).flatMap(s => (s.studentIds || []).map(String))
    ];
    const uniqueStudentIds = [...new Set(rawStudentIds)].filter(id => mongoose.Types.ObjectId.isValid(id));

    const students = await Student.find({
      _id: { $in: uniqueStudentIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).lean();

    const aspirantMap = new Map();
    (call.aspirants || []).forEach(a => {
      if (a.studentId) aspirantMap.set(a.studentId.toString(), a);
    });

    return {
      success: true,
      status: call.status,
      maxPerTanda: call.maxPerTanda || 6,
      schedules: (call.schedules || []).map(s => ({
        blockName: s.blockName,
        startTime: s.startTime,
        endTime: s.endTime || '',
        targetRanks: s.targetRanks || [],
        studentIds: (s.studentIds || []).map(String)
      })),
      students: students.map(s => {
        const sId = s._id.toString();
        const asp = aspirantMap.get(sId);
        return {
          _id: sId,
          id: sId,
          name: s.name,
          birthDate: s.birthDate ? s.birthDate.toISOString() : null,
          currentRank: s.currentRank,
          targetRank: asp?.targetRank || s.targetRank || s.currentRank,
          photo: s.photo || '',
          dojoId: s.dojoId ? s.dojoId.toString() : '',
          dojoName: s.dojoName || '',
          status: s.status,
          notes: s.notes || '',
          positiveAspects: s.positiveAspects || '',
          hasSpecialCondition: Boolean(s.hasSpecialCondition),
          specialCondition: s.specialCondition || '',
          isPromotedForExam: Boolean(s.isPromotedForExam),
          promotedAt: s.promotedAt ? s.promotedAt.toISOString() : null
        };
      })
    };
  } catch (err) {
    console.error('Error al consultar horarios recientes de convocatoria:', err);
    return { success: false, error: err.message };
  }
}


