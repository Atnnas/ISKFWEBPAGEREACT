'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '../mongodb';
import ExamSyllabus from '../../models/ExamSyllabus';
import { auth } from '../../auth';

import { DEFAULT_TECHNICAL_ASPECTS } from '../constants/technicalAspects';

/**
 * Sanitizar texto eliminando etiquetas HTML, caracteres de control no imprimibles
 * y limitando longitud para prevenir ataques XSS, inyección y saturación de BSON.
 */
function sanitizeString(val, maxLen = 300) {
  if (typeof val !== 'string') return '';
  const withoutHtml = val.replace(/<[^>]*>/g, '').trim();
  let cleaned = '';
  for (let i = 0; i < withoutHtml.length; i++) {
    const code = withoutHtml.charCodeAt(i);
    // Preservar caracteres legibles estándar y saltos de línea (código >= 32 o 10/13)
    if (code >= 32 || code === 10 || code === 13) {
      cleaned += withoutHtml[i];
    }
  }
  return cleaned.substring(0, maxLen);
}

/**
 * Temarios iniciales por defecto basados en la normativa oficial ISKF Costa Rica
 */
const DEFAULT_INITIAL_SYLLABI = [
  {
    name: 'Temario Oficial: Cinturón Blanco (Examen de 10 Kyu a 9 Kyu)',
    currentRank: '10° Kyu (Cinta Blanca)',
    targetRank: '9° Kyu (Cinta Amarilla)',
    targetRanks: ['10° Kyu (Cinta Blanca)', '9° Kyu (Cinta Amarilla)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Blanco (Examen de 10 Kyu a 9 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: DEFAULT_TECHNICAL_ASPECTS,
    techniques: [
      // KIHON
      {
        id: 'tech-10-9-k1',
        group: 'kihon',
        name: 'Chudan Oi Zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). Avanzar 5 pasos con Chudan Oi Zuki, última con Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k2',
        group: 'kihon',
        name: 'Jodan Age Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Atrás (Ushiro)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Retroceder 5 pasos con Jodan Age Uke, última con Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k3',
        group: 'kihon',
        name: 'Chudan Soto Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Avanzar 5 pasos con Chudan Soto Uke, última con Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k4',
        group: 'kihon',
        name: 'Gedan Barai',
        stance: 'Zenkutsu Dachi',
        direction: 'Atrás (Ushiro)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Retroceder 5 pasos con Gedan Barai, última con Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k5',
        group: 'kihon',
        name: 'Chudan Shuto Uke',
        stance: 'Kokutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Postura Kokutsu Dachi. Avanzar 5 pasos con Chudan Shuto Uke, última con Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k6',
        group: 'kihon',
        name: 'Mae Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Postura Zenkutsu Dachi. Avanzar 5 pasos con Mae Geri Chudan, última con Kiai, ida y vuelta.'
      },
      // KUMITE
      {
        id: 'tech-10-9-ku1',
        group: 'kumite',
        name: 'Gohon Kumite (Jodan Zuki)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku-Kumite: Gohon Kumite (Jodan Zuki). Atacante 5 pasos Jodan Zuki. Defensor retrocede con Age Uke y contraataca con Gyaku Zuki Chudan + Kiai.'
      },
      // KATA
      {
        id: 'tech-10-9-ka1',
        group: 'kata',
        name: 'Heian Shodan (Órdenes)',
        stance: 'Zenkutsu / Kokutsu Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Heian Shodan ejecutado por órdenes del examinador (21 movimientos oficiales).'
      }
    ]
  }
];

/**
 * Obtener todos los temarios registrados, sembrando los por defecto si la colección está vacía
 */
export async function getExamSyllabi(targetRankFilter = null) {
  try {
    await dbConnect();

    const count = await ExamSyllabus.countDocuments();
    if (count === 0) {
      // Sembrar temario oficial inicial
      await ExamSyllabus.insertMany(DEFAULT_INITIAL_SYLLABI);
    }

    const query = { isActive: { $ne: false } };
    if (targetRankFilter && targetRankFilter !== 'all') {
      query.targetRank = targetRankFilter;
    }

    const docs = await ExamSyllabus.find(query).sort({ targetRank: 1, name: 1 }).lean();

    return docs.map(doc => ({
      _id: doc._id.toString(),
      id: doc._id.toString(),
      name: doc.name,
      currentRank: doc.currentRank,
      targetRank: doc.targetRank,
      description: doc.description || '',
      isOfficial: Boolean(doc.isOfficial),
      version: Number(doc.version) || 1,
      techniques: (doc.techniques || []).map(t => ({
        id: t.id || Math.random().toString(36).substring(2, 9),
        group: t.group,
        name: t.name,
        stance: t.stance || 'Zenkutsu Dachi',
        direction: t.direction || 'Adelante (Mae)',
        repetitions: Number(t.repetitions) || 3,
        tripType: t.tripType || 'ida_y_vuelta',
        order: Number(t.order) || 0,
        embusen: t.embusen || (t.group === 'kata' ? 'Embusen Oficial' : ''),
        notes: t.notes || ''
      })),
      technicalAspects: Array.isArray(doc.technicalAspects) ? doc.technicalAspects.map(a => ({
        id: a.id || Math.random().toString(36).substring(2, 9),
        category: a.category || 'tsuki',
        categoryLabel: a.categoryLabel || '1. Aspectos Técnicos',
        title: a.title || '',
        subtitle: a.subtitle || '',
        points: Array.isArray(a.points) ? a.points : [],
        order: Number(a.order) || 0
      })) : DEFAULT_TECHNICAL_ASPECTS,
      createdBy: doc.createdBy || 'Comisión Técnica',
      createdAt: doc.createdAt?.toISOString() || null,
      updatedAt: doc.updatedAt?.toISOString() || null
    }));
  } catch (error) {
    console.error('Error al obtener temarios de examen:', error);
    return [];
  }
}

/**
 * Crear un nuevo temario de examen
 */
export async function createExamSyllabus(data) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para crear temarios de examen.' };
    }

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Datos de temario inválidos.' };
    }

    await dbConnect();

    const name = sanitizeString(data.name, 150);
    const currentRank = sanitizeString(data.currentRank, 80) || '10° Kyu (Cinta Blanca)';
    const targetRank = sanitizeString(data.targetRank, 80);
    const description = sanitizeString(data.description, 1000);

    if (!name) {
      return { success: false, error: 'El nombre del temario es obligatorio.' };
    }
    if (!targetRank) {
      return { success: false, error: 'El cinturón a evaluar es obligatorio.' };
    }

    const rawTechniques = Array.isArray(data.techniques) ? data.techniques.slice(0, 100) : [];
    const cleanedTechniques = rawTechniques.map((t, idx) => {
      const group = ['kihon', 'kumite', 'kata'].includes(t.group) ? t.group : 'kihon';
      const tripType = t.tripType === 'solo_ida' ? 'solo_ida' : 'ida_y_vuelta';
      return {
        id: sanitizeString(t.id, 50) || `tech-${Date.now()}-${idx}`,
        group,
        name: sanitizeString(t.name, 120) || 'Técnica sin nombre',
        stance: sanitizeString(t.stance, 80) || 'Zenkutsu Dachi',
        direction: sanitizeString(t.direction, 80) || 'Adelante (Mae)',
        repetitions: Math.max(1, Math.min(20, parseInt(t.repetitions, 10) || 3)),
        tripType,
        order: idx + 1,
        embusen: sanitizeString(t.embusen, 100) || (group === 'kata' ? 'Embusen Oficial' : ''),
        notes: sanitizeString(t.notes, 300)
      };
    });

    const newSyllabus = await ExamSyllabus.create({
      name,
      currentRank,
      targetRank,
      description,
      isOfficial: true,
      techniques: cleanedTechniques,
      technicalAspects: Array.isArray(data.technicalAspects) ? data.technicalAspects : DEFAULT_TECHNICAL_ASPECTS,
      createdBy: sanitizeString(session.user.name, 100) || 'Comisión Técnica ISKF'
    });

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      syllabus: {
        _id: newSyllabus._id.toString(),
        id: newSyllabus._id.toString(),
        name: newSyllabus.name,
        targetRank: newSyllabus.targetRank,
        currentRank: newSyllabus.currentRank
      }
    };
  } catch (error) {
    console.error('Error al crear temario de examen:', error);
    return { success: false, error: 'Error al procesar la creación del temario.' };
  }
}

