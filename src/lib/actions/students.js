'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '../mongodb';
import Student from '../../models/Student';
import Dojo from '../../models/Dojo';
import { auth } from '../../auth';

/**
 * Obtiene todos los dojos registrados para el combobox, incluyendo la información de su Sensei.
 */
export async function getDojosForSelector() {
  try {
    await dbConnect();
    const dojos = await Dojo.find({}).sort({ name: 1 }).lean();
    
    // Obtener conteo de estudiantes por cada dojo en una sola consulta agrupada
    const studentCounts = await Student.aggregate([
      { $group: { _id: '$dojoId', count: { $sum: 1 } } }
    ]);
    
    const countMap = {};
    studentCounts.forEach(item => {
      countMap[item._id?.toString()] = item.count;
    });

    return dojos.map(d => ({
      _id: d._id.toString(),
      id: d._id.toString(),
      idName: d.idName || '',
      name: d.name || '',
      province: d.province || '',
      sensei: d.sensei || '',
      senseiImage: d.senseiImage || '/images/dojos/default_sensei.jpg',
      rank: d.rank || 'Sensei',
      logo: d.logo || '/images/dojos/default_logo.jpg',
      email: d.email || '',
      phone: d.phone || '',
      address: d.address || '',
      studentCount: countMap[d._id.toString()] || 0
    }));
  } catch (error) {
    console.error('Error en getDojosForSelector:', error);
    return [];
  }
}

/**
 * Obtiene todos los estudiantes registrados para un Dojo específico.
 */
export async function getStudentsByDojo(dojoId) {
  try {
    await dbConnect();
    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return [];
    }

    const students = await Student.find({ dojoId: new mongoose.Types.ObjectId(dojoId) })
      .sort({ currentRank: 1, name: 1 })
      .lean();

    return students.map(s => ({
      _id: s._id.toString(),
      id: s._id.toString(),
      name: s.name,
      birthDate: s.birthDate ? s.birthDate.toISOString() : null,
      currentRank: s.currentRank || '10° Kyu (Cinta Blanca)',
      dojoId: s.dojoId.toString(),
      dojoName: s.dojoName,
      photo: s.photo || '',
      status: s.status || 'active',
      notes: s.notes || '',
      positiveAspects: s.positiveAspects || '',
      hasSpecialCondition: Boolean(s.hasSpecialCondition),
      specialCondition: s.specialCondition || '',
      isPromotedForExam: Boolean(s.isPromotedForExam),
      promotedAt: s.promotedAt ? s.promotedAt.toISOString() : null,
      createdAt: s.createdAt ? s.createdAt.toISOString() : null,
      updatedAt: s.updatedAt ? s.updatedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error('Error en getStudentsByDojo:', error);
    return [];
  }
}

function parseBirthDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();

  // Si viene en formato ISO (ej. 2026-02-20T00:00:00.000Z)
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Formato DD/MM/AAAA o DD-MM-AAAA
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Crea un nuevo estudiante asociado a un dojo.
 */
export async function createStudent(data) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado. Se requiere iniciar sesión.' };
    }

    await dbConnect();

    const { 
      name, 
      birthDate, 
      currentRank, 
      dojoId, 
      notes, 
      photo,
      positiveAspects,
      hasSpecialCondition,
      specialCondition 
    } = data;

    if (!name || !name.trim()) {
      return { success: false, error: 'El nombre del estudiante es obligatorio.' };
    }

    let parsedBirthDate = null;
    if (birthDate && birthDate !== 'No registrada' && birthDate !== 'No indicada') {
      parsedBirthDate = parseBirthDate(birthDate);
      if (!parsedBirthDate) {
        return { success: false, error: 'Fecha de nacimiento inválida. Debe ser en formato DD/MM/AAAA.' };
      }
    }

    if (!dojoId || !mongoose.Types.ObjectId.isValid(dojoId)) {
      return { success: false, error: 'Debe especificar un dojo válido.' };
    }

    const dojo = await Dojo.findById(dojoId).lean();
    if (!dojo) {
      return { success: false, error: 'El dojo seleccionado no existe.' };
    }

    const hasSpecial = Boolean(hasSpecialCondition);
    const trimmedSpecial = (specialCondition || '').trim();

    const newStudent = await Student.create({
      name: name.trim(),
      birthDate: parsedBirthDate,
      currentRank: currentRank || '10° Kyu (Cinta Blanca)',
      dojoId: new mongoose.Types.ObjectId(dojoId),
      dojoName: dojo.name,
      photo: photo ? photo.trim() : '',
      notes: notes ? notes.trim() : '',
      positiveAspects: positiveAspects ? positiveAspects.trim() : '',
      hasSpecialCondition: hasSpecial,
      specialCondition: hasSpecial ? (trimmedSpecial || 'Condición especial') : '',
      status: 'active'
    });

    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/students');

    return {
      success: true,
      student: {
        _id: newStudent._id.toString(),
        id: newStudent._id.toString(),
        name: newStudent.name,
        birthDate: newStudent.birthDate ? newStudent.birthDate.toISOString() : null,
        currentRank: newStudent.currentRank,
        dojoId: newStudent.dojoId.toString(),
        dojoName: newStudent.dojoName,
        photo: newStudent.photo || '',
        status: newStudent.status,
        notes: newStudent.notes,
        positiveAspects: newStudent.positiveAspects,
        hasSpecialCondition: newStudent.hasSpecialCondition,
        specialCondition: newStudent.specialCondition,
        isPromotedForExam: Boolean(newStudent.isPromotedForExam),
        promotedAt: newStudent.promotedAt ? newStudent.promotedAt.toISOString() : null
      }
    };
  } catch (error) {
    console.error('Error en createStudent:', error);
    return { success: false, error: error.message || 'Error al registrar el estudiante en la base de datos.' };
  }
}

