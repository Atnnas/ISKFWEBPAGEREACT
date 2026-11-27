'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '../mongodb';
import ExamGradeConfig from '../../models/ExamGradeConfig';
import { auth } from '../../auth';
import { getDefaultRankGrades, DEFAULT_MIN_PASSING_SCORE } from '../utils/gradeConfigHelper';

/**
 * Obtiene la configuración oficial de notas mínimas por cinturón.
 * Si no existe en base de datos, la crea e inicializa con la tabla oficial por defecto.
 */
export async function getExamGradeConfig() {
  try {
    await dbConnect();
    let config = await ExamGradeConfig.findOne().lean();

    if (!config) {
      const defaultGrades = getDefaultRankGrades();
      config = await ExamGradeConfig.create({
        title: 'Configuración Oficial de Notas Mínimas de Aprobación por Cinturón ISKF',
        defaultMinScore: DEFAULT_MIN_PASSING_SCORE,
        ranks: defaultGrades,
        updatedBy: 'Sistema ISKF'
      });
      config = config.toObject ? config.toObject() : config;
    }

    return {
      success: true,
      config: JSON.parse(JSON.stringify(config))
    };
  } catch (error) {
    console.error('Error al obtener configuración de notas mínimas:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener la configuración de notas mínimas.',
      config: {
        defaultMinScore: DEFAULT_MIN_PASSING_SCORE,
        ranks: getDefaultRankGrades()
      }
    };
  }
}

/**
 * Guarda o actualiza la configuración de notas mínimas por cinturón.
 * REGLA ESTRICTA DE SEGURIDAD: Solo usuarios con rol 'admin' tienen permiso para guardar.
 */
export async function saveExamGradeConfig({ defaultMinScore = 70, ranks = [] }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return {
        success: false,
        error: 'Acceso denegado: Únicamente los usuarios con rol Administrador pueden modificar las notas mínimas de aprobación.'
      };
    }

    await dbConnect();

    const safeDefault = Math.min(100, Math.max(0, Number(defaultMinScore) || 70));
    const safeRanks = (ranks || []).map(r => ({
      rankKey: String(r.rankKey || '').trim(),
      rankLabel: String(r.rankLabel || '').trim(),
      minScore: Math.min(100, Math.max(0, Number(r.minScore) || safeDefault)),
      active: r.active !== false
    }));

    let config = await ExamGradeConfig.findOne();
    if (!config) {
      config = new ExamGradeConfig({
        title: 'Configuración Oficial de Notas Mínimas de Aprobación por Cinturón ISKF',
        defaultMinScore: safeDefault,
        ranks: safeRanks,
        updatedBy: session.user.name || session.user.email || 'Administrador'
      });
    } else {
      config.defaultMinScore = safeDefault;
      config.ranks = safeRanks;
      config.updatedBy = session.user.name || session.user.email || 'Administrador';
      config.updatedAt = new Date();
    }

    await config.save();

    revalidatePath('/admin/examinations');
    revalidatePath('/admin/examinations/grades');
    revalidatePath('/admin/examinations/technical');
    revalidatePath('/examinations');

    return {
      success: true,
      config: JSON.parse(JSON.stringify(config))
    };
  } catch (error) {
    console.error('Error al guardar configuración de notas mínimas:', error);
    return {
      success: false,
      error: error.message || 'Error al persistir la configuración de notas mínimas.'
    };
  }
}