/**
 * Actualizar un temario de examen existente
 */
export async function updateExamSyllabus(id, data) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para editar temarios.' };
    }

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'ID de temario inválido.' };
    }

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Datos de temario inválidos.' };
    }

    await dbConnect();

    const name = sanitizeString(data.name, 150);
    const currentRank = sanitizeString(data.currentRank, 80);
    const targetRank = sanitizeString(data.targetRank, 80);
    const description = sanitizeString(data.description, 1000);

    if (!name || !targetRank) {
      return { success: false, error: 'Nombre y cinturón a evaluar son requeridos.' };
    }

    const rawTechniques = Array.isArray(data.techniques) ? data.techniques.slice(0, 100) : [];
    const cleanedTechniques = rawTechniques.map((t, idx) => {
      const group = ['kihon', 'kumite', 'kata'].includes(t.group) ? t.group : 'kihon';
      const tripType = t.tripType === 'solo_ida' ? 'solo_ida' : 'ida_y_vuelta';
      return {
        id: sanitizeString(t.id, 50) || `tech-${Date.now()}-${idx}`,
        group,
        name: sanitizeString(t.name, 120) || 'Técnica sin nombre',
        stance: sanitizeString(t.stance, 80) || 'Zenkutsu Dachi',
        direction: sanitizeString(t.direction, 80) || 'Adelante (Mae)',
        repetitions: Math.max(1, Math.min(20, parseInt(t.repetitions, 10) || 3)),
        tripType,
        order: idx + 1,
        embusen: sanitizeString(t.embusen, 100) || (group === 'kata' ? 'Embusen Oficial' : ''),
        notes: sanitizeString(t.notes, 300)
      };
    });

    const updatePayload = {
      name,
      currentRank: currentRank || '10° Kyu (Cinta Blanca)',
      targetRank,
      description,
      techniques: cleanedTechniques
    };

    if (Array.isArray(data.technicalAspects)) {
      updatePayload.technicalAspects = data.technicalAspects;
    }

    const existing = await ExamSyllabus.findById(id).lean();
    if (!existing) {
      return { success: false, error: 'Temario no encontrado.' };
    }
    updatePayload.version = (existing.version || 1) + 1;

    await ExamSyllabus.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: false }
    );

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar temario de examen:', error);
    return { success: false, error: 'Error al procesar la actualización del temario.' };
  }
}