/**
 * Actualiza los datos de un estudiante existente.
 */
export async function updateStudent(id, data) {
  try {
    const session = await auth();
    let isAuthorized = Boolean(session?.user);

    // Si no hay sesión por cookie (ej: Sensei Roy o Sinodal evaluando en tablet/móvil mediante enlace directo)
    if (!isAuthorized && (data.evaluatorToken || data.accessToken)) {
      try {
        await dbConnect();
        const TechnicalExamCall = (await import('../../models/TechnicalExamCall')).default;
        if (TechnicalExamCall) {
          const callQuery = data.callId && mongoose.Types.ObjectId.isValid(data.callId)
            ? { _id: new mongoose.Types.ObjectId(data.callId) }
            : (data.accessToken ? { accessToken: String(data.accessToken).trim() } : {});

          const call = await TechnicalExamCall.findOne(callQuery).lean();
          if (call) {
            const ev = (call.evaluators || []).find(e => 
              (data.evaluatorToken && (e.token === data.evaluatorToken || e.email === data.evaluatorToken))
            );
            if (ev) {
              isAuthorized = true;
            }
          }
        }
      } catch (authErr) {
        console.warn('Error al verificar autorización de evaluador:', authErr);
      }
    }

    if (!isAuthorized) {
      return { success: false, error: 'No autorizado.' };
    }

    await dbConnect();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Identificador de estudiante inválido.' };
    }

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name.trim();
    if (data.birthDate !== undefined) {
      if (!data.birthDate || data.birthDate === 'No registrada' || data.birthDate === 'No indicada') {
        updateFields.birthDate = null;
      } else {
        const parsed = parseBirthDate(data.birthDate);
        if (!parsed) {
          return { success: false, error: 'Fecha de nacimiento inválida. Debe ser en formato DD/MM/AAAA.' };
        }
        updateFields.birthDate = parsed;
      }
    }
    if (data.currentRank !== undefined) updateFields.currentRank = data.currentRank;
    if (data.notes !== undefined) updateFields.notes = (data.notes || '').trim();
    if (data.photo !== undefined) updateFields.photo = (data.photo || '').trim();
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.positiveAspects !== undefined) updateFields.positiveAspects = (data.positiveAspects || '').trim();
    
    if (data.hasSpecialCondition !== undefined) {
      const isSpecial = Boolean(data.hasSpecialCondition);
      updateFields.hasSpecialCondition = isSpecial;
      if (isSpecial) {
        const rawSpecial = data.specialCondition !== undefined ? (data.specialCondition || '').trim() : '';
        updateFields.specialCondition = rawSpecial || 'Condición especial';
      } else {
        updateFields.specialCondition = '';
      }
    } else if (data.specialCondition !== undefined) {
      updateFields.specialCondition = (data.specialCondition || '').trim();
    }

    const updated = await Student.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return { success: false, error: 'Estudiante no encontrado.' };
    }

    // Sincronizar nombre y grado en convocatorias donde esté el estudiante
    try {
      const TechnicalExamCall = (await import('../../models/TechnicalExamCall')).default;
      if (TechnicalExamCall) {
        await TechnicalExamCall.updateMany(
          { 'aspirants.studentId': new mongoose.Types.ObjectId(id) },
          {
            $set: {
              'aspirants.$[elem].studentName': updated.name,
              'aspirants.$[elem].currentRank': updated.currentRank
            }
          },
          { arrayFilters: [{ 'elem.studentId': new mongoose.Types.ObjectId(id) }] }
        );
      }
    } catch (syncErr) {
      console.warn('Error al sincronizar aspirante en convocatorias:', syncErr);
    }

    revalidatePath('/admin/examinations/technical');
    revalidatePath('/admin/students');
    revalidatePath('/evaluar', 'layout');

    return {
      success: true,
      student: {
        _id: updated._id.toString(),
        id: updated._id.toString(),
        name: updated.name,
        birthDate: updated.birthDate ? updated.birthDate.toISOString() : null,
        currentRank: updated.currentRank,
        dojoId: updated.dojoId.toString(),
        dojoName: updated.dojoName,
        photo: updated.photo || '',
        status: updated.status,
        notes: updated.notes,
        positiveAspects: updated.positiveAspects,
        hasSpecialCondition: updated.hasSpecialCondition,
        specialCondition: updated.specialCondition,
        isPromotedForExam: Boolean(updated.isPromotedForExam),
        promotedAt: updated.promotedAt ? updated.promotedAt.toISOString() : null
      }
    };
  } catch (error) {
    console.error('Error en updateStudent:', error);
    return { success: false, error: error.message || 'Error al actualizar estudiante.' };
  }
}

