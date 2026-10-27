'use server';

import dbConnect from '../mongodb';
import ExamCostConfig from '../../models/ExamCostConfig';
import { revalidatePath } from 'next/cache';

const DEFAULT_RANKS = [
  { rank: '9° Kyu (Cinta Amarilla)', senseiDojo: 15000, directorGeneral: 10000, iskfCr: 5000, total: 30000, active: true },
  { rank: '8° Kyu (Cinta Naranja)', senseiDojo: 15000, directorGeneral: 10000, iskfCr: 5000, total: 30000, active: true },
  { rank: '7° Kyu (Cinta Azul)', senseiDojo: 15000, directorGeneral: 10000, iskfCr: 5000, total: 30000, active: true },
  { rank: '6° Kyu (Cinta Verde)', senseiDojo: 15000, directorGeneral: 10000, iskfCr: 5000, total: 30000, active: true },
  { rank: '5° Kyu (Cinta Morada)', senseiDojo: 18000, directorGeneral: 12000, iskfCr: 6000, total: 36000, active: true },
  { rank: '4° Kyu (Cinta Morada Avanzada)', senseiDojo: 18000, directorGeneral: 12000, iskfCr: 6000, total: 36000, active: true },
  { rank: '3° Kyu (Cinta Café)', senseiDojo: 20000, directorGeneral: 15000, iskfCr: 8000, total: 43000, active: true },
  { rank: '2° Kyu (Cinta Café)', senseiDojo: 20000, directorGeneral: 15000, iskfCr: 8000, total: 43000, active: true },
  { rank: '1° Kyu (Cinta Café)', senseiDojo: 22000, directorGeneral: 18000, iskfCr: 10000, total: 50000, active: true },
  { rank: 'Shodan (1° Dan - Cinta Negra)', senseiDojo: 35000, directorGeneral: 30000, iskfCr: 20000, total: 85000, active: true },
];

/**
 * Obtiene la configuración activa de costos de examen
 */
export async function getExamCostConfig() {
  try {
    await dbConnect();
    const config = await ExamCostConfig.findOne().sort({ updatedAt: -1 }).lean();

    if (!config) {
      return {
        success: true,
        isNew: true,
        config: {
          currency: 'CRC',
          currencySymbol: '₡',
          senseiDojo: 15000,
          directorGeneral: 10000,
          iskfCr: 5000,
          total: 30000,
          notes: 'Aranceles oficiales de derecho de examen técnico ISKF Costa Rica.',
          rankCosts: DEFAULT_RANKS,
          updatedBy: 'Predeterminado',
          updatedAt: new Date().toISOString(),
        }
      };
    }

    // Asegurar serialización limpia
    return {
      success: true,
      isNew: false,
      config: {
        _id: config._id.toString(),
        currency: config.currency || 'CRC',
        currencySymbol: config.currencySymbol || (config.currency === 'USD' ? '$' : '₡'),
        senseiDojo: Number(config.senseiDojo) || 0,
        directorGeneral: Number(config.directorGeneral) || 0,
        iskfCr: Number(config.iskfCr) || 0,
        total: (Number(config.senseiDojo) || 0) + (Number(config.directorGeneral) || 0) + (Number(config.iskfCr) || 0),
        notes: config.notes || '',
        rankCosts: Array.isArray(config.rankCosts) && config.rankCosts.length > 0 
          ? config.rankCosts.map(r => ({
              rank: r.rank,
              senseiDojo: Number(r.senseiDojo) || 0,
              directorGeneral: Number(r.directorGeneral) || 0,
              iskfCr: Number(r.iskfCr) || 0,
              total: (Number(r.senseiDojo) || 0) + (Number(r.directorGeneral) || 0) + (Number(r.iskfCr) || 0),
              active: r.active !== false,
            }))
          : DEFAULT_RANKS,
        updatedBy: config.updatedBy || 'Administración',
        updatedAt: config.updatedAt ? new Date(config.updatedAt).toISOString() : new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Error al obtener configuración de costos de examen:', error);
    return {
      success: false,
      error: 'Error al consultar la configuración de costos en la base de datos.',
      config: {
        currency: 'CRC',
        currencySymbol: '₡',
        senseiDojo: 0,
        directorGeneral: 0,
        iskfCr: 0,
        total: 0,
        notes: '',
        rankCosts: DEFAULT_RANKS,
      }
    };
  }
}

/**
 * Guarda o actualiza la configuración de costos de examen
 */
export async function saveExamCostConfig(payload, userEmail = 'Administración') {
  try {
    await dbConnect();

    const senseiDojo = Math.max(0, Number(payload.senseiDojo) || 0);
    const directorGeneral = Math.max(0, Number(payload.directorGeneral) || 0);
    const iskfCr = Math.max(0, Number(payload.iskfCr) || 0);
    const total = senseiDojo + directorGeneral + iskfCr;

    const currency = payload.currency === 'USD' ? 'USD' : 'CRC';
    const currencySymbol = currency === 'USD' ? '$' : '₡';
    const notes = String(payload.notes || '').trim().slice(0, 1000);

    const safeRankCosts = Array.isArray(payload.rankCosts)
      ? payload.rankCosts.map(r => {
          const s = Math.max(0, Number(r.senseiDojo) || 0);
          const d = Math.max(0, Number(r.directorGeneral) || 0);
          const i = Math.max(0, Number(r.iskfCr) || 0);
          return {
            rank: String(r.rank || 'Grado').trim(),
            senseiDojo: s,
            directorGeneral: d,
            iskfCr: i,
            total: s + d + i,
            active: Boolean(r.active)
          };
        })
      : [];

    const updateDoc = {
      title: 'Configuración Oficial de Costos de Examen ISKF',
      currency,
      currencySymbol,
      senseiDojo,
      directorGeneral,
      iskfCr,
      total,
      notes,
      rankCosts: safeRankCosts,
      updatedBy: String(userEmail || 'Administrador').trim(),
      updatedAt: new Date(),
    };

    const saved = await ExamCostConfig.findOneAndUpdate(
      {},
      { $set: updateDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    revalidatePath('/admin/examinations/costs');
    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      message: 'Configuración de costos guardada exitosamente.',
      config: {
        _id: saved._id ? saved._id.toString() : undefined,
        ...updateDoc,
        updatedAt: updateDoc.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error al guardar configuración de costos:', error);
    return {
      success: false,
      error: error.message || 'Error al persistir la configuración de costos en la base de datos.'
    };
  }
}