/**
 * Eliminar un temario de examen
 */
export async function deleteExamSyllabus(id) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Solo los administradores pueden eliminar temarios oficiales.' };
    }

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'ID de temario inválido.' };
    }

    await dbConnect();
    await ExamSyllabus.findByIdAndDelete(id);

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar temario:', error);
    return { success: false, error: 'Error al procesar la eliminación del temario.' };
  }
}

/**
 * Actualizar exclusivamente los aspectos técnicos y rúbrica oficial de un temario en base de datos
 */
export async function updateSyllabusTechnicalAspects(syllabusId, technicalAspects) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para editar los aspectos técnicos.' };
    }

    // Validación estricta de ID para prevenir NoSQL injection
    if (!syllabusId || typeof syllabusId !== 'string' || !mongoose.Types.ObjectId.isValid(syllabusId)) {
      return { success: false, error: 'Identificador de temario inválido.' };
    }

    if (!Array.isArray(technicalAspects)) {
      return { success: false, error: 'La estructura de aspectos técnicos debe ser una lista válida.' };
    }

    await dbConnect();

    // Sanitización, límites de payload y tipado defensivo
    const cleanedAspects = technicalAspects.slice(0, 30).map((a, idx) => {
      const rawCategory = sanitizeString(a.category, 30).toLowerCase() || 'tsuki';
      const isSec2 = ['physical', 'mental', 'do'].includes(rawCategory);
      
      const safeCategory = ['tsuki', 'uke', 'dachi', 'geri', 'physical', 'mental', 'do', 'kata', 'kumite'].includes(rawCategory)
        ? rawCategory
        : 'tsuki';

      const safePoints = (Array.isArray(a.points) ? a.points : []).slice(0, 50).map(p => {
        if (!p) return null;
        if (typeof p === 'object') {
          const rawText = p.text || p.point || p.rawText || '';
          const text = sanitizeString(rawText, 300);
          if (!text) return null;
          return {
            text,
            isEvaluable: Boolean(p.isEvaluable === true || p.evaluableInExam === true || p.evaluable === true)
          };
        }
        const text = sanitizeString(p, 300);
        if (!text) return null;
        return {
          text,
          isEvaluable: !isSec2
        };
      }).filter(Boolean);

      return {
        id: sanitizeString(a.id, 50) || `aspect-${Date.now()}-${idx}`,
        category: safeCategory,
        categoryLabel: sanitizeString(a.categoryLabel, 100) || (isSec2 ? '2. Aspectos Físicos, Mentales y DO' : '1. Aspectos Técnicos'),
        title: sanitizeString(a.title, 150) || 'Aspecto Normativo',
        subtitle: sanitizeString(a.subtitle, 250),
        points: safePoints,
        order: typeof a.order === 'number' && Number.isFinite(a.order) ? Math.max(0, Math.min(1000, a.order)) : idx
      };
    });

    const updated = await ExamSyllabus.findByIdAndUpdate(
      syllabusId,
      { $set: { technicalAspects: cleanedAspects } },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return { success: false, error: 'Temario no encontrado.' };
    }

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return { 
      success: true, 
      technicalAspects: cleanedAspects 
    };
  } catch (error) {
    console.error('Error al actualizar aspectos técnicos:', error);
    return { success: false, error: 'Error al procesar la actualización en base de datos.' };
  }
}