/**
 * Elimina a un estudiante.
 */
export async function deleteStudent(id) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado.' };
    }

    await dbConnect();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Identificador inválido.' };
    }

    await Student.findByIdAndDelete(id);

    revalidatePath('/admin/examinations/technical');
    return { success: true };
  } catch (error) {
    console.error('Error en deleteStudent:', error);
    return { success: false, error: error.message || 'Error al eliminar estudiante.' };
  }
}

/**
 * Alterna el estado de postulación/matrícula a examen de un estudiante (Listo para examen).
 */
export async function toggleStudentExamPromotion(studentId, isPromoted) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado.' };
    }

    await dbConnect();

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return { success: false, error: 'Identificador de estudiante inválido.' };
    }

    const updated = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          isPromotedForExam: Boolean(isPromoted),
          promotedAt: isPromoted ? new Date() : null
        }
      },
      { new: true }
    ).lean();

    if (!updated) {
      return { success: false, error: 'Estudiante no encontrado.' };
    }

    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      isPromotedForExam: Boolean(updated.isPromotedForExam),
      promotedAt: updated.promotedAt ? updated.promotedAt.toISOString() : null
    };
  } catch (error) {
    console.error('Error en toggleStudentExamPromotion:', error);
    return { success: false, error: error.message || 'Error al actualizar estado para examen.' };
  }
}
